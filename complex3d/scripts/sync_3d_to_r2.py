"""
sync_3d_to_r2.py
================
로컬 공식 3D 데이터(v2) 구버전 정리 및 Cloudflare R2 동기화 스크립트
(D:\real_estate_data\99_GIS_Building_shp\04_sync_3d_to_cloudflare_r2.py 와 동일)
"""

import os
import sys
import json
import time
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed

GIS_BASE_DIR = r"D:\real_estate_data\99_GIS_Building_shp"
REPO_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
PRIMARY_OUTPUT_DIR = os.path.join(REPO_ROOT_DIR, "complex3d", "data", "3d")
MIRROR_OUTPUT_DIR = os.path.join(REPO_ROOT_DIR, "data", "3d")

OFFICIAL_V2_SOURCES = {
    "korea_gis_ledger_fused_v2",
    "vworld_ledger_fused_v2",
    "vworld_ledger_pure_v2",
}

PURGE_LOCAL_V1_BEFORE_SYNC = True
DELETE_ORPHAN_R2_OBJECTS = True
R2_BUCKET_NAME = "realrankus-data"
R2_PREFIX = "data/3d/"
UPLOAD_WORKERS = 32
FORCE_UPLOAD_ALL = False
DRY_RUN = False
CACHE_CONTROL_HEADER = "public, max-age=604800, stale-while-revalidate=86400"

ENV_FILE_CANDIDATES = [
    ".env",
    os.path.join(GIS_BASE_DIR, ".env"),
    os.path.join(REPO_ROOT_DIR, ".env"),
    os.path.join(REPO_ROOT_DIR, "complex3d", ".env"),
]

try:
    import boto3
    from botocore.config import Config
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "boto3"])
    import boto3
    from botocore.config import Config


def get_env_var(name, default=None):
    val = os.getenv(name)
    if val:
        return val.strip()
    for env_candidate in ENV_FILE_CANDIDATES:
        if os.path.exists(env_candidate):
            with open(env_candidate, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() == name:
                            return v.strip().strip('"').strip("'")
    return default


def get_r2_client(max_pool=48):
    endpoint_url = get_env_var("R2_ENDPOINT_URL")
    access_key_id = get_env_var("R2_ACCESS_KEY_ID")
    secret_access_key = get_env_var("R2_SECRET_ACCESS_KEY")

    if not endpoint_url or not access_key_id or not secret_access_key:
        raise ValueError("Missing R2 credentials in environment or .env file.")

    return boto3.client(
        service_name="s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        config=Config(
            signature_version="s3v4",
            max_pool_connections=max(32, max_pool),
            retries={"max_attempts": 5, "mode": "standard"},
        ),
        region_name="auto",
    )


def purge_local_unofficial_files(dirs, dry_run=False):
    removed_count = 0
    for dpath in dirs:
        if not dpath or not os.path.exists(dpath):
            continue
        for fn in os.listdir(dpath):
            if not fn.endswith(".json"):
                continue
            fpath = os.path.join(dpath, fn)
            is_valid_v2 = False
            try:
                with open(fpath, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                src = data.get("source")
                scid = str(data.get("sourceComplexId", ""))
                if src in OFFICIAL_V2_SOURCES and not scid.startswith("cx_"):
                    is_valid_v2 = True
            except Exception:
                is_valid_v2 = False

            if not is_valid_v2:
                removed_count += 1
                if not dry_run:
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass
    return removed_count


def fetch_existing_r2_objects(s3, bucket_name, prefix=R2_PREFIX):
    print(f"[*] Querying existing objects in s3://{bucket_name}/{prefix} ...")
    existing = {}
    paginator = s3.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
    for page in pages:
        for obj in page.get("Contents", []):
            existing[obj["Key"]] = obj["Size"]
    print(f"[*] Found {len(existing):,} existing objects in R2 under '{prefix}'.")
    return existing


def delete_r2_keys_batch(s3, bucket_name, keys_to_delete, dry_run=False):
    if not keys_to_delete:
        return 0
    if dry_run:
        print(f"[*] [DRY-RUN] Would delete {len(keys_to_delete):,} orphan R2 objects.")
        return len(keys_to_delete)

    deleted_total = 0
    keys_list = sorted(keys_to_delete)
    for i in range(0, len(keys_list), 1000):
        batch = keys_list[i : i + 1000]
        resp = s3.delete_objects(
            Bucket=bucket_name,
            Delete={"Objects": [{"Key": k} for k in batch], "Quiet": True},
        )
        errs = resp.get("Errors", [])
        deleted_total += len(batch) - len(errs)
    print(f"[+] Deleted {deleted_total:,} orphan v1/unofficial objects from R2.")
    return deleted_total


def collect_local_files(custom_dir=None):
    dirs_to_check = [custom_dir] if custom_dir else [PRIMARY_OUTPUT_DIR, MIRROR_OUTPUT_DIR]
    seen = set()
    local_files = []
    for base_dir in dirs_to_check:
        if not base_dir or not os.path.exists(base_dir):
            continue
        for f in os.listdir(base_dir):
            if f.endswith(".json") and f not in seen:
                seen.add(f)
                full_path = os.path.join(base_dir, f)
                r2_key = f"{R2_PREFIX}{f}"
                size = os.path.getsize(full_path)
                local_files.append((full_path, r2_key, size))
    return local_files


def upload_single_file(s3, bucket_name, full_path, r2_key, size):
    extra_args = {
        "ContentType": "application/json; charset=utf-8",
        "CacheControl": CACHE_CONTROL_HEADER,
    }
    s3.upload_file(full_path, bucket_name, r2_key, ExtraArgs=extra_args)
    return r2_key, size


def sync_3d_to_r2(force=False, max_workers=UPLOAD_WORKERS, dry_run=False, target_dir=None, delete_orphans=DELETE_ORPHAN_R2_OBJECTS, purge_local=True):
    bucket_name = get_env_var("R2_BUCKET_NAME", R2_BUCKET_NAME)
    if PURGE_LOCAL_V1_BEFORE_SYNC and purge_local:
        purged = purge_local_unofficial_files([target_dir] if target_dir else [PRIMARY_OUTPUT_DIR, MIRROR_OUTPUT_DIR], dry_run=dry_run)
        if purged:
            print(f"[*] Purged {purged:,} local non-v2/unofficial files before R2 sync.")

    s3 = get_r2_client(max_pool=max_workers + 8)
    existing_r2 = fetch_existing_r2_objects(s3, bucket_name, R2_PREFIX)

    local_files = collect_local_files(target_dir)
    local_key_map = {r2_key: size for _, r2_key, size in local_files}
    total_files = len(local_files)
    total_bytes = sum(f[2] for f in local_files)
    print(f"[*] Local official v2 files: {total_files:,} files ({total_bytes / (1024 * 1024):.2f} MB)")

    if delete_orphans:
        orphan_keys = [k for k in existing_r2 if k.startswith(R2_PREFIX) and k.endswith(".json") and k not in local_key_map]
        if orphan_keys:
            print(f"[*] Found {len(orphan_keys):,} orphan R2 objects to delete...")
            delete_r2_keys_batch(s3, bucket_name, orphan_keys, dry_run=dry_run)

    to_upload = []
    skipped = 0
    skipped_bytes = 0

    for full_path, r2_key, size in local_files:
        if not force and r2_key in existing_r2 and existing_r2[r2_key] == size:
            skipped += 1
            skipped_bytes += size
        else:
            to_upload.append((full_path, r2_key, size))

    print(f"[*] Skipped (same size in R2): {skipped:,} files ({skipped_bytes / (1024 * 1024):.2f} MB)")
    print(f"[*] Queued for upload: {len(to_upload):,} files ({sum(x[2] for x in to_upload) / (1024 * 1024):.2f} MB)")

    if dry_run or not to_upload:
        return

    print(f"[*] Starting upload with {max_workers} threads...")
    start_time = time.time()
    uploaded_files = 0
    uploaded_bytes = 0
    upload_errors = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(upload_single_file, s3, bucket_name, item[0], item[1], item[2]): item for item in to_upload}
        for future in as_completed(futures):
            try:
                r2_key, size = future.result()
                uploaded_files += 1
                uploaded_bytes += size
                if uploaded_files % 500 == 0 or uploaded_files == len(to_upload):
                    elapsed = time.time() - start_time
                    speed = (uploaded_bytes / (1024 * 1024)) / elapsed if elapsed > 0 else 0
                    print(f"[{uploaded_files:,}/{len(to_upload):,}] Uploaded {uploaded_bytes / (1024 * 1024):.2f} MB ({speed:.2f} MB/s)", flush=True)
            except Exception as e:
                item = futures[future]
                print(f"[!] Error uploading {item[1]}: {e}", flush=True)
                upload_errors.append((item[1], str(e)))

    total_time = time.time() - start_time
    print(f"[+] 3D R2 sync complete: {uploaded_files:,} files ({uploaded_bytes / (1024 * 1024):.2f} MB) in {total_time:.2f}s")
    if upload_errors:
        print(f"[!] Upload failed for {len(upload_errors):,} files; first failures:", flush=True)
        for r2_key, error in upload_errors[:20]:
            print(f"    {r2_key}: {error}", flush=True)
        raise SystemExit(1)
    if uploaded_files != len(to_upload):
        raise SystemExit(f"Upload count mismatch: expected {len(to_upload):,}, got {uploaded_files:,}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync 3D complex data to Cloudflare R2")
    parser.add_argument("--force", action="store_true", help="Force re-upload of all files")
    parser.add_argument("--dry-run", action="store_true", help="Simulate upload without actual changes")
    parser.add_argument("--workers", type=int, default=UPLOAD_WORKERS, help="Number of upload threads")
    parser.add_argument("--dir", default=None, help="Target directory containing 3D JSON files")
    parser.add_argument("--no-delete-orphans", action="store_true", help="Do not delete orphan R2 objects")
    parser.add_argument("--no-purge-local", action="store_true", help="Do not remove local files before syncing")
    args = parser.parse_args()

    sync_3d_to_r2(
        force=args.force,
        max_workers=args.workers,
        dry_run=args.dry_run,
        target_dir=args.dir,
        delete_orphans=not args.no_delete_orphans,
        purge_local=not args.no_purge_local,
    )
