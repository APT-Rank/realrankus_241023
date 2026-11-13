"""Rebuild cached unit-slice polygons without re-fetching building footprints."""

import argparse
import json
import os
import tempfile

import pyproj
from shapely.geometry import Polygon
from shapely.ops import transform

from unit_slice_patterns import classify_unit_slice_pattern, precompute_unit_slices


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TO_5186 = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True)
TO_4326 = pyproj.Transformer.from_crs("EPSG:5186", "EPSG:4326", always_xy=True)


def footprint_from_rings(rings):
    if not rings or not rings[0]:
        return None
    projected = [
        [TO_5186.transform(lng, lat) for lng, lat in ring]
        for ring in rings
    ]
    geometry = Polygon(projected[0], projected[1:])
    if not geometry.is_valid:
        geometry = geometry.buffer(0)
    return geometry


def write_atomic(path, text):
    directory = os.path.dirname(path)
    os.makedirs(directory, exist_ok=True)
    descriptor, temporary_path = tempfile.mkstemp(prefix=".unit-slices-", suffix=".tmp", dir=directory)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="") as output:
            output.write(text)
        os.replace(temporary_path, path)
    except Exception:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
        raise


def rebuild(code, input_path=None):
    primary_path = input_path or os.path.join(ROOT, "complex3d", "data", "3d", f"{code}.json")
    with open(primary_path, "r", encoding="utf-8") as source:
        data = json.load(source)

    patterns = {}
    review_dongs = []
    processed = 0
    for building in data.get("buildings", []):
        lines = building.get("lines") or []
        if not building.get("residential") or len(lines) < 2:
            continue
        geometry = footprint_from_rings(building.get("rings"))
        pattern = classify_unit_slice_pattern(geometry)
        slices = precompute_unit_slices(geometry, lines, TO_4326)
        building["unitSlicePattern"] = pattern
        building["unitSliceAlgorithm"] = "pattern-v3"
        building["unitSlices"] = slices
        building["unitSliceStatus"] = "precomputed" if slices else "needs-review"
        building["unitSliceReviewReasons"] = [] if slices else ["pattern-v3-partition-failed"]
        patterns[pattern] = patterns.get(pattern, 0) + 1
        processed += 1
        if not slices:
            review_dongs.append(building.get("dong", building.get("name", "")))

    coverage = data.setdefault("coverage", {})
    coverage["patternAlgorithm"] = "pattern-v3"
    coverage["precomputedUnitSliceCount"] = sum(
        1 for building in data.get("buildings", [])
        if building.get("unitSliceStatus") == "precomputed"
    )
    coverage["needsReviewUnitSliceCount"] = sum(
        1 for building in data.get("buildings", [])
        if building.get("unitSliceStatus") == "needs-review"
    )
    coverage["unresolvedUnitSliceCount"] = sum(
        1 for building in data.get("buildings", [])
        if building.get("unitSliceStatus") in ("needs-review", "validation-failed")
    )

    compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    primary_path = os.path.abspath(primary_path)
    mirror_path = os.path.join(ROOT, "data", "3d", f"{code}.json")
    write_atomic(primary_path, compact)
    if os.path.abspath(mirror_path) != primary_path:
        write_atomic(mirror_path, compact)

    report = {
        "searchCode": str(code),
        "name": data.get("name"),
        "algorithm": "pattern-v3",
        "processedResidentialDongs": processed,
        "precomputedUnitSliceCount": coverage["precomputedUnitSliceCount"],
        "needsReviewUnitSliceCount": coverage["needsReviewUnitSliceCount"],
        "patterns": patterns,
        "reviewDongs": review_dongs,
    }
    report_path = os.path.join(ROOT, "complex3d", f"{code}_pattern_slice_report.json")
    write_atomic(report_path, json.dumps(report, ensure_ascii=False, indent=2))
    return report, report_path


def main():
    parser = argparse.ArgumentParser(description="Recompute cached unit slices for one complex")
    parser.add_argument("--code", default="111515", help="Complex code (defaults to Helio City)")
    parser.add_argument("--input", default=None, help="Optional source JSON path")
    args = parser.parse_args()
    report, report_path = rebuild(args.code, args.input)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
