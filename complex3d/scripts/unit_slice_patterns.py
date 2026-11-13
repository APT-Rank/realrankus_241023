"""Pattern-aware orthogonal subdivision of apartment footprints."""

import math

from shapely.affinity import rotate
from shapely.geometry import LineString, box
from shapely.ops import split, unary_union


def _polygon_parts(geometry):
    if geometry is None or geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [part for child in geometry.geoms for part in _polygon_parts(child)]
    return []


def _dominant_orthogonal_angle(footprint):
    orientation_x = 0.0
    orientation_y = 0.0
    total_length = 0.0
    for polygon in _polygon_parts(footprint):
        coordinates = list(polygon.exterior.coords)
        for index in range(len(coordinates) - 1):
            dx = coordinates[index + 1][0] - coordinates[index][0]
            dy = coordinates[index + 1][1] - coordinates[index][1]
            length = math.hypot(dx, dy)
            if length < 0.4:
                continue
            angle = math.atan2(dy, dx)
            orientation_x += length * math.cos(4.0 * angle)
            orientation_y += length * math.sin(4.0 * angle)
            total_length += length

    if total_length and math.hypot(orientation_x, orientation_y) / total_length >= 0.08:
        angle = math.atan2(orientation_y, orientation_x) / 4.0
        while angle > math.pi / 4.0:
            angle -= math.pi / 2.0
        while angle <= -math.pi / 4.0:
            angle += math.pi / 2.0
        return angle

    corners = list(footprint.minimum_rotated_rectangle.exterior.coords)
    edges = [
        (math.hypot(corners[index + 1][0] - corners[index][0],
                    corners[index + 1][1] - corners[index][1]),
         math.atan2(corners[index + 1][1] - corners[index][1],
                    corners[index + 1][0] - corners[index][0]))
        for index in range(len(corners) - 1)
    ]
    return max(edges, default=(0.0, 0.0), key=lambda edge: edge[0])[1]


def _simplified(geometry):
    tolerance = max(1.0, min(2.5, math.sqrt(max(geometry.area, 0.0)) * 0.08))
    return geometry.simplify(tolerance, preserve_topology=True)


def _signed_area(coordinates):
    return 0.5 * sum(
        coordinates[index][0] * coordinates[index + 1][1] -
        coordinates[index + 1][0] * coordinates[index][1]
        for index in range(len(coordinates) - 1)
    )


def _reflex_vertices(geometry):
    simplified = _simplified(geometry)
    if simplified.geom_type != "Polygon":
        return []
    coordinates = list(simplified.exterior.coords)
    points = coordinates[:-1]
    winding = 1.0 if _signed_area(coordinates) >= 0 else -1.0
    vertices = []
    for index in range(len(points)):
        previous = points[index - 1]
        current = points[index]
        following = points[(index + 1) % len(points)]
        first = (current[0] - previous[0], current[1] - previous[1])
        second = (following[0] - current[0], following[1] - current[1])
        cross = first[0] * second[1] - first[1] * second[0]
        scale = max(1.0, math.hypot(*first) * math.hypot(*second))
        if winding * cross < -scale * math.sin(math.radians(8.0)):
            vertices.append(current)
    return vertices


def _axis_alignment(geometry):
    aligned = 0.0
    perimeter = 0.0
    tolerance = math.sin(math.radians(12.0))
    for polygon in _polygon_parts(geometry):
        coordinates = list(polygon.exterior.coords)
        for index in range(len(coordinates) - 1):
            dx = coordinates[index + 1][0] - coordinates[index][0]
            dy = coordinates[index + 1][1] - coordinates[index][1]
            length = math.hypot(dx, dy)
            if length <= 1e-6:
                continue
            perimeter += length
            if min(abs(dx), abs(dy)) / length <= tolerance:
                aligned += length
    return aligned / max(perimeter, 1e-6)


def classify_unit_slice_pattern(footprint):
    """Return a reusable shape family, rather than a per-footprint hash."""
    if footprint is None or footprint.is_empty:
        return "unclassified"
    angle = _dominant_orthogonal_angle(footprint)
    local = rotate(footprint, -math.degrees(angle), origin="centroid")
    simplified = _simplified(local)
    min_x, min_y, max_x, max_y = simplified.bounds
    width = max_x - min_x
    height = max_y - min_y
    aspect = max(width, height) / max(min(width, height), 1e-6)
    alignment = _axis_alignment(simplified)
    reflex_count = len(_reflex_vertices(simplified))

    if alignment < 0.72:
        return "irregular"
    if reflex_count == 0:
        if aspect <= 1.28:
            return "square-compact"
        if aspect >= 3.0:
            return "slab"
        return "linear"
    if reflex_count == 1:
        return "l-shape"
    if reflex_count == 2:
        return "two-notch-wing"
    return "multi-wing"


def _split_at(geometry, axis, coordinate):
    min_x, min_y, max_x, max_y = geometry.bounds
    padding = max(max_x - min_x, max_y - min_y, 1.0) * 2.0
    if axis == "x":
        cutter = LineString([(coordinate, min_y - padding), (coordinate, max_y + padding)])
    else:
        cutter = LineString([(min_x - padding, coordinate), (max_x + padding, coordinate)])
    try:
        parts = [part for part in _polygon_parts(split(geometry, cutter)) if part.area > 0.01]
    except Exception:
        return []
    if len(parts) < 2:
        return []
    area_tolerance = max(0.02, geometry.area * 1e-7)
    if abs(sum(part.area for part in parts) - geometry.area) > area_tolerance:
        return []
    return parts


def _rectangularity(geometry):
    min_x, min_y, max_x, max_y = geometry.bounds
    return min(1.0, geometry.area / max((max_x - min_x) * (max_y - min_y), 1e-6))


def _reflex_split_candidates(geometry, minimum_area=None):
    vertices = _reflex_vertices(geometry)
    if not vertices:
        return []
    minimum_area = max(1.0, minimum_area or geometry.area * 0.035)
    before = len(vertices)
    before_quality = _rectangularity(geometry)
    candidates = []
    tried = set()
    for x, y in vertices:
        for axis, coordinate in (("x", x), ("y", y)):
            key = (axis, round(coordinate, 3))
            if key in tried:
                continue
            tried.add(key)
            parts = _split_at(geometry, axis, coordinate)
            if len(parts) != 2 or min(part.area for part in parts) < minimum_area:
                continue
            remaining_reflex = sum(len(_reflex_vertices(part)) for part in parts)
            quality = sum(part.area * _rectangularity(part) for part in parts) / geometry.area
            if remaining_reflex >= before and quality < before_quality + 0.12:
                continue
            balance = min(part.area for part in parts) / geometry.area
            candidates.append((2.0 * max(0, before - remaining_reflex) +
                               1.5 * (quality - before_quality) + 0.5 * balance,
                               axis, coordinate, parts))
    return candidates


def _area_balanced_split(geometry, minimum_area=None):
    min_x, min_y, max_x, max_y = geometry.bounds
    width = max_x - min_x
    height = max_y - min_y
    axis = "x" if width >= height else "y"
    low, high = (min_x, max_x) if axis == "x" else (min_y, max_y)
    from shapely.geometry import box

    for _ in range(32):
        middle = (low + high) / 2.0
        if axis == "x":
            clipped_area = geometry.intersection(box(min_x - 1, min_y - 1, middle, max_y + 1)).area
        else:
            clipped_area = geometry.intersection(box(min_x - 1, min_y - 1, max_x + 1, middle)).area
        if clipped_area < geometry.area / 2.0:
            low = middle
        else:
            high = middle
    parts = _split_at(geometry, axis, (low + high) / 2.0)
    if len(parts) != 2 or min(part.area for part in parts) < max(1.0, minimum_area or geometry.area * 0.035):
        return []
    return parts


def _partition_wings(geometry, count):
    regions = [geometry]
    minimum_cell_area = geometry.area / count * 0.45
    while len(regions) < count:
        candidates = []
        for region_index, region in enumerate(regions):
            for score, axis, coordinate, parts in _reflex_split_candidates(region, minimum_cell_area):
                candidates.append((score, region.area, region_index, axis, coordinate, parts))
        if candidates:
            _, _, region_index, _, _, parts = max(candidates, key=lambda item: (item[0], item[1]))
        else:
            splittable = []
            for region_index, region in enumerate(regions):
                parts = _area_balanced_split(region, minimum_cell_area)
                if parts:
                    splittable.append((region.area * _rectangularity(region), region_index, parts))
            if not splittable:
                return []
            _, region_index, parts = max(splittable, key=lambda item: item[0])
        regions[region_index:region_index + 1] = parts
    return regions


def _grid_cells(geometry, count):
    min_x, min_y, max_x, max_y = geometry.bounds
    width = max_x - min_x
    height = max_y - min_y
    candidates = []
    for rows in range(1, count + 1):
        if count % rows:
            continue
        columns = count // rows
        cell_aspect = (width / columns) / max(height / rows, 1e-6)
        candidates.append((abs(math.log(max(cell_aspect, 1e-6))) + 0.08 * abs(rows - columns), rows, columns))
    if not candidates:
        return []
    _, rows, columns = min(candidates)
    cells = []
    from shapely.geometry import box

    for row in range(rows):
        bottom = min_y + height * row / rows
        top = min_y + height * (row + 1) / rows
        for column in range(columns):
            left = min_x + width * column / columns
            right = min_x + width * (column + 1) / columns
            clipped = geometry.intersection(box(left, bottom, right, top))
            parts = [part for part in _polygon_parts(clipped) if part.area > 0.01]
            if not parts:
                return []
            cells.append(unary_union(parts))
    return cells


def _parallel_bands(geometry, lines):
    min_x, min_y, max_x, max_y = geometry.bounds
    width = max_x - min_x
    height = max_y - min_y
    axis = "x" if width >= height else "y"
    weights = [max(0.001, float(line.get("count") or line.get("supply") or line.get("exclusive") or 1.0))
               for line in lines]
    total_weight = sum(weights)
    cells = []
    from shapely.geometry import box

    cumulative = 0.0
    low = min_x if axis == "x" else min_y
    high = max_x if axis == "x" else max_y
    for index, weight in enumerate(weights):
        cumulative += weight
        if index == len(weights) - 1:
            upper = high
        else:
            target_area = geometry.area * cumulative / total_weight
            search_low, search_high = low, high
            for _ in range(36):
                middle = (search_low + search_high) / 2.0
                if axis == "x":
                    clipped_area = geometry.intersection(box(min_x - 1, min_y - 1, middle, max_y + 1)).area
                else:
                    clipped_area = geometry.intersection(box(min_x - 1, min_y - 1, max_x + 1, middle)).area
                if clipped_area < target_area:
                    search_low = middle
                else:
                    search_high = middle
            upper = (search_low + search_high) / 2.0
        if axis == "x":
            clipped = geometry.intersection(box(low, min_y - 1, upper, max_y + 1))
        else:
            clipped = geometry.intersection(box(min_x - 1, low, max_x + 1, upper))
        cells.append(unary_union([part for part in _polygon_parts(clipped) if part.area > 0.01]))
        low = upper
    return cells


def _order_cells(cells):
    if not cells:
        return cells
    center_x = sum(cell.centroid.x for cell in cells) / len(cells)
    center_y = sum(cell.centroid.y for cell in cells) / len(cells)
    return sorted(cells, key=lambda cell: math.atan2(cell.centroid.x - center_x,
                                                      cell.centroid.y - center_y))


def precompute_unit_slices(geometry, lines, transformer_to_4326):
    """Partition a footprint with template rules and only orthogonal interior cuts."""
    if geometry is None or geometry.is_empty or not lines or len(lines) < 2:
        return None
    if not geometry.is_valid:
        geometry = geometry.buffer(0)
    parts = _polygon_parts(geometry)
    if not parts:
        return None
    footprint = max(parts, key=lambda part: part.area)
    if footprint.area <= 0:
        return None

    angle = _dominant_orthogonal_angle(footprint)
    local = rotate(footprint, -math.degrees(angle), origin="centroid")
    pattern = classify_unit_slice_pattern(footprint)
    if pattern == "square-compact":
        cells = _grid_cells(local, len(lines))
    elif pattern in ("l-shape", "two-notch-wing", "multi-wing", "irregular"):
        cells = _partition_wings(local, len(lines))
        if not cells:
            cells = _parallel_bands(local, lines)
    else:
        cells = _parallel_bands(local, lines)
    if len(cells) != len(lines):
        return None

    cells = _order_cells(cells)
    ordered_lines = sorted(lines, key=lambda line: (float(line.get("count") or 1.0), str(line.get("line", ""))))
    ordered_cells = sorted(cells, key=lambda cell: cell.area)
    assignments = {str(line["line"]): cell for cell, line in zip(ordered_cells, ordered_lines)}

    union = unary_union(cells)
    area_tolerance = max(0.02, local.area * 1e-7)
    if (local.symmetric_difference(union).area > area_tolerance or
            sum(cell.area for cell in cells) - union.area > area_tolerance):
        return None

    origin = footprint.centroid
    result = []
    for line in lines:
        cell = assignments[str(line["line"])]
        restored = rotate(cell, math.degrees(angle), origin=origin)
        polygons = []
        for polygon in _polygon_parts(restored):
            outer = [list(transformer_to_4326.transform(x, y)) for x, y in polygon.exterior.coords]
            holes = [[list(transformer_to_4326.transform(x, y)) for x, y in ring.coords]
                     for ring in polygon.interiors]
            if len(outer) >= 4:
                polygons.append({
                    "outer": [[round(lng, 10), round(lat, 10)] for lng, lat in outer],
                    "holes": [[[round(lng, 10), round(lat, 10)] for lng, lat in ring] for ring in holes],
                })
        if not polygons:
            return None
        result.append({"line": str(line["line"]), "polygons": polygons})
    return result
