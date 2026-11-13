"""Verify staged national JSONs exactly match both local data mirrors."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.digest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", default=str(ROOT / "complex3d" / "national_unit_slice_v3_report.json"))
    args = parser.parse_args()
    report_path = Path(args.report)
    report = json.loads(report_path.read_text(encoding="utf-8"))
    stage_dir = Path(report["stageDirectory"])
    staged_paths = sorted(stage_dir.glob("*.json"))
    missing = []
    mismatched = []
    primary = ROOT / "complex3d" / "data" / "3d"
    mirror = ROOT / "data" / "3d"

    if len(staged_paths) != report.get("stagedFiles"):
        raise SystemExit(f"Staged file count mismatch: {len(staged_paths)} != {report.get('stagedFiles')}")

    for index, staged_path in enumerate(staged_paths, 1):
        expected = sha256(staged_path)
        for destination_dir in (primary, mirror):
            destination = destination_dir / staged_path.name
            if not destination.exists():
                missing.append(str(destination))
            elif destination.stat().st_size != staged_path.stat().st_size or sha256(destination) != expected:
                mismatched.append(str(destination))
        if index % 2500 == 0:
            print(f"Verified {index:,}/{len(staged_paths):,} files", flush=True)

    result = {
        "stagedFiles": len(staged_paths),
        "missingCopies": len(missing),
        "mismatchedCopies": len(mismatched),
        "firstMissing": missing[:5],
        "firstMismatched": mismatched[:5],
        "commitStatus": report.get("commitStatus"),
        "dongsPrecomputed": report.get("dongsPrecomputed"),
        "dongsNeedingReview": report.get("dongsNeedingReview"),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if missing or mismatched:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
