"""Pattern-aware orthogonal subdivision of apartment footprints (v4 — 6-Archetype Red-Line Engine).

Key Improvements in v4:
1. 6-Archetype Classification aligned with Korean apartment floor-plan taxonomy:
   - 01 판상·장축형 (`slab`, `linear`)
   - 02 ㄱ자형 (`l-shape`)
   - 03 T자형 (`t-shape`)
   - 04 십자·H형 (`cross-h`)
   - 05 탑상·컴팩트형 (`square-compact`)
   - 06 계단·복합·기타 (`two-notch-wing`, `multi-wing`, `irregular`)
2. Wing-Neck Decomposition & Orthogonal Direction Switch for 02 ㄱ자형 & 03 T자형:
   - All non-slab shapes (including 90-deg orthogonal L/T/stepped buildings with 1 wall family)
     use the recursive perpendicular cut engine with a Neck/Corner Reflex + Rectangularity Gain
     bonus so vertical wings are sliced horizontally (—) and horizontal wings are sliced vertically (|).
3. Center Cross (+) Partitioner for 04 십자·H형 & 05 탑상·컴팩트형:
   - Divides 4-unit towers with two orthogonal cuts (+) through the central core while preserving
     exact unit area weights; handles 3-unit (T-cut) and 5+ unit multi-wing towers cleanly.
4. Single-Chord Cut Protection for 06 계단·복합·기타:
   - Prevents infinite cut lines from jumping across empty space to slice a second wing in
     stepped, zigzag, or U/T/L footprints.
"""

from collections import deque
import math

from shapely.affinity import rotate
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import polylabel, split, unary_union


MACRO_GROUP_LABELS = {
    "slab": "01 판상·장축형",
    "linear": "01 판상·장축형",
    "l-shape": "02 ㄱ자형",
    "t-shape": "03 T자형",
    "cross-h": "04 십자·H형",
    "square-compact": "05 탑상·컴팩트형",
    "two-notch-wing": "06 계단·복합·기타",
    "multi-wing": "06 계단·복합·기타",
    "irregular": "06 계단·복합·기타",
    "unclassified": "06 계단·복합·기타",
}


def classify_unit_slice_macro_group(pattern):
    """Map detailed pattern code to one of the 6 major visual archetypes."""
    return MACRO_GROUP_LABELS.get(pattern, "06 계단·복합·기타")


def _polygon_parts(geometry):
    if geometry is None or geometry.is_empty:
        return []
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [part for child in geometry.geoms for part in _polygon_parts(child)]
    return []


def _clean_orthogonal_for_classify(geometry):
    """Fill small core/balcony notches (<= 1.5m) with miter joins to preserve 90-deg corners."""
    if geometry is None or geometry.is_empty:
        return geometry
    closed = geometry.buffer(1.5, join_style=2, mitre_limit=2.0).buffer(
        -1.5, join_style=2, mitre_limit=2.0
    )
    if closed.is_empty or not closed.is_valid:
        closed = geometry
    parts = _polygon_parts(closed)
    if not parts:
        closed = geometry
    else:
        closed = max(parts, key=lambda p: p.area)
    tolerance = max(0.8, min(1.8, math.sqrt(max(closed.area, 0.0)) * 0.05))
    return closed.simplify(tolerance, preserve_topology=True)


def _normalize_quarter_turn(angle):
    """Normalize radian angle into (-pi/4, pi/4]."""
    while angle > math.pi / 4.0:
        angle -= math.pi / 2.0
    while angle <= -math.pi / 4.0:
        angle += math.pi / 2.0
    return angle


def _wall_orientation_families(geometry, min_edge_length=2.5, max_families=4):
    """Cluster exterior wall angles (mod 90 deg) to avoid 45-deg/135-deg vector cancellation.
    Filters out minor chamfer/balcony edges so only genuine wing wall directions are returned."""
    clusters = []
    longest_edge = (0.0, 0.0)
    total_perimeter = 0.0

    for polygon in _polygon_parts(geometry):
        coordinates = list(polygon.exterior.coords)
        for index in range(len(coordinates) - 1):
            dx = coordinates[index + 1][0] - coordinates[index][0]
            dy = coordinates[index + 1][1] - coordinates[index][1]
            length = math.hypot(dx, dy)
            if length < 0.4:
                continue
            total_perimeter += length
            edge_angle = math.atan2(dy, dx)
            if length > longest_edge[0]:
                longest_edge = (length, edge_angle)
            if length < min_edge_length:
                continue

            s4 = math.sin(4.0 * edge_angle)
            c4 = math.cos(4.0 * edge_angle)
            weight = length ** 1.3
            merged = False
            for cluster in clusters:
                mean_ang = math.atan2(cluster[0], cluster[1]) / 4.0
                diff = abs(
                    (edge_angle - mean_ang + math.pi / 4.0) % (math.pi / 2.0) - math.pi / 4.0
                )
                if diff <= math.radians(7.5):
                    cluster[0] += weight * s4
                    cluster[1] += weight * c4
                    cluster[2] += length
                    cluster[3] = max(cluster[3], length)
                    merged = True
                    break
            if not merged:
                clusters.append([weight * s4, weight * c4, length, length])

    clusters.sort(key=lambda item: item[2], reverse=True)
    angles = []
    for idx, (s4, c4, total_len, max_edge_len) in enumerate(clusters[:max_families]):
        if idx > 0:
            if total_len < max(8.5, total_perimeter * 0.10) and max_edge_len < 6.5:
                continue
        ang = _normalize_quarter_turn(math.atan2(s4, c4) / 4.0)
        if not any(
            abs((ang - existing + math.pi / 4.0) % (math.pi / 2.0) - math.pi / 4.0)
            < math.radians(5.0)
            for existing in angles
        ):
            angles.append(ang)

    if not angles:
        angles.append(_normalize_quarter_turn(longest_edge[1] if longest_edge[0] > 0.0 else 0.0))
    return angles


def _dominant_wall_angle(geometry, min_edge_length=2.5):
    """Return primary exterior wall orientation without diagonal MBR fallback."""
    return _wall_orientation_families(geometry, min_edge_length=min_edge_length)[0]


def _signed_area(coordinates):
    return 0.5 * sum(
        coordinates[index][0] * coordinates[index + 1][1]
        - coordinates[index + 1][0] * coordinates[index][1]
        for index in range(len(coordinates) - 1)
    )


def _reflex_vertices(geometry):
    cleaned = _clean_orthogonal_for_classify(geometry)
    if cleaned is None or cleaned.geom_type != "Polygon":
        return []
    coordinates = list(cleaned.exterior.coords)
    points = coordinates[:-1]
    if len(points) < 4:
        return []
    winding = 1.0 if _signed_area(coordinates) >= 0 else -1.0
    vertices = []
    for index in range(len(points)):
        previous = points[index - 1]
        current = points[index]
        following = points[(index + 1) % len(points)]
        first = (current[0] - previous[0], current[1] - previous[1])
        second = (following[0] - current[0], following[1] - current[1])
        len1 = math.hypot(*first)
        len2 = math.hypot(*second)
        if min(len1, len2) < 2.2:
            continue
        cross = first[0] * second[1] - first[1] * second[0]
        scale = max(1.0, len1 * len2)
        if winding * cross < -scale * math.sin(math.radians(15.0)):
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


def _grid_3x3_fills(cleaned):
    """Compute 3x3 occupancy matrix (rows 0..2 from bottom to top, cols 0..2 from left to right)."""
    min_x, min_y, max_x, max_y = cleaned.bounds
    w = max_x - min_x
    h = max_y - min_y
    cell_area = (w / 3.0) * (h / 3.0)
    if cell_area <= 1e-6:
        return [[0.0] * 3 for _ in range(3)]
    grid = []
    for r in range(3):
        y0 = min_y + h * r / 3.0
        y1 = min_y + h * (r + 1) / 3.0
        row = []
        for c in range(3):
            x0 = min_x + w * c / 3.0
            x1 = min_x + w * (c + 1) / 3.0
            row.append(cleaned.intersection(box(x0, y0, x1, y1)).area / cell_area)
        grid.append(row)
    return grid


def _is_macro_l_shape(cleaned):
    """02 ㄱ자형: 1 corner quadrant of the 2x2 bounding box is empty, 3 quadrants are occupied."""
    if cleaned is None or cleaned.is_empty:
        return False
    min_x, min_y, max_x, max_y = cleaned.bounds
    width = max_x - min_x
    height = max_y - min_y
    bbox_area = width * height
    if bbox_area <= 1e-6:
        return False
    rect = cleaned.area / bbox_area
    if not (0.35 <= rect <= 0.78):
        return False
    mid_x = 0.5 * (min_x + max_x)
    mid_y = 0.5 * (min_y + max_y)
    quad_area = bbox_area * 0.25
    quad_fills = sorted(
        cleaned.intersection(box(ax, ay, bx, by)).area / quad_area
        for ax, bx in ((min_x, mid_x), (mid_x, max_x))
        for ay, by in ((min_y, mid_y), (mid_y, max_y))
    )
    return quad_fills[0] <= 0.15 and quad_fills[1] >= 0.35


def _is_macro_t_shape(cleaned):
    """03 T자형: On one side of the 3x3 grid, both corners are empty while the middle stem is full;
    on the opposite side, the crossbar spans across."""
    if cleaned is None or cleaned.is_empty:
        return False
    min_x, min_y, max_x, max_y = cleaned.bounds
    bbox_area = (max_x - min_x) * (max_y - min_y)
    if bbox_area <= 1e-6:
        return False
    rect = cleaned.area / bbox_area
    if not (0.38 <= rect <= 0.80):
        return False
    g = _grid_3x3_fills(cleaned)
    if g[1][1] < 0.40:
        return False

    # Check 4 orientations of T:
    # 1. Stem at bottom (r=0), bar at top (r=2) or middle (r=1)
    if g[0][0] <= 0.24 and g[0][2] <= 0.24 and g[0][1] >= 0.35:
        if (g[2][0] >= 0.32 and g[2][2] >= 0.32) or (g[1][0] >= 0.45 and g[1][2] >= 0.45 and (g[2][0] <= 0.24 or g[2][2] <= 0.24)):
            if not (g[2][0] <= 0.24 and g[2][2] <= 0.24):
                return True
    # 2. Stem at top (r=2), bar at bottom (r=0) or middle (r=1)
    if g[2][0] <= 0.24 and g[2][2] <= 0.24 and g[2][1] >= 0.35:
        if (g[0][0] >= 0.32 and g[0][2] >= 0.32) or (g[1][0] >= 0.45 and g[1][2] >= 0.45):
            if not (g[0][0] <= 0.24 and g[0][2] <= 0.24):
                return True
    # 3. Stem at left (c=0), bar at right (c=2) or middle (c=1)
    if g[0][0] <= 0.24 and g[2][0] <= 0.24 and g[1][0] >= 0.35:
        if (g[0][2] >= 0.32 and g[2][2] >= 0.32) or (g[0][1] >= 0.45 and g[2][1] >= 0.45):
            if not (g[0][2] <= 0.24 and g[2][2] <= 0.24):
                return True
    # 4. Stem at right (c=2), bar at left (c=0) or middle (c=1)
    if g[0][2] <= 0.24 and g[2][2] <= 0.24 and g[1][2] >= 0.35:
        if (g[0][0] >= 0.32 and g[2][0] >= 0.32) or (g[0][1] >= 0.45 and g[2][1] >= 0.45):
            if not (g[0][0] <= 0.24 and g[2][0] <= 0.24):
                return True
    return False


def _is_macro_cross_or_h(cleaned, reflex_count, line_count=None):
    """04 십자·H형: Central core with 4 symmetric wings (+) or H-shaped twin wings."""
    if cleaned is None or cleaned.is_empty or reflex_count < 3:
        return False
    min_x, min_y, max_x, max_y = cleaned.bounds
    width = max_x - min_x
    height = max_y - min_y
    bbox_area = width * height
    if bbox_area <= 1e-6:
        return False
    aspect = max(width, height) / max(min(width, height), 1e-6)
    rect = cleaned.area / bbox_area
    if aspect > 2.1 or not (0.36 <= rect <= 0.82):
        return False

    g = _grid_3x3_fills(cleaned)
    corners = [g[0][0], g[0][2], g[2][0], g[2][2]]
    arms = [g[0][1], g[2][1], g[1][0], g[1][2]]

    # Plus (+) shape: at least 3 corners low, center & arms high
    if sum(1 for c in corners if c <= 0.28) >= 3 and g[1][1] >= 0.45 and min(arms) >= 0.35:
        return True

    # H-shape: 4 corners occupied, center occupied, two opposite middle edges notched
    if min(corners) >= 0.35 and g[1][1] >= 0.40:
        if (g[0][1] <= 0.45 and g[2][1] <= 0.45) or (g[1][0] <= 0.45 and g[1][2] <= 0.45):
            return True

    # Compact 4-wing tower with balanced quadrant occupancy
    mid_x = 0.5 * (min_x + max_x)
    mid_y = 0.5 * (min_y + max_y)
    quad_area = bbox_area * 0.25
    quad_fills = sorted(
        cleaned.intersection(box(ax, ay, bx, by)).area / quad_area
        for ax, bx in ((min_x, mid_x), (mid_x, max_x))
        for ay, by in ((min_y, mid_y), (mid_y, max_y))
    )
    if (
        aspect <= 1.55
        and reflex_count >= 4
        and quad_fills[0] >= 0.30
        and (quad_fills[3] - quad_fills[0]) <= 0.32
        and (line_count is None or line_count in (3, 4, 5, 6))
    ):
        return True
    return False


def classify_unit_slice_pattern(footprint, line_count=None):
    """Classify building footprint into the v4 pattern taxonomy."""
    if footprint is None or footprint.is_empty:
        return "unclassified"
    angle = _dominant_wall_angle(footprint)
    local = rotate(footprint, -math.degrees(angle), origin="centroid")
    cleaned = _clean_orthogonal_for_classify(local)
    min_x, min_y, max_x, max_y = cleaned.bounds
    width = max_x - min_x
    height = max_y - min_y
    aspect = max(width, height) / max(min(width, height), 1e-6)
    rect = cleaned.area / max(width * height, 1e-6)
    alignment = _axis_alignment(cleaned)
    reflex_count = len(_reflex_vertices(cleaned))

    if alignment < 0.72:
        return "irregular"
    if reflex_count == 0:
        if aspect <= 1.32 and (line_count is None or line_count <= 6):
            return "square-compact"
        if aspect >= 3.0:
            return "slab"
        return "linear"
    if rect >= 0.85 and reflex_count <= 2:
        if aspect <= 1.32 and (line_count is None or line_count <= 6):
            return "square-compact"
        return "slab" if aspect >= 3.0 else "linear"
    if _is_macro_l_shape(cleaned):
        return "l-shape"
    if _is_macro_t_shape(cleaned):
        return "t-shape"
    if _is_macro_cross_or_h(cleaned, reflex_count, line_count=line_count):
        return "cross-h"
    if aspect <= 1.32 and rect >= 0.72 and (line_count is None or line_count <= 6):
        return "square-compact"
    if reflex_count == 1:
        return "l-shape"
    if reflex_count == 2:
        return "two-notch-wing"
    return "multi-wing"


def _min_thickness(geometry):
    if geometry is None or geometry.is_empty:
        return 0.0
    angles = _wall_orientation_families(geometry, min_edge_length=2.0, max_families=2)
    origin = geometry.centroid
    best_min = 0.0
    for ang in angles:
        rot = rotate(geometry, -math.degrees(ang), origin=origin)
        min_x, min_y, max_x, max_y = rot.bounds
        best_min = max(best_min, min(max_x - min_x, max_y - min_y))
    return best_min


def _cut_line_length(geometry, axis, coordinate):
    """Measure the exact interior cut length and segment count at `coordinate` along `axis`."""
    min_x, min_y, max_x, max_y = geometry.bounds
    padding = max(max_x - min_x, max_y - min_y, 1.0) * 2.0
    if axis == "x":
        cutter = LineString([(coordinate, min_y - padding), (coordinate, max_y + padding)])
    else:
        cutter = LineString([(min_x - padding, coordinate), (max_x + padding, coordinate)])
    inter = geometry.intersection(cutter)
    if inter.is_empty:
        return float("inf"), 99
    if hasattr(inter, "geoms"):
        segs = [g for g in inter.geoms if g.length > 1e-3]
        return sum(g.length for g in segs), max(1, len(segs))
    return inter.length, 1


def _rectangularity(geometry):
    if geometry is None or geometry.is_empty:
        return 0.0
    min_x, min_y, max_x, max_y = geometry.bounds
    return min(1.0, geometry.area / max((max_x - min_x) * (max_y - min_y), 1e-6))


def _min_polygon_corner_deg(geometry, min_edge=1.2, use_opening=False):
    """Return minimum corner angle (in degrees, 0..180) across all polygon parts."""
    if geometry is None or geometry.is_empty:
        return 180.0
    target_geom = geometry
    if use_opening:
        try:
            opened = geometry.buffer(-0.55, join_style=2, mitre_limit=1.5).buffer(
                0.55, join_style=2, mitre_limit=1.5
            )
            if not opened.is_empty and opened.area >= geometry.area * 0.70:
                target_geom = opened
        except Exception:
            pass
    min_deg = 180.0
    for poly in _polygon_parts(target_geom):
        simp = poly.simplify(0.25, preserve_topology=True)
        if simp.is_empty or simp.geom_type != "Polygon":
            continue
        pts = list(simp.exterior.coords)[:-1]
        if len(pts) < 3:
            continue
        for i in range(len(pts)):
            p0 = pts[i - 1]
            p1 = pts[i]
            p2 = pts[(i + 1) % len(pts)]
            v1 = (p0[0] - p1[0], p0[1] - p1[1])
            v2 = (p2[0] - p1[0], p2[1] - p1[1])
            l1 = math.hypot(*v1)
            l2 = math.hypot(*v2)
            if min(l1, l2) < min_edge:
                continue
            cos_a = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)))
            ang = math.degrees(math.acos(cos_a))
            if ang < min_deg:
                min_deg = ang
    return min_deg


def _cell_min_rotated_dims(geometry):
    """Return (long_side, short_side, aspect_ratio) of a polygon's minimum rotated rectangle."""
    if geometry is None or geometry.is_empty:
        return 0.0, 0.0, 99.0
    target = geometry
    try:
        opened = geometry.buffer(-0.45, join_style=2, mitre_limit=1.5).buffer(
            0.45, join_style=2, mitre_limit=1.5
        )
        if not opened.is_empty and opened.area >= geometry.area * 0.72:
            target = opened
    except Exception:
        pass
    try:
        mrr = target.minimum_rotated_rectangle
        if mrr.geom_type == "Polygon":
            coords = list(mrr.exterior.coords)
            e1 = math.hypot(coords[1][0] - coords[0][0], coords[1][1] - coords[0][1])
            e2 = math.hypot(coords[2][0] - coords[1][0], coords[2][1] - coords[1][1])
            long_s = max(e1, e2)
            short_s = max(min(e1, e2), 1e-3)
            return long_s, short_s, long_s / short_s
    except Exception:
        pass
    min_x, min_y, max_x, max_y = target.bounds
    w, h = max_x - min_x, max_y - min_y
    long_s, short_s = max(w, h), max(min(w, h), 1e-3)
    return long_s, short_s, long_s / short_s


def _rectify_acute_corners_between_cells(cells, footprint, min_allowed_deg=62.0):
    """Eliminate grazing spikes and <= 60-deg acute cut corners by:
    1) Morphological opening transfer of thin grazing wall slivers (< 1.2m wide),
    2) Dropping a 90-deg perpendicular from the internal cut line onto the exterior wall
       to transfer any acute triangular wedge tip (<= 62 deg) to its adjacent cell."""
    if not cells or len(cells) < 2:
        return cells
    cells = [unary_union(_polygon_parts(c)) for c in cells]
    orig_min = _min_polygon_corner_deg(footprint)
    target_deg = min(min_allowed_deg, max(45.0, orig_min - 2.0))

    # Pass 1: Shave thin grazing spikes (< 1.2m wide) caused by cuts nearly parallel to a step wall
    for _ in range(3):
        for i in range(len(cells)):
            if _min_polygon_corner_deg(cells[i]) > target_deg:
                continue
            eroded = unary_union(
                _polygon_parts(cells[i].buffer(-0.62, join_style=2, mitre_limit=1.5))
            )
            if eroded.is_empty:
                continue
            opened = eroded.buffer(0.62, join_style=2, mitre_limit=1.5)
            if opened.is_empty:
                continue
            diff = cells[i].difference(opened)
            for raw_spike in _polygon_parts(diff):
                if raw_spike.area <= 1e-4 or raw_spike.area > cells[i].area * 0.10:
                    continue
                best_update = None
                before_i_mc = _min_polygon_corner_deg(cells[i])
                for pad_r in (0.04, 0.15, 0.32):
                    spike = cells[i].intersection(raw_spike.buffer(pad_r, join_style=2))
                    if spike.is_empty or spike.area > cells[i].area * 0.12:
                        continue
                    for j in range(len(cells)):
                        if i == j:
                            continue
                        shared = spike.buffer(0.08).intersection(cells[j].buffer(0.08)).area
                        if shared <= 0.02:
                            continue
                        cand_i = unary_union(
                            [
                                p
                                for p in _polygon_parts(cells[i].difference(spike.buffer(0.005)))
                                if p.area > 0.05
                            ]
                        )
                        removed_piece = cells[i].difference(cand_i)
                        cand_j = unary_union(
                            _polygon_parts(
                                cells[j].union(removed_piece)
                            )
                        )
                        if (
                            not cand_i.is_empty
                            and len(_polygon_parts(cand_i)) == 1
                            and len(_polygon_parts(cand_j)) == 1
                        ):
                            after_mc = min(
                                _min_polygon_corner_deg(cand_i),
                                _min_polygon_corner_deg(cand_j),
                            )
                            if after_mc > before_i_mc + 5.0:
                                score = (round(after_mc, 1), shared)
                                if best_update is None or score > best_update[0]:
                                    best_update = (score, j, cand_i, cand_j)
                if best_update is not None:
                    _, best_j, new_i, new_j = best_update
                    cells[i] = new_i
                    cells[best_j] = new_j

    # Pass 2: Right-angle wedge rectification (drop 90-deg perpendicular to exterior wall)
    for _ in range(4):
        changed = False
        for i in range(len(cells)):
            polys = _polygon_parts(cells[i])
            if len(polys) != 1:
                continue
            simp = polys[0].simplify(0.25, preserve_topology=True)
            if simp.is_empty or simp.geom_type != "Polygon":
                continue
            pts = list(simp.exterior.coords)[:-1]
            if len(pts) < 3:
                continue

            for idx in range(len(pts)):
                p_prev = pts[idx - 1]
                p_curr = pts[idx]
                p_next = pts[(idx + 1) % len(pts)]
                v1 = (p_prev[0] - p_curr[0], p_prev[1] - p_curr[1])
                v2 = (p_next[0] - p_curr[0], p_next[1] - p_curr[1])
                l1 = math.hypot(*v1)
                l2 = math.hypot(*v2)
                if min(l1, l2) < 1.2:
                    continue
                cos_a = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2)))
                ang_deg = math.degrees(math.acos(cos_a))
                if ang_deg > target_deg:
                    continue

                # Find adjacent cell sharing one of the two edges at p_curr
                u1 = (v1[0] / l1, v1[1] / l1)
                u2 = (v2[0] / l2, v2[1] / l2)
                probe1 = (p_curr[0] + u1[0] * min(2.0, l1 * 0.5), p_curr[1] + u1[1] * min(2.0, l1 * 0.5))
                probe2 = (p_curr[0] + u2[0] * min(2.0, l2 * 0.5), p_curr[1] + u2[1] * min(2.0, l2 * 0.5))

                best_j = None
                cut_is_1 = True
                best_dist = 0.5
                for j in range(len(cells)):
                    if i == j:
                        continue
                    d1 = cells[j].distance(Point(probe1))
                    d2 = cells[j].distance(Point(probe2))
                    if d1 < best_dist and d1 <= d2:
                        best_dist = d1
                        best_j = j
                        cut_is_1 = True
                    elif d2 < best_dist and d2 < d1:
                        best_dist = d2
                        best_j = j
                        cut_is_1 = False

                if best_j is None:
                    continue

                u_cut, l_cut = (u1, l1) if cut_is_1 else (u2, l2)
                u_wall, l_wall = (u2, l2) if cut_is_1 else (u1, l1)
                theta_rad = math.radians(ang_deg)
                cos_t = max(0.15, math.cos(theta_rad))

                d_cut_perp = min(l_cut * 0.48, (l_wall * 0.85) / cos_t, 5.5)
                d_wall_perp = min(l_wall * 0.90, d_cut_perp * cos_t)

                # Try both: (1) 90-deg perpendicular projection onto wall, (2) snapping to the end of short bend wall
                candidates_qr = []
                if d_cut_perp >= 0.8 and d_wall_perp >= 0.8:
                    candidates_qr.append((d_cut_perp, d_wall_perp))
                if l_wall <= 6.5 and l_cut >= 2.0:
                    for ratio in (0.25, 0.38, 0.50):
                        candidates_qr.append((min(l_cut * ratio, 6.0), l_wall * 0.98))

                rectified = False
                for d_cut, d_wall in candidates_qr:
                    q_pt = (p_curr[0] + u_cut[0] * d_cut, p_curr[1] + u_cut[1] * d_cut)
                    r_pt = (p_curr[0] + u_wall[0] * d_wall, p_curr[1] + u_wall[1] * d_wall)
                    qr_dx = r_pt[0] - q_pt[0]
                    qr_dy = r_pt[1] - q_pt[1]
                    qr_len = math.hypot(qr_dx, qr_dy)
                    if qr_len < 0.4:
                        continue
                    ux_qr, uy_qr = qr_dx / qr_len, qr_dy / qr_len
                    ext_qr = LineString([
                        (q_pt[0] - ux_qr * 1.2, q_pt[1] - uy_qr * 1.2),
                        (r_pt[0] + ux_qr * 1.2, r_pt[1] + uy_qr * 1.2),
                    ])
                    try:
                        split_parts = [p for p in _polygon_parts(split(cells[i], ext_qr)) if p.area > 0.02]
                    except Exception:
                        continue
                    if len(split_parts) != 2:
                        continue
                    split_parts.sort(key=lambda p: p.area, reverse=True)
                    cand_i, wedge = split_parts[0], split_parts[1]
                    if wedge.area > cells[i].area * 0.25:
                        continue

                    removed_wedge = cells[i].difference(cand_i)
                    cand_j = unary_union(_polygon_parts(cells[best_j].union(removed_wedge)))
                    if (
                        not cand_i.is_empty
                        and len(_polygon_parts(cand_i)) == 1
                        and len(_polygon_parts(cand_j)) == 1
                    ):
                        before_min = min(_min_polygon_corner_deg(cells[i]), _min_polygon_corner_deg(cells[best_j]))
                        after_min = min(_min_polygon_corner_deg(cand_i), _min_polygon_corner_deg(cand_j))
                        if after_min > before_min + 2.0:
                            cells[i] = cand_i
                            cells[best_j] = cand_j
                            changed = True
                            rectified = True
                            break
                if rectified:
                    break
        if not changed:
            break
    return cells


def _single_chord_split_variants(rot_geom, axis, cut_coord):
    """When an infinite cut line intersects a polygon in 2 segments (e.g., jumping across
    empty space in an L/T/U/stepped building), also test splitting by each individual chord
    so only ONE wing is cut."""
    min_x, min_y, max_x, max_y = rot_geom.bounds
    if axis == "x":
        low_box = rot_geom.intersection(box(min_x - 1.0, min_y - 1.0, cut_coord, max_y + 1.0))
        high_box = rot_geom.intersection(box(cut_coord, min_y - 1.0, max_x + 1.0, max_y + 1.0))
        cutter = LineString([(cut_coord, min_y - 2.0), (cut_coord, max_y + 2.0)])
    else:
        low_box = rot_geom.intersection(box(min_x - 1.0, min_y - 1.0, max_x + 1.0, cut_coord))
        high_box = rot_geom.intersection(box(min_x - 1.0, cut_coord, max_x + 1.0, max_y + 1.0))
        cutter = LineString([(min_x - 2.0, cut_coord), (max_x + 2.0, cut_coord)])

    inter = rot_geom.intersection(cutter)
    if inter.is_empty:
        return []

    variants = []
    segs = [g for g in inter.geoms if g.length > 1e-3] if hasattr(inter, "geoms") else [inter]
    seg_count = len(segs)
    total_len = sum(g.length for g in segs)

    low_polys = [p for p in _polygon_parts(low_box) if p.area > 0.05]
    high_polys = [p for p in _polygon_parts(high_box) if p.area > 0.05]
    if low_polys and high_polys and seg_count <= 2:
        variants.append((total_len, seg_count, low_polys, high_polys, segs))

    # If the infinite line hits 2 wings (seg_count >= 2), try splitting by each single chord alone
    if seg_count >= 2 and seg_count <= 4 and rot_geom.geom_type == "Polygon":
        for seg in segs:
            coords = list(seg.coords)
            if len(coords) < 2:
                continue
            (x0, y0), (x1, y1) = coords[0], coords[-1]
            dx, dy = x1 - x0, y1 - y0
            ln = math.hypot(dx, dy)
            if ln < 0.5:
                continue
            ux, uy = dx / ln, dy / ln
            ext_chord = LineString([(x0 - ux * 0.15, y0 - uy * 0.15), (x1 + ux * 0.15, y1 + uy * 0.15)])
            try:
                pieces = [p for p in _polygon_parts(split(rot_geom, ext_chord)) if p.area > 0.05]
            except Exception:
                continue
            if len(pieces) == 2:
                # Order pieces along `axis`
                pieces.sort(key=lambda p: p.centroid.x if axis == "x" else p.centroid.y)
                variants.append((ln, 1, [pieces[0]], [pieces[1]], [seg]))

    return variants


def _cut_wall_perp_and_ext_metrics(rot_geom, rot_orig_boundary, cut_segs, axis):
    """Evaluate how many endpoints of `cut_segs` touch the original exterior boundary (`ext_touches`)
    and whether the cut is perpendicular (90 deg) to the exterior walls at those endpoints."""
    if not cut_segs:
        return 0, 0.0
    seg = max(cut_segs, key=lambda s: s.length)
    coords = list(seg.coords)
    if len(coords) < 2:
        return 0, 0.0
    pt0 = Point(coords[0])
    pt1 = Point(coords[-1])
    t0 = rot_orig_boundary.distance(pt0) <= 0.48
    t1 = rot_orig_boundary.distance(pt1) <= 0.48
    ext_touches = int(t0) + int(t1)

    perp_penalty = 0.0
    if rot_geom.geom_type == "Polygon":
        ring = list(rot_geom.exterior.coords)
        edges = []
        for i in range(len(ring) - 1):
            x0, y0 = ring[i]
            x1, y1 = ring[i + 1]
            el = math.hypot(x1 - x0, y1 - y0)
            if el >= 3.0:
                edges.append((LineString([(x0, y0), (x1, y1)]), abs(x1 - x0), abs(y1 - y0), el))
        endpoint_devs = []
        for pt, touches in ((pt0, t0), (pt1, t1)):
            if not touches:
                continue
            near_devs = []
            for edge_ls, adx, ady, el in edges:
                if edge_ls.distance(pt) <= 1.8:
                    # Cut along 'x' is vertical -> perpendicular wall is horizontal (ady == 0)
                    sin_dev = (ady / el) if axis == "x" else (adx / el)
                    dev_deg = math.degrees(math.asin(min(1.0, max(0.0, sin_dev))))
                    near_devs.append(dev_deg)
            if near_devs:
                endpoint_devs.append(min(near_devs))
        if endpoint_devs:
            best_dev = min(endpoint_devs)
            worst_dev = max(endpoint_devs)
            if best_dev > 8.0:
                # Neither endpoint is perpendicular to the wing wall it touches
                perp_penalty += 8.0 * (best_dev - 6.0)
            elif len(endpoint_devs) == 2 and worst_dev > 14.0:
                # One endpoint is perpendicular, the other meets an angled junction wall
                perp_penalty += 0.35 * (worst_dev - 14.0)

    return ext_touches, perp_penalty


def _cell_aspect_and_width_penalty(poly_rot, num_units):
    """Penalize unnatural long-skinny rectangular units ('긴 영역이 가로로 잘리는 케이스 방지')."""
    long_s, short_s, aspect = _cell_min_rotated_dims(poly_rot)
    pen = 0.0
    if num_units == 1:
        if aspect > 2.55:
            pen += 850.0 + 400.0 * ((aspect - 2.55) ** 2)
        elif aspect > 1.80:
            pen += 28.0 * ((aspect - 1.80) ** 2)
        if short_s < 6.5:
            pen += 750.0 + 250.0 * ((6.5 - short_s) ** 2)
    else:
        if short_s < 7.2:
            pen += 950.0 + 300.0 * ((7.2 - short_s) ** 2)
    return pen


def _recursive_shortest_perpendicular_partition(
    geometry,
    ordered_lines,
    global_angle=0.0,
    candidate_angles=None,
    orig_boundary=None,
    _is_root=True,
):
    """Recursively slice `geometry` according to `ordered_lines` weights:
    - Tests all exterior wall orientation families and both orthogonal axes (x, y).
    - Prioritizes single-chord perpendicular cuts with the shortest cross-section.
    - Prevents lengthwise wing cuts (high aspect ratio cells or internal-to-internal cuts).
    - Allows 3-wing Y/T towers to peel single-unit wings at their physical necks first,
      then splits the remaining double-unit wing + central core down its centerline.
    """
    n = len(ordered_lines)
    if n == 1:
        return [geometry]

    if orig_boundary is None:
        orig_boundary = geometry.boundary

    if candidate_angles is None:
        candidate_angles = _wall_orientation_families(geometry, min_edge_length=2.0)
    else:
        local_cands = _wall_orientation_families(geometry, min_edge_length=2.0)
        merged_cands = list(candidate_angles)
        for lc in local_cands:
            if not any(
                abs((lc - c + math.pi / 4.0) % (math.pi / 2.0) - math.pi / 4.0)
                < math.radians(4.0)
                for c in merged_cands
            ):
                merged_cands.append(lc)
        candidate_angles = merged_cands

    weights = [
        max(0.001, float(ln.get("count") or ln.get("supply") or ln.get("exclusive") or 1.0))
        for ln in ordered_lines
    ]
    total_weight = sum(weights)
    nearly_equal_weights = (max(weights) / max(min(weights), 1e-6)) <= 1.25
    origin = geometry.centroid
    _, parent_short_s, _ = _cell_min_rotated_dims(geometry)
    best_choice = None  # (score, k, part_first, part_second)

    for ang in candidate_angles:
        rot_geom = rotate(geometry, -math.degrees(ang), origin=origin)
        rot_orig_boundary = rotate(orig_boundary, -math.degrees(ang), origin=origin)
        min_x, min_y, max_x, max_y = rot_geom.bounds
        before_rect = _rectangularity(rot_geom)
        before_min_corner = _min_polygon_corner_deg(rot_geom, use_opening=True)
        reflex_pts = _reflex_vertices(rot_geom)
        int_boundary = rot_geom.boundary.difference(rot_orig_boundary.buffer(0.35))
        has_int_boundary = int_boundary.length >= 6.0

        for axis in ("x", "y"):
            span = (max_x - min_x) if axis == "x" else (max_y - min_y)
            if span < 1e-3:
                continue
            reflex_coords = [pt[0] if axis == "x" else pt[1] for pt in reflex_pts]

            from_high_options = (False,) if (max(weights) == min(weights)) else (False, True)
            k_candidates = range(1, n) if n <= 6 else sorted({1, 2, n // 2, n - 2, n - 1})
            for from_high in from_high_options:
                for k in k_candidates:
                    has_neck_snap = (
                        len(candidate_angles) >= 2
                        and 3 <= n <= 6
                        and (k == 1 or k == n - 1)
                        and bool(reflex_coords)
                    )
                    first_ratio_nom = sum(weights[:k]) / total_weight
                    req_nom = (1.0 - first_ratio_nom) if from_high else first_ratio_nom

                    # Measure nominal cut length at 1.00 * first_ratio_nom
                    low = min_x if axis == "x" else min_y
                    high = max_x if axis == "x" else max_y
                    for _ in range(30):
                        mid = 0.5 * (low + high)
                        if axis == "x":
                            clipped_a = rot_geom.intersection(
                                box(min_x - 1.0, min_y - 1.0, mid, max_y + 1.0)
                            ).area
                        else:
                            clipped_a = rot_geom.intersection(
                                box(min_x - 1.0, min_y - 1.0, max_x + 1.0, mid)
                            ).area
                        if clipped_a < geometry.area * req_nom:
                            low = mid
                        else:
                            high = mid
                    cut_coord_nom = 0.5 * (low + high)
                    nom_cut_len, _ = _cut_line_length(rot_geom, axis, cut_coord_nom)

                    ratio_multipliers = [1.00]
                    if has_neck_snap:
                        ratio_multipliers = [0.64, 0.70, 0.76, 0.84, 0.92, 1.00]

                    for r_mult in ratio_multipliers:
                        if r_mult < 1.00:
                            if k == 1:
                                first_ratio = first_ratio_nom * r_mult
                            else:
                                first_ratio = 1.0 - (1.0 - first_ratio_nom) * r_mult
                            req_low_ratio = (1.0 - first_ratio) if from_high else first_ratio
                            low = min_x if axis == "x" else min_y
                            high = max_x if axis == "x" else max_y
                            for _ in range(28):
                                mid = 0.5 * (low + high)
                                if axis == "x":
                                    clipped_a = rot_geom.intersection(
                                        box(min_x - 1.0, min_y - 1.0, mid, max_y + 1.0)
                                    ).area
                                else:
                                    clipped_a = rot_geom.intersection(
                                        box(min_x - 1.0, min_y - 1.0, max_x + 1.0, mid)
                                    ).area
                                if clipped_a < geometry.area * req_low_ratio:
                                    low = mid
                                else:
                                    high = mid
                            cut_coord = 0.5 * (low + high)
                        else:
                            first_ratio = first_ratio_nom
                            cut_coord = cut_coord_nom

                        variants = _single_chord_split_variants(rot_geom, axis, cut_coord)
                        for cut_len, seg_count, low_polys, high_polys, cut_segs in variants:
                            if cut_len <= 1e-4 or seg_count > 2:
                                continue

                            p_first_rot = unary_union(high_polys if from_high else low_polys)
                            p_second_rot = unary_union(low_polys if from_high else high_polys)

                            actual_first_ratio = p_first_rot.area / max(geometry.area, 1e-6)
                            if abs(actual_first_ratio - first_ratio) > 0.015:
                                continue

                            min_rdist = (
                                min(abs(cut_coord - rc) for rc in reflex_coords)
                                if reflex_coords
                                else 99.0
                            )
                            if r_mult < 1.00:
                                # Only allow neck-snap (< 1.00 area ratio) right at a genuine wing neck
                                # where the cross-section is at least 18% narrower than at nominal ratio
                                if not (
                                    seg_count == 1
                                    and min_rdist <= 2.2
                                    and cut_len <= 0.82 * nom_cut_len
                                ):
                                    continue

                            island_penalty = (len(low_polys) - 1) * 400.0 + (
                                len(high_polys) - 1
                            ) * 400.0
                            seg_penalty = (seg_count - 1) * 160.0
                            neck_dev_pen = 10.0 * abs(1.0 - r_mult)

                            # Check exterior wall touch count and perpendicularity at cut endpoints
                            ext_touches, wall_perp_penalty = _cut_wall_perp_and_ext_metrics(
                                rot_geom, rot_orig_boundary, cut_segs, axis
                            )
                            ext_penalty = 0.0
                            if ext_touches == 0:
                                # Forbid cutting from one internal cut line to another internal cut line
                                # (e.g., slicing the middle of a slab front-to-back like 5865 207동 03|04)
                                ext_penalty = 3000.0
                            elif ext_touches == 1 and parent_short_s < 14.2:
                                # Forbid slicing the end of a single-thickness wing lengthwise
                                ext_penalty = 1200.0

                            # Exact branch-and-bound check 1 (max possible bonus is <= 21.0)
                            if (
                                best_choice is not None
                                and (
                                    cut_len
                                    + seg_penalty
                                    + island_penalty
                                    + ext_penalty
                                    + wall_perp_penalty
                                    + neck_dev_pen
                                    - 21.0
                                )
                                >= best_choice[0]
                            ):
                                continue

                            # Penalize unnatural skinny rectangular cells (e.g., 119854 121동 02|03)
                            aspect_penalty = _cell_aspect_and_width_penalty(
                                p_first_rot, k
                            ) + _cell_aspect_and_width_penalty(p_second_rot, n - k)

                            # When splitting a 2-unit piece with an existing internal core boundary (e.g. 106동/103동 Step 3),
                            # prevent trapping one unit inside the core with low exterior facade exposure
                            trapped_core_penalty = 0.0
                            core_junction_bonus = 0.0
                            if n == 2 and has_int_boundary:
                                ext1 = rot_orig_boundary.intersection(
                                    p_first_rot.boundary.buffer(0.25)
                                ).length
                                ext2 = rot_orig_boundary.intersection(
                                    p_second_rot.boundary.buffer(0.25)
                                ).length
                                ext_balance = min(ext1, ext2) / max(ext1, ext2, 1e-3)
                                if ext_balance < 0.65:
                                    trapped_core_penalty = 140.0 * (0.68 - ext_balance)
                                if (
                                    ext_touches == 1
                                    and cut_segs
                                    and int_boundary.distance(cut_segs[0]) <= 0.45
                                    and ext_balance >= 0.70
                                ):
                                    # Bonus for centerline cut meeting the Y/T-core junction cleanly
                                    core_junction_bonus = 6.5

                            after_rect = (
                                p_first_rot.area * _rectangularity(p_first_rot)
                                + p_second_rot.area * _rectangularity(p_second_rot)
                            ) / max(geometry.area, 1e-6)
                            rect_gain = max(0.0, after_rect - before_rect)
                            neck_bonus = 0.0
                            if seg_count == 1 and reflex_coords:
                                if min_rdist <= 4.5 and (rect_gain > 0.03 or r_mult < 1.00):
                                    neck_bonus = 4.5 * (1.0 - min_rdist / 4.5) + 10.0 * rect_gain
                            elif seg_count == 1 and rect_gain > 0.08:
                                neck_bonus = 6.0 * rect_gain

                            base_score = (
                                cut_len
                                + seg_penalty
                                + island_penalty
                                + ext_penalty
                                + wall_perp_penalty
                                + aspect_penalty
                                + trapped_core_penalty
                                + neck_dev_pen
                                - neck_bonus
                                - core_junction_bonus
                            )
                            # Exact branch-and-bound check 2 (acute_penalty >= 0.0)
                            if best_choice is not None and base_score >= best_choice[0]:
                                continue

                            p_first_local = rotate(p_first_rot, math.degrees(ang), origin=origin)
                            p_second_local = rotate(p_second_rot, math.degrees(ang), origin=origin)

                            if not nearly_equal_weights:
                                ordered_pair = _order_cells_south_facing(
                                    [p_first_local, p_second_local], global_angle
                                )
                                if ordered_pair[0].centroid.distance(p_first_local.centroid) > 1e-3:
                                    continue

                            # Penalize any cut that creates an acute <= 62 deg corner (measured on opened geom)
                            after_min_corner = min(
                                _min_polygon_corner_deg(p_first_rot, use_opening=True),
                                _min_polygon_corner_deg(p_second_rot, use_opening=True),
                            )
                            acute_penalty = 0.0
                            if after_min_corner <= 62.0 and after_min_corner < before_min_corner - 2.0:
                                acute_penalty = 750.0 + 18.0 * (62.0 - after_min_corner)

                            score = base_score + acute_penalty
                            if best_choice is None or score < best_choice[0]:
                                best_choice = (score, k, p_first_local, p_second_local)

    if best_choice is None:
        return []
    _, k, part1, part2 = best_choice
    left_cells = _recursive_shortest_perpendicular_partition(
        part1,
        ordered_lines[:k],
        global_angle,
        candidate_angles,
        orig_boundary=orig_boundary,
        _is_root=False,
    )
    right_cells = _recursive_shortest_perpendicular_partition(
        part2,
        ordered_lines[k:],
        global_angle,
        candidate_angles,
        orig_boundary=orig_boundary,
        _is_root=False,
    )
    if len(left_cells) != k or len(right_cells) != n - k:
        return []
    cells = left_cells + right_cells
    if _is_root and nearly_equal_weights:
        cells = _order_cells_south_facing(cells, global_angle)
    return cells


def _split_by_area_ratio_along_axis(geometry, axis, first_ratio):
    """Split `geometry` into two parts along `axis` ('x' or 'y') with exact area ratio `first_ratio`."""
    min_x, min_y, max_x, max_y = geometry.bounds
    target_area = geometry.area * first_ratio
    low = min_x if axis == "x" else min_y
    high = max_x if axis == "x" else max_y
    for _ in range(34):
        mid = 0.5 * (low + high)
        if axis == "x":
            clipped = geometry.intersection(box(min_x - 1.0, min_y - 1.0, mid, max_y + 1.0))
        else:
            clipped = geometry.intersection(box(min_x - 1.0, min_y - 1.0, max_x + 1.0, mid))
        if clipped.area < target_area:
            low = mid
        else:
            high = mid
    cut = 0.5 * (low + high)
    if axis == "x":
        p1 = geometry.intersection(box(min_x - 1.0, min_y - 1.0, cut, max_y + 1.0))
        p2 = geometry.intersection(box(cut, min_y - 1.0, max_x + 1.0, max_y + 1.0))
    else:
        p1 = geometry.intersection(box(min_x - 1.0, min_y - 1.0, max_x + 1.0, cut))
        p2 = geometry.intersection(box(min_x - 1.0, cut, max_x + 1.0, max_y + 1.0))
    parts1 = [p for p in _polygon_parts(p1) if p.area > 0.02]
    parts2 = [p for p in _polygon_parts(p2) if p.area > 0.02]
    if not parts1 or not parts2:
        return None, None, len(parts1) + len(parts2)
    return unary_union(parts1), unary_union(parts2), (len(parts1) - 1) + (len(parts2) - 1)


def _cross_or_compact_partition(local_geom, lines, angle):
    """04 십자·H형 & 05 탑상·컴팩트형 전용 코어 중심 직교 십자(+) 분할기."""
    n = len(lines)
    weights = [
        max(0.001, float(ln.get("count") or ln.get("supply") or ln.get("exclusive") or 1.0))
        for ln in lines
    ]
    total_w = sum(weights)

    if n == 4:
        # 2x2 Orthogonal Cross (+) cut matching exact area weights
        best_cells = None
        best_score = float("inf")
        for first_axis, second_axis in (("x", "y"), ("y", "x")):
            for rev_first in (False, True):
                r1 = (weights[0] + weights[1]) / total_w
                req_r1 = (1.0 - r1) if rev_first else r1
                half_low, half_high, islands1 = _split_by_area_ratio_along_axis(
                    local_geom, first_axis, req_r1
                )
                if half_low is None or half_high is None:
                    continue
                first_half = half_high if rev_first else half_low
                second_half = half_low if rev_first else half_high

                pair_first = _order_cells_south_facing([first_half, second_half], angle)
                if pair_first[0].centroid.distance(first_half.centroid) > 1e-3:
                    continue

                # Split first_half into weights[0] and weights[1]
                r_a = weights[0] / (weights[0] + weights[1])
                c0, c1 = None, None
                for rev_a in (False, True):
                    pa, pb, _ = _split_by_area_ratio_along_axis(
                        first_half, second_axis, (1.0 - r_a) if rev_a else r_a
                    )
                    if pa is None or pb is None:
                        continue
                    cand0 = pb if rev_a else pa
                    cand1 = pa if rev_a else pb
                    if _order_cells_south_facing([cand0, cand1], angle)[0].centroid.distance(
                        cand0.centroid
                    ) <= 1e-3:
                        c0, c1 = cand0, cand1
                        break

                # Split second_half into weights[2] and weights[3]
                r_b = weights[2] / (weights[2] + weights[3])
                c2, c3 = None, None
                for rev_b in (False, True):
                    pa, pb, _ = _split_by_area_ratio_along_axis(
                        second_half, second_axis, (1.0 - r_b) if rev_b else r_b
                    )
                    if pa is None or pb is None:
                        continue
                    cand2 = pb if rev_b else pa
                    cand3 = pa if rev_b else pb
                    if _order_cells_south_facing([cand2, cand3], angle)[0].centroid.distance(
                        cand2.centroid
                    ) <= 1e-3:
                        c2, c3 = cand2, cand3
                        break

                if c0 is None or c2 is None:
                    continue
                cells = [c0, c1, c2, c3]
                islands = sum(len(_polygon_parts(c)) - 1 for c in cells)
                compactness_pen = sum(
                    abs(math.log(max(1e-3, (c.bounds[2] - c.bounds[0]) / max(c.bounds[3] - c.bounds[1], 1e-3))))
                    for c in cells
                )
                score = islands * 200.0 + compactness_pen
                if score < best_score:
                    best_score = score
                    best_cells = cells
        if best_cells is not None:
            return best_cells

    # For 3, 5, 6+ units in compact or cross-h towers, use recursive shortest perpendicular partition
    wall_families = _wall_orientation_families(local_geom, min_edge_length=2.0)
    return _recursive_shortest_perpendicular_partition(
        local_geom, lines, global_angle=angle, candidate_angles=wall_families
    )


def _parallel_bands(geometry, lines, axis=None):
    """Slice geometry orthogonally along the axis that yields the shortest interior cut lines."""
    if len(lines) == 1:
        return [geometry]
    min_x, min_y, max_x, max_y = geometry.bounds
    width = max_x - min_x
    height = max_y - min_y

    if axis is None:
        mid_x = 0.5 * (min_x + max_x)
        mid_y = 0.5 * (min_y + max_y)
        cut_x_len, seg_x = _cut_line_length(geometry, "x", mid_x)
        cut_y_len, seg_y = _cut_line_length(geometry, "y", mid_y)
        eff_x = cut_x_len * (1.0 + 0.5 * (seg_x - 1))
        eff_y = cut_y_len * (1.0 + 0.5 * (seg_y - 1))
        if abs(eff_x - eff_y) / max(min(eff_x, eff_y), 1e-3) > 0.15:
            axis = "x" if eff_x < eff_y else "y"
        else:
            axis = "x" if width >= height else "y"

    weights = [
        max(0.001, float(line.get("count") or line.get("supply") or line.get("exclusive") or 1.0))
        for line in lines
    ]
    total_weight = sum(weights)
    cells = []

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
                    clipped_area = geometry.intersection(
                        box(min_x - 1.0, min_y - 1.0, middle, max_y + 1.0)
                    ).area
                else:
                    clipped_area = geometry.intersection(
                        box(min_x - 1.0, min_y - 1.0, max_x + 1.0, middle)
                    ).area
                if clipped_area < target_area:
                    search_low = middle
                else:
                    search_high = middle
            upper = (search_low + search_high) / 2.0
        if axis == "x":
            clipped = geometry.intersection(box(low, min_y - 1.0, upper, max_y + 1.0))
        else:
            clipped = geometry.intersection(box(min_x - 1.0, low, max_x + 1.0, upper))
        cells.append(unary_union([part for part in _polygon_parts(clipped) if part.area > 0.01]))
        low = upper
    return cells


def _order_cells(cells, angle):
    if not cells:
        return cells
    cosine = math.cos(angle)
    sine = math.sin(angle)

    def south_facing_position(cell):
        x, y = cell.centroid.coords[0]
        east = x * cosine - y * sine
        north = x * sine + y * cosine
        return -east, north

    return sorted(cells, key=south_facing_position)


def _order_cells_south_facing(cells, angle):
    """Order cells from left (East) to right (West) when facing South, preserving adjacency."""
    n = len(cells)
    if n <= 1:
        return cells

    cosine = math.cos(angle)
    sine = math.sin(angle)

    def compass_key(idx):
        x, y = cells[idx].centroid.coords[0]
        east = x * cosine - y * sine
        north = x * sine + y * cosine
        return (-round(east, 3), round(north, 3))

    buffered = [cell.buffer(0.35) for cell in cells]
    adj = {i: [] for i in range(n)}
    for i in range(n):
        for j in range(i + 1, n):
            if buffered[i].intersects(buffered[j]):
                adj[i].append(j)
                adj[j].append(i)

    endpoints = [i for i in range(n) if len(adj[i]) <= 1]
    start_candidates = endpoints if endpoints else list(range(n))
    start = min(start_candidates, key=compass_key)

    visited = [False] * n
    ordered_indices = []
    queue = deque([start])
    visited[start] = True

    while queue:
        curr = queue.popleft()
        ordered_indices.append(curr)
        neighbors = sorted([nb for nb in adj[curr] if not visited[nb]], key=compass_key)
        for nb in neighbors:
            visited[nb] = True
            queue.append(nb)

    if len(ordered_indices) < n:
        remaining = sorted([i for i in range(n) if not visited[i]], key=compass_key)
        ordered_indices.extend(remaining)

    return [cells[i] for i in ordered_indices]


def _parallel_bands_in_line_order(geometry, lines, angle):
    bounds = geometry.bounds
    split_axis = "x" if bounds[2] - bounds[0] >= bounds[3] - bounds[1] else "y"
    eastward_delta = math.cos(angle) if split_axis == "x" else -math.sin(angle)
    ordered_lines = list(reversed(lines)) if eastward_delta > 0 else lines
    cells = _parallel_bands(geometry, ordered_lines, axis=split_axis)
    return _order_cells(cells, angle)


def _line_order_key(line):
    label = str(line.get("line", ""))
    try:
        return (0, int(label), label)
    except ValueError:
        return (1, label, label)


def get_slice_label_point(cell_polygon):
    """Return an interior point (pole of inaccessibility) guaranteed to lie inside the unit slice."""
    parts = _polygon_parts(cell_polygon)
    if not parts:
        return (0.0, 0.0)
    main_part = max(parts, key=lambda p: p.area)
    try:
        pt = polylabel(main_part, tolerance=0.25)
        return (pt.x, pt.y)
    except Exception:
        pt = main_part.representative_point()
        return (pt.x, pt.y)


def precompute_unit_slices(geometry, lines, transformer_to_4326, pattern=None):
    """Partition a footprint using the v4 6-Archetype Red-Line Engine."""
    if geometry is None or geometry.is_empty or not lines or len(lines) < 2:
        return None
    lines = sorted(lines, key=_line_order_key)
    if not geometry.is_valid:
        geometry = geometry.buffer(0)
    parts = _polygon_parts(geometry)
    if not parts:
        return None
    footprint = max(parts, key=lambda part: part.area)
    if footprint.area <= 0:
        return None

    angle = _dominant_wall_angle(footprint)
    origin = footprint.centroid
    local = rotate(footprint, -math.degrees(angle), origin=origin)
    if not pattern:
        pattern = classify_unit_slice_pattern(footprint, line_count=len(lines))
    wall_families = _wall_orientation_families(local, min_edge_length=2.5)

    cells = []
    if pattern in ("cross-h", "square-compact"):
        # 04 십자·H형 & 05 탑상·컴팩트형: 코어 중심 직교 십자(+) 분할
        cells = _cross_or_compact_partition(local, lines, angle)
    elif pattern in ("slab", "linear") and len(wall_families) == 1:
        # 01 판상·장축형: 장축 수직 평행 절단
        cells = _parallel_bands_in_line_order(local, lines, angle)
    else:
        # 02 ㄱ자형, 03 T자형, 06 계단·복합·기타:
        # 날개 목(Neck) 우선 분리 + 날개별 수직 방향 전환(— / |) + 단일 현(Single-Chord) 절단
        cells = _recursive_shortest_perpendicular_partition(
            local, lines, global_angle=angle, candidate_angles=wall_families
        )
        if len(cells) != len(lines):
            cells = _parallel_bands_in_line_order(local, lines, angle)

    if len(cells) != len(lines):
        return None

    cells = _rectify_acute_corners_between_cells(cells, local, min_allowed_deg=62.0)

    assignments = {str(line["line"]): cell for cell, line in zip(cells, lines)}

    union = unary_union(cells)
    area_tolerance = max(0.05, local.area * 1e-6)
    if (
        local.symmetric_difference(union).area > area_tolerance
        or abs(sum(cell.area for cell in cells) - union.area) > area_tolerance
    ):
        return None

    result = []
    for line in lines:
        cell = assignments[str(line["line"])]
        restored = rotate(cell, math.degrees(angle), origin=origin)
        lx, ly = get_slice_label_point(restored)
        label_lng, label_lat = transformer_to_4326.transform(lx, ly)
        polygons = []
        for polygon in _polygon_parts(restored):
            outer = [
                list(transformer_to_4326.transform(x, y)) for x, y in polygon.exterior.coords
            ]
            holes = [
                [list(transformer_to_4326.transform(x, y)) for x, y in ring.coords]
                for ring in polygon.interiors
            ]
            if len(outer) >= 4:
                polygons.append({
                    "outer": [[round(lng, 10), round(lat, 10)] for lng, lat in outer],
                    "holes": [
                        [[round(lng, 10), round(lat, 10)] for lng in ring]
                        if False else [
                            [[round(lng, 10), round(lat, 10)] for lng, lat in ring]
                            for ring in holes
                        ]
                    ][0],
                })
        if not polygons:
            return None
        result.append({
            "line": str(line["line"]),
            "labelPoint": [round(label_lng, 10), round(label_lat, 10)],
            "polygons": polygons,
        })
    return result
