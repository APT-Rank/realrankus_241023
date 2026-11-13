"""Stage and optionally commit pattern-v5 unit slices for all local 3D complexes."""

import argparse
import json
import os
import shutil
import tempfile
import time
from collections import Counter
from pathlib import Path

import pyproj
from shapely.geometry import Polygon

from unit_slice_patterns import classify_unit_slice_pattern, precompute_unit_slices


ROOT = Path(__file__).resolve().parents[2]
PRIMARY_DIR = ROOT / "complex3d" / "data" / "3d"
MIRROR_DIR = ROOT / "data" / "3d"
REPORT_PATH = ROOT / "complex3d" / "national_unit_slice_v5_report.json"
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
    return geometry if not geometry.is_empty else None


def write_atomic(path, text):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_path = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="") as output:
            output.write(text)
        os.replace(temporary_path, path)
    except Exception:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)
        raise


def process_complex(source_path, stage_dir, counters, exceptions):
    try:
        with source_path.open("r", encoding="utf-8") as source:
            data = json.load(source)
    except Exception as error:
        counters["parseErrors"] += 1
        exceptions.append({"complex": source_path.stem, "reason": f"json-parse-error: {error}"})
        return None

    buildings = data.get("buildings") if isinstance(data, dict) else None
    if not isinstance(buildings, list):
        counters["incompatibleFiles"] += 1
        exceptions.append({"complex": source_path.stem, "reason": "missing-buildings-array"})
        return None

    counters[f"source:{data.get('source') or '<missing>'}"] += 1
    processed = 0
    precomputed = 0
    review_dongs = []
    patterns = Counter()

    for building in buildings:
        if not isinstance(building, dict):
            exceptions.append({
                "complex": source_path.stem,
                "name": data.get("name"),
                "reason": "invalid-building-record",
            })
            continue
        lines = building.get("lines") or []
        if not isinstance(lines, list) or not building.get("residential") or len(lines) < 2:
            continue

        processed += 1
        dong = building.get("dong", building.get("name", ""))
        pattern = "unclassified"
        try:
            geometry = footprint_from_rings(building.get("rings"))
            if geometry is None:
                raise ValueError("missing-or-empty-footprint")
            pattern = classify_unit_slice_pattern(geometry)
            slices = precompute_unit_slices(geometry, lines, TO_4326)
            if not slices:
                raise ValueError("pattern-v5-partition-failed")
        except Exception as error:
            building["unitSlices"] = None
            building["unitSlicePattern"] = pattern
            building["unitSliceStatus"] = "needs-review"
            building["unitSliceAlgorithm"] = "pattern-v5"
            building["unitSliceLineOrder"] = "south-facing-left-to-right"
            building["unitSliceReviewReasons"] = [str(error)]
            review_dongs.append(str(dong))
            exceptions.append({
                "complex": source_path.stem,
                "name": data.get("name"),
                "dong": str(dong),
                "reason": str(error),
            })
            continue

        building["unitSlices"] = slices
        building["unitSlicePattern"] = pattern
        building["unitSliceAlgorithm"] = "pattern-v5"
        building["unitSliceLineOrder"] = "south-facing-left-to-right"
        building["unitSliceStatus"] = "precomputed"
        building["unitSliceReviewReasons"] = []
        patterns[pattern] += 1
        precomputed += 1

    if not processed:
        counters["filesWithoutResidentialLineBuildings"] += 1
        return None

    coverage = data.setdefault("coverage", {})
    if not isinstance(coverage, dict):
        coverage = {}
        data["coverage"] = coverage
    coverage["patternAlgorithm"] = "pattern-v5"
    coverage["unitSliceLineOrder"] = "south-facing-left-to-right"
    coverage["precomputedUnitSliceCount"] = sum(
        1 for building in buildings if building.get("unitSliceStatus") == "precomputed"
    )
    coverage["needsReviewUnitSliceCount"] = sum(
        1 for building in buildings if building.get("unitSliceStatus") == "needs-review"
    )
    coverage["unresolvedUnitSliceCount"] = sum(
        1 for building in buildings
        if building.get("unitSliceStatus") in ("needs-review", "validation-failed")
    )

    counters["filesProcessed"] += 1
    counters["residentialDongsProcessed"] += processed
    counters["dongsPrecomputed"] += precomputed
    counters["patterns"].update(patterns)
    counters["complexesWithReview"] += bool(review_dongs)
    if review_dongs:
        counters["reviewComplexes"].append({
            "complex": source_path.stem,
            "name": data.get("name"),
            "dongs": review_dongs,
        })

    if stage_dir:
        stage_path = stage_dir / source_path.name
        write_atomic(stage_path, json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        counters["stagedBytes"] += stage_path.stat().st_size
        counters["stagedFiles"] += 1
        return stage_path
    return None


def commit_staged_files(stage_dir, staged_paths):
    committed = 0
    for stage_path in staged_paths:
        for destination_dir in (PRIMARY_DIR, MIRROR_DIR):
            destination = destination_dir / stage_path.name
            descriptor, temporary_path = tempfile.mkstemp(
                prefix=f".{destination.name}.unit-slice-v5.",
                suffix=".tmp",
                dir=destination_dir,
            )
            os.close(descriptor)
            try:
                shutil.copyfile(stage_path, temporary_path)
                os.replace(temporary_path, destination)
            except Exception:
                if os.path.exists(temporary_path):
                    os.remove(temporary_path)
                raise
        committed += 1
    return committed


def repair_staged_report(stage_dir, report):
    exceptions_by_code = {}
    untouched_exceptions = []
    for exception in report.get("exceptions", []):
        code = exception.get("complex")
        if code and exception.get("dong"):
            exceptions_by_code.setdefault(str(code), []).append(exception)
        else:
            untouched_exceptions.append(exception)

    repaired_patterns = Counter()
    remaining = list(untouched_exceptions)
    repaired_count = 0
    for code, code_exceptions in exceptions_by_code.items():
        stage_path = stage_dir / f"{code}.json"
        if not stage_path.exists():
            remaining.extend(code_exceptions)
            continue
        try:
            data = json.loads(stage_path.read_text(encoding="utf-8"))
        except Exception:
            remaining.extend(code_exceptions)
            continue

        buildings = {
            str(building.get("dong", building.get("name", ""))): building
            for building in data.get("buildings", [])
            if isinstance(building, dict)
        }
        changed = False
        for exception in code_exceptions:
            building = buildings.get(str(exception["dong"]))
            if not building:
                remaining.append(exception)
                continue
            try:
                geometry = footprint_from_rings(building.get("rings"))
                if geometry is None:
                    raise ValueError("missing-or-empty-footprint")
                pattern = classify_unit_slice_pattern(geometry)
                slices = precompute_unit_slices(geometry, building.get("lines") or [], TO_4326)
                if not slices:
                    raise ValueError("pattern-v5-partition-failed")
            except Exception as error:
                exception["reason"] = str(error)
                remaining.append(exception)
                continue

            building["unitSlices"] = slices
            building["unitSlicePattern"] = pattern
            building["unitSliceAlgorithm"] = "pattern-v5"
            building["unitSliceLineOrder"] = "south-facing-left-to-right"
            building["unitSliceStatus"] = "precomputed"
            building["unitSliceReviewReasons"] = []
            repaired_patterns[pattern] += 1
            repaired_count += 1
            changed = True

        if changed:
            coverage = data.setdefault("coverage", {})
            if not isinstance(coverage, dict):
                coverage = {}
                data["coverage"] = coverage
            coverage["patternAlgorithm"] = "pattern-v5"
            coverage["unitSliceLineOrder"] = "south-facing-left-to-right"
            coverage["precomputedUnitSliceCount"] = sum(
                1 for building in data.get("buildings", [])
                if isinstance(building, dict) and building.get("unitSliceStatus") == "precomputed"
            )
            coverage["needsReviewUnitSliceCount"] = sum(
                1 for building in data.get("buildings", [])
                if isinstance(building, dict) and building.get("unitSliceStatus") == "needs-review"
            )
            coverage["unresolvedUnitSliceCount"] = sum(
                1 for building in data.get("buildings", [])
                if isinstance(building, dict) and building.get("unitSliceStatus") in ("needs-review", "validation-failed")
            )
            write_atomic(stage_path, json.dumps(data, ensure_ascii=False, separators=(",", ":")))

    review_by_code = {}
    for exception in remaining:
        if exception.get("complex") and exception.get("dong"):
            entry = review_by_code.setdefault(str(exception["complex"]), {
                "complex": str(exception["complex"]),
                "name": exception.get("name"),
                "dongs": [],
            })
            entry["dongs"].append(str(exception["dong"]))

    for pattern, count in repaired_patterns.items():
        report.setdefault("patterns", {})[pattern] = report.setdefault("patterns", {}).get(pattern, 0) + count
    report["exceptions"] = remaining
    report["reviewComplexes"] = list(review_by_code.values())
    report["complexesWithReview"] = len(review_by_code)
    report["dongsNeedingReview"] = sum(len(item["dongs"]) for item in review_by_code.values())
    report["dongsPrecomputed"] = report.get("dongsPrecomputed", 0) + repaired_count
    staged_paths = sorted(stage_dir.glob("*.json"))
    report["stagedFiles"] = len(staged_paths)
    report["stagedBytes"] = sum(path.stat().st_size for path in staged_paths)
    report["repairSummary"] = {
        "attempted": sum(len(items) for items in exceptions_by_code.values()),
        "repaired": repaired_count,
        "remaining": report["dongsNeedingReview"],
        "patterns": dict(repaired_patterns),
    }
    return staged_paths


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Analyze only; write no staged or source JSON")
    parser.add_argument("--commit", action="store_true", help="Commit staged files only if exceptions stay within the limit")
    parser.add_argument("--max-review", type=int, default=50, help="Maximum allowed failed apartment buildings")
    parser.add_argument("--report-path", default=str(REPORT_PATH), help="Output path for this run's report")
    parser.add_argument("--stage-dir", default=None, help="Optional staging directory")
    parser.add_argument("--resume-stage", default=None, help="Repair and optionally commit a previous staged run")
    parser.add_argument("--resume-report", default=str(REPORT_PATH), help="Report file for --resume-stage")
    args = parser.parse_args()
    if args.dry_run and args.commit:
        parser.error("--dry-run and --commit cannot be used together")
    if args.resume_stage:
        if not args.commit or args.dry_run:
            parser.error("--resume-stage requires --commit and cannot be combined with --dry-run")
        stage_dir = Path(args.resume_stage).resolve()
        with open(args.resume_report, "r", encoding="utf-8") as source:
            report = json.load(source)
        start = time.time()
        staged_paths = repair_staged_report(stage_dir, report)
        missing_mirrors = report.get("primaryFilesMissingFromMirror", [])
        extra_mirrors = report.get("mirrorFilesMissingFromPrimary", [])
        total_exceptions = len(report.get("exceptions", [])) + len(missing_mirrors) + len(extra_mirrors)
        report["stageDirectory"] = str(stage_dir)
        report["commitStatus"] = "blocked-review-limit-exceeded"
        report["repairSummary"]["elapsedSeconds"] = round(time.time() - start, 1)
        if total_exceptions <= args.max_review:
            try:
                report["committedFiles"] = commit_staged_files(stage_dir, staged_paths)
                report["commitStatus"] = "committed"
            except Exception as error:
                report["commitStatus"] = "commit-failed"
                report["commitError"] = str(error)
        write_atomic(args.resume_report, json.dumps(report, ensure_ascii=False, indent=2))
        print(json.dumps({key: report.get(key) for key in (
            "filesScanned", "filesProcessed", "residentialDongsProcessed", "dongsPrecomputed",
            "dongsNeedingReview", "repairSummary", "commitStatus", "committedFiles",
        )}, ensure_ascii=False, indent=2))
        print(f"Report: {args.resume_report}")
        if report["commitStatus"] == "commit-failed":
            raise SystemExit(f"Commit failed: {report['commitError']}")
        if total_exceptions > args.max_review:
            raise SystemExit(f"Commit blocked: {total_exceptions} exceptions exceed limit {args.max_review}.")
        return

    source_paths = sorted(PRIMARY_DIR.glob("*.json"))
    mirror_names = {path.name for path in MIRROR_DIR.glob("*.json")}
    primary_names = {path.name for path in source_paths}
    missing_mirrors = sorted(primary_names - mirror_names)
    extra_mirrors = sorted(mirror_names - primary_names)
    counters = Counter()
    counters["patterns"] = Counter()
    counters["reviewComplexes"] = []
    exceptions = []
    stage_dir = None
    if not args.dry_run:
        stage_dir = Path(args.stage_dir) if args.stage_dir else Path(tempfile.mkdtemp(prefix="unit-slices-pattern-v5-"))
        stage_dir.mkdir(parents=True, exist_ok=True)

    start = time.time()
    staged_paths = []
    for index, source_path in enumerate(source_paths, 1):
        staged_path = process_complex(source_path, stage_dir, counters, exceptions)
        if staged_path:
            staged_paths.append(staged_path)
        if index % 1000 == 0 or index == len(source_paths):
            print(f"Scanned {index:,}/{len(source_paths):,} files; partitioned {counters['residentialDongsProcessed']:,} buildings", flush=True)

    report = {
        "algorithm": "pattern-v5",
        "maxReviewAllowed": args.max_review,
        "filesScanned": len(source_paths),
        "filesProcessed": counters["filesProcessed"],
        "filesWithoutResidentialLineBuildings": counters["filesWithoutResidentialLineBuildings"],
        "incompatibleFiles": counters["incompatibleFiles"],
        "parseErrors": counters["parseErrors"],
        "residentialDongsProcessed": counters["residentialDongsProcessed"],
        "dongsPrecomputed": counters["dongsPrecomputed"],
        "dongsNeedingReview": len(exceptions) - counters["parseErrors"] - counters["incompatibleFiles"],
        "complexesWithReview": counters["complexesWithReview"],
        "patterns": dict(counters["patterns"]),
        "sources": {
            key.removeprefix("source:"): value
            for key, value in counters.items()
            if key.startswith("source:")
        },
        "reviewComplexes": counters["reviewComplexes"],
        "exceptions": exceptions,
        "primaryFilesMissingFromMirror": missing_mirrors,
        "mirrorFilesMissingFromPrimary": extra_mirrors,
        "stagedFiles": counters["stagedFiles"],
        "stagedBytes": counters["stagedBytes"],
        "stageDirectory": str(stage_dir) if stage_dir else None,
        "commitStatus": "not-requested",
        "elapsedSeconds": round(time.time() - start, 1),
    }

    total_exceptions = len(exceptions)
    total_exceptions += len(missing_mirrors) + len(extra_mirrors)
    if args.commit:
        if total_exceptions > args.max_review:
            report["commitStatus"] = "blocked-review-limit-exceeded"
        else:
            try:
                report["committedFiles"] = commit_staged_files(stage_dir, staged_paths)
                report["commitStatus"] = "committed"
            except Exception as error:
                report["commitStatus"] = "commit-failed"
                report["commitError"] = str(error)
    elif args.dry_run:
        report["commitStatus"] = "dry-run"

    write_atomic(args.report_path, json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({key: report[key] for key in (
        "filesScanned", "filesProcessed", "residentialDongsProcessed", "dongsPrecomputed",
        "dongsNeedingReview", "parseErrors", "incompatibleFiles", "patterns", "commitStatus",
        "stageDirectory", "elapsedSeconds",
    )}, ensure_ascii=False, indent=2))
    print(f"Report: {args.report_path}")
    if args.commit and total_exceptions > args.max_review:
        raise SystemExit(f"Commit blocked: {total_exceptions} exceptions exceed limit {args.max_review}.")
    if report["commitStatus"] == "commit-failed":
        raise SystemExit(f"Commit failed: {report['commitError']}")


if __name__ == "__main__":
    main()
