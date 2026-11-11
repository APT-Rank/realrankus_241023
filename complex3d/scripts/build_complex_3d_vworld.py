"""
=============================================================================
RealRankers 3D Complex Builder (VWorld Government API + Ledger v2 Engine)
국토교통부 브이월드(VWorld) 2D 건물 공간정보 API(LT_C_SPBD) + 표제부/전유부 융합 보완기
=============================================================================
"""

import os
import sys
import json
import re
import time
import argparse
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

import build_all_korea_3d as b3d

VWORLD_API_KEY = os.getenv("VWORLD_API_KEY", "E87F22F1-8A2E-4F62-A53B-DDF1DF6E1F60")
VWORLD_DOMAIN = os.getenv("VWORLD_DOMAIN", "realrankus.com")


def fetch_json(url, retries=3):
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(0.6 * (attempt + 1))
    raise last_err


def _query_vworld_once(lat, lng, buffer_m, key, domain):
    point_wkt = f"POINT({lng} {lat})"
    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LT_C_SPBD",
        "key": key,
        "domain": domain,
        "geomFilter": point_wkt,
        "buffer": str(buffer_m),
        "geometry": "true",
        "format": "json",
        "size": "1000",
    }
    url = f"https://api.vworld.kr/req/data?{urllib.parse.urlencode(params)}"
    data = fetch_json(url)
    response = data.get("response", {})
    status = response.get("status")
    if status == "NOT_FOUND":
        return []
    if status != "OK":
        err = response.get("error", {})
        raise RuntimeError(f"VWorld Error ({err.get('code', '')}): {err.get('text', 'Unknown')}")
    return response.get("result", {}).get("featureCollection", {}).get("features", [])


def query_vworld_buildings(lat, lng, buffer_m=350, key=VWORLD_API_KEY, domain=VWORLD_DOMAIN):
    """Query VWorld LT_C_SPBD features; merge tighter core buffer if 1000-row cap hit."""
    feats = _query_vworld_once(lat, lng, buffer_m, key, domain)
    if len(feats) >= 1000 and buffer_m > 180:
        core_feats = _query_vworld_once(lat, lng, 180, key, domain)
        seen = set()
        merged = []
        for f in core_feats + feats:
            pr = f.get("properties") or {}
            sig = f"{pr.get('bd_mgt_sn', '')}_{pr.get('buld_nm', '')}_{pr.get('buld_nm_dc', '')}"
            if sig not in seen:
                seen.add(sig)
                merged.append(f)
        return merged
    return feats


def _transform_ring(ring):
    return [b3d.transformer_to_5186.transform(pt[0], pt[1]) for pt in ring if len(pt) >= 2]


def _geojson_geom_to_5186(geom):
    if not geom:
        return None
    g_type = geom.get("type")
    coords = geom.get("coordinates") or []
    try:
        if g_type == "Polygon":
            if not coords or len(coords[0]) < 3:
                return None
            ext = _transform_ring(coords[0])
            holes = [_transform_ring(h) for h in coords[1:] if len(h) >= 3]
            poly = Polygon(ext, holes)
            return poly if poly.is_valid else poly.buffer(0)
        elif g_type == "MultiPolygon":
            polys = []
            for p_coords in coords:
                if not p_coords or len(p_coords[0]) < 3:
                    continue
                ext = _transform_ring(p_coords[0])
                holes = [_transform_ring(h) for h in p_coords[1:] if len(h) >= 3]
                p = Polygon(ext, holes)
                if not p.is_valid:
                    p = p.buffer(0)
                if not p.is_empty:
                    polys.append(p)
            if not polys:
                return None
            return MultiPolygon(polys) if len(polys) > 1 else polys[0]
    except Exception:
        return None
    return None


def vworld_features_to_gdf(features):
    """Convert VWorld LT_C_SPBD GeoJSON features to EPSG:5186 GeoDataFrame compatible with build_complex_json."""
    rows = []
    for f in features:
        geom = _geojson_geom_to_5186(f.get("geometry"))
        if geom is None or geom.is_empty:
            continue
        pr = f.get("properties") or {}
        bd_mgt_sn = str(pr.get("bd_mgt_sn") or "").strip()
        pnu = bd_mgt_sn[:19] if len(bd_mgt_sn) >= 19 else ""

        a5 = ""
        if len(pnu) == 19:
            try:
                bun_i = int(pnu[11:15])
                ji_i = int(pnu[15:19])
                a5 = f"{bun_i}-{ji_i}" if ji_i > 0 else str(bun_i)
            except Exception:
                a5 = str(pr.get("buld_no") or "").strip()

        bld_nm = str(pr.get("buld_nm") or "").strip()
        bld_dc = str(pr.get("buld_nm_dc") or "").strip()
        try:
            flr = int(pr.get("gro_flo_co") or 0)
        except Exception:
            flr = 0

        a9 = "공동주택" if bld_nm else ""
        if "단독" in bld_nm or "단독" in bld_dc:
            a9 = "단독주택"

        rows.append({
            "A2": pnu,
            "A4": str(pr.get("gu") or "").strip(),
            "A5": a5,
            "A9": a9,
            "A16": 0.0,
            "A24": bld_nm,
            "A25": bld_dc,
            "A26": flr,
            "geometry": geom,
        })

    if not rows:
        return None
    gdf = gpd.GeoDataFrame(rows, geometry="geometry", crs="EPSG:5186")
    _ = gdf.sindex
    return gdf


def _safe_int(val):
    try:
        return int(str(val).replace(",", "").strip())
    except Exception:
        return 0


def build_single_vworld_v2(cpx, pyoje_data, jeonyu_data, key=VWORLD_API_KEY, domain=VWORLD_DOMAIN):
    hh_total = _safe_int(cpx.get("households") or 0)
    buf = 550 if hh_total >= 1500 else (420 if hh_total >= 500 else 340)
    feats = query_vworld_buildings(cpx["y"], cpx["x"], buffer_m=buf, key=key, domain=domain)
    if not feats:
        return None, "No features in VWorld radius"
    gdf = vworld_features_to_gdf(feats)
    if gdf is None or len(gdf) == 0:
        return None, "No valid VWorld polygons"
    data = b3d.build_complex_json(cpx, gdf, pyoje_data, jeonyu_data, source_label="vworld_ledger_fused_v2")
    if data and len(data.get("buildings", [])) > 0:
        return data, f"OK ({len(data['buildings'])} blds, {len(data.get('neighbors', []))} nbrs)"
    return None, "Matched 0 target buildings in VWorld"


def run_vworld_targets_batch(targets, output_dir=b3d.OUTPUT_DIR, root_dir=None, key=VWORLD_API_KEY, domain=VWORLD_DOMAIN, workers=6, overwrite=True, limit=None):
    if root_dir is None:
        root_dir = os.path.join(b3d.REPO_ROOT, "data", "3d")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(root_dir, exist_ok=True)

    if limit:
        targets = targets[:limit]

    print(f"[VWorld v2] Scanning ledgers for {len(targets):,} fallback complexes...")
    pyoje_data, jeonyu_data = b3d.scan_ledgers_for_complexes(targets)

    # Filter out ONLY complexes already completed with official v2 data (never preserve legacy v1 or unofficial cx_ data)
    OFFICIAL_V2_MARKERS = ('"korea_gis_ledger_fused_v2"', '"vworld_ledger_fused_v2"', '"vworld_ledger_pure_v2"')
    todo = []
    skipped = 0
    for cpx in targets:
        out_file = os.path.join(output_dir, f"{cpx['code']}.json")
        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            try:
                with open(out_file, "r", encoding="utf-8") as fp:
                    txt = fp.read()
                if any(m in txt for m in OFFICIAL_V2_MARKERS):
                    root_out = os.path.join(root_dir, f"{cpx['code']}.json")
                    if not os.path.exists(root_out) or os.path.getsize(root_out) != os.path.getsize(out_file):
                        with open(root_out, "w", encoding="utf-8") as wp:
                            wp.write(txt)
                    skipped += 1
                    continue
            except Exception:
                pass
        todo.append(cpx)

    print(f"[VWorld v2] Processing {len(todo):,} targets (pre-skipped valid: {skipped}) with {workers} workers...")
    succ, fail = 0, 0
    unmatched = []
    t0 = time.time()

    def worker(cpx):
        time.sleep(0.06)
        try:
            data, msg = build_single_vworld_v2(cpx, pyoje_data, jeonyu_data, key=key, domain=domain)
            return cpx, data, msg
        except Exception as e:
            return cpx, None, str(e)

    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(worker, c) for c in todo]
        for i, fut in enumerate(as_completed(futures), 1):
            cpx, data, msg = fut.result()
            if data:
                compact = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
                out_file = os.path.join(output_dir, f"{cpx['code']}.json")
                root_out = os.path.join(root_dir, f"{cpx['code']}.json")
                with open(out_file, "w", encoding="utf-8") as fp:
                    fp.write(compact)
                with open(root_out, "w", encoding="utf-8") as fp:
                    fp.write(compact)
                succ += 1
            else:
                fail += 1
                unmatched.append({"code": cpx["code"], "name": cpx["name"], "addr": cpx["addr"], "reason": msg})

            if i % 25 == 0 or i == len(todo):
                print(f"[VWorld {i}/{len(todo)}] Success={succ} Fail={fail} ({time.time() - t0:.1f}s) last={cpx['name']} -> {msg}", flush=True)

    report_path = os.path.join(SCRIPT_DIR, "vworld_unmatched_report.json")
    with open(report_path, "w", encoding="utf-8") as fp:
        json.dump(unmatched, fp, ensure_ascii=False, indent=2)
    print(f"\n[VWorld v2 Complete] Success={succ}, Skipped={skipped}, Failed={fail}. Unmatched list saved to {report_path}")
    return succ, fail


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RealRankers VWorld + Ledger v2 3D Supplementer")
    parser.add_argument("--key", default=VWORLD_API_KEY, help="VWorld API Key")
    parser.add_argument("--domain", default=VWORLD_DOMAIN, help="Registered VWorld API domain")
    parser.add_argument("--targets-file", default=None, help="JSON list of fallback complexes from build_all_korea_3d.py")
    parser.add_argument("--batch", action="store_true", help="Run batch across month dir if no targets-file given")
    parser.add_argument("--month", default=os.path.join(b3d.REPO_ROOT, "202611"), help="Monthly directory")
    parser.add_argument("--top", type=int, default=9999, help="Top N per gungu when using --batch")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of complexes")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent HTTP workers")
    parser.add_argument("--output", default=b3d.OUTPUT_DIR, help="Output directory")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite non-v2 files")
    args = parser.parse_args()

    if args.targets_file:
        with open(args.targets_file, "r", encoding="utf-8") as fp:
            target_list = json.load(fp)
        run_vworld_targets_batch(
            target_list,
            output_dir=args.output,
            key=args.key,
            domain=args.domain,
            workers=args.workers,
            overwrite=True,
            limit=args.limit,
        )
    elif args.batch:
        all_cpx = list(b3d.load_all_target_complexes(month_dir=args.month).values())
        run_vworld_targets_batch(
            all_cpx,
            output_dir=args.output,
            key=args.key,
            domain=args.domain,
            workers=args.workers,
            overwrite=args.overwrite,
            limit=args.limit,
        )
    else:
        print(f"Testing VWorld API key: {args.key} (domain={args.domain}) ...")
        feats = query_vworld_buildings(37.6628, 127.0563, buffer_m=150, key=args.key, domain=args.domain)
        print(f"VWorld Key is ACTIVE! Found {len(feats)} buildings.")
