"""Add footprint-distance apartment references to nationwide 3D JSON files."""

import argparse
import json
import math
import os
import tempfile

from pyproj import Transformer
from shapely.geometry import Polygon
from shapely.ops import transform, unary_union


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_DATA_DIR = os.path.join(REPO_ROOT, "complex3d", "data", "3d")
DEFAULT_MIRROR_DIR = os.path.join(REPO_ROOT, "data", "3d")
OFFICIAL_SOURCES = {
    "korea_gis_ledger_fused_v2",
    "vworld_ledger_fused_v2",
    "vworld_ledger_pure_v2",
}
TO_LOCAL = Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True).transform


def _complex_footprint(data):
    footprints = []
    for building in data.get("buildings", []):
        rings = building.get("rings") or []
        if not rings or len(rings[0]) < 4:
            continue
        try:
            polygon = Polygon(rings[0])
            if not polygon.is_valid:
                polygon = polygon.buffer(0)
            if polygon.is_empty or polygon.area <= 0:
                continue
            projected = transform(TO_LOCAL, polygon)
            if not projected.is_empty and projected.area > 0:
                footprints.append(projected)
        except (TypeError, ValueError, OverflowError):
            continue
    if not footprints:
        return None
    footprint = unary_union(footprints)
    return footprint if not footprint.is_empty else None


def _grid_cells(bounds, cell_size):
    min_x, min_y, max_x, max_y = bounds
    for grid_x in range(math.floor(min_x / cell_size), math.floor(max_x / cell_size) + 1):
        for grid_y in range(math.floor(min_y / cell_size), math.floor(max_y / cell_size) + 1):
            yield grid_x, grid_y


def _write_if_changed(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    encoded = content.encode("utf-8")
    try:
        with open(path, "rb") as existing:
            if existing.read() == encoded:
                return False
    except OSError:
        pass
    descriptor, temporary_path = tempfile.mkstemp(prefix=".apartment-neighbors-", dir=os.path.dirname(path))
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(encoded)
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
    return True


def enrich_apartment_neighbors(data_dir=DEFAULT_DATA_DIR, mirror_dir=DEFAULT_MIRROR_DIR, max_distance_m=500.0):
    if max_distance_m <= 0:
        raise ValueError("max_distance_m must be positive")
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"3D data directory not found: {data_dir}")

    complexes = {}
    invalid_files = []
    for filename in sorted(os.listdir(data_dir)):
        if not filename.endswith(".json"):
            continue
        path = os.path.join(data_dir, filename)
        try:
            with open(path, "r", encoding="utf-8") as source:
                data = json.load(source)
        except (OSError, ValueError):
            invalid_files.append(filename)
            continue
        code = str(data.get("searchCode") or os.path.splitext(filename)[0])
        if data.get("source") not in OFFICIAL_SOURCES or code.startswith("cx_"):
            continue
        footprint = _complex_footprint(data)
        if footprint is None:
            continue
        complexes[code] = {
            "code": code,
            "name": str(data.get("name") or ""),
            "center": data.get("center") or {},
            "households": (data.get("specs") or {}).get("totalHouseholds", 0),
            "buildingCount": sum(1 for building in data.get("buildings", []) if building.get("residential")),
            "footprint": footprint,
            "path": path,
        }

    spatial_grid = {}
    for code, complex_data in complexes.items():
        for cell in _grid_cells(complex_data["footprint"].bounds, max_distance_m):
            spatial_grid.setdefault(cell, []).append(code)

    updated_primary = 0
    updated_mirror = 0
    candidate_pairs = 0
    for code, complex_data in complexes.items():
        footprint = complex_data["footprint"]
        min_x, min_y, max_x, max_y = footprint.bounds
        search_bounds = (min_x - max_distance_m, min_y - max_distance_m, max_x + max_distance_m, max_y + max_distance_m)
        candidates = set()
        for cell in _grid_cells(search_bounds, max_distance_m):
            candidates.update(spatial_grid.get(cell, ()))
        apartment_neighbors = []
        for neighbor_code in candidates:
            if neighbor_code == code:
                continue
            neighbor = complexes[neighbor_code]
            distance = footprint.distance(neighbor["footprint"])
            if distance > max_distance_m:
                continue
            candidate_pairs += 1
            apartment_neighbors.append({
                "code": neighbor_code,
                "name": neighbor["name"],
                "distanceM": round(distance, 1),
                "center": neighbor["center"],
                "households": neighbor["households"],
                "buildingCount": neighbor["buildingCount"],
            })
        apartment_neighbors.sort(key=lambda item: (item["distanceM"], item["code"]))
        with open(complex_data["path"], "r", encoding="utf-8") as source:
            data = json.load(source)
        already_current = data.get("apartmentNeighbors") == apartment_neighbors
        data["apartmentNeighbors"] = apartment_neighbors
        compact_json = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        if not already_current and _write_if_changed(complex_data["path"], compact_json):
            updated_primary += 1
        if mirror_dir:
            mirror_path = os.path.join(mirror_dir, f"{code}.json")
            if _write_if_changed(mirror_path, compact_json):
                updated_mirror += 1

    print(f"Indexed {len(complexes):,} official complexes; found {candidate_pairs:,} directed footprint pairs within {max_distance_m:g}m.")
    print(f"Updated {updated_primary:,} primary JSON files and {updated_mirror:,} mirror JSON files.")
    if invalid_files:
        print(f"Skipped {len(invalid_files):,} unreadable JSON files.")
    return {
        "complexCount": len(complexes),
        "neighborPairCount": candidate_pairs,
        "updatedPrimaryCount": updated_primary,
        "updatedMirrorCount": updated_mirror,
        "invalidFileCount": len(invalid_files),
    }


def main():
    parser = argparse.ArgumentParser(description="Add footprint-based nearby apartment references to 3D JSON files")
    parser.add_argument("--data-dir", default=DEFAULT_DATA_DIR)
    parser.add_argument("--mirror-dir", default=DEFAULT_MIRROR_DIR)
    parser.add_argument("--max-distance-m", type=float, default=500.0)
    args = parser.parse_args()
    enrich_apartment_neighbors(args.data_dir, args.mirror_dir, args.max_distance_m)


if __name__ == "__main__":
    main()
