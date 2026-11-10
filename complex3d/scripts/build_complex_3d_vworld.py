"""
=============================================================================
RealRankers 3D Complex Builder (Pure VWorld Government API Version)
국토교통부 브이월드(VWorld) 2D 건물 공간정보 API(LT_C_SPBD) 직접 연동 버전
작성일: 2026-11-09
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

VWORLD_API_KEY = os.getenv("VWORLD_API_KEY", "7A77E414-F858-3525-A20A-8E04AA2D8BD4")

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def query_vworld_buildings(lat, lng, buffer_m=350, key=VWORLD_API_KEY):
    """
    VWorld Data API 2.0: LT_C_SPBD (도로명주소 건물공간정보)
    중심점 (lng, lat) 기준 반경 buffer_m 내의 모든 건물 GeoJSON 폴리곤 수집
    """
    point_wkt = f"POINT({lng} {lat})"
    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LT_C_SPBD",
        "key": key,
        "geomFilter": point_wkt,
        "buffer": str(buffer_m),
        "geometry": "true",
        "format": "json",
        "size": "1000"
    }
    url = f"https://api.vworld.kr/req/data?{urllib.parse.urlencode(params)}"
    data = fetch_json(url)

    response = data.get("response", {})
    if response.get("status") != "OK":
        error_msg = response.get("error", {}).get("text", "VWorld API Error")
        raise RuntimeError(f"VWorld Error: {error_msg}")

    result = response.get("result", {})
    feature_collection = result.get("featureCollection", {})
    features = feature_collection.get("features", [])
    return features

def build_complex_3d_vworld(search_code, apt_name, law_addr, lat, lng, output_dir="data/3d", overwrite=False, key=VWORLD_API_KEY):
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, f"{search_code}.json")

    if not overwrite and os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
        return True, "Already exists (SKIP)"

    try:
        features = query_vworld_buildings(lat, lng, buffer_m=350, key=key)
        if not features:
            return False, "No buildings found in VWorld radius"

        clean_name = re.sub(r'\(.*?\)', '', apt_name).replace(" ", "")

        target_buildings = []
        neighbors = []

        for f in features:
            geom = f.get("geometry", {})
            props = f.get("properties", {})
            g_type = geom.get("type")
            coords = geom.get("coordinates", [])

            # Normalize polygon coordinates to rings [[lng, lat], ...]
            rings = []
            if g_type == "Polygon":
                rings = coords
            elif g_type == "MultiPolygon":
                rings = [poly[0] for poly in coords if poly]

            if not rings or not rings[0]:
                continue

            bld_name = props.get("buld_nm", "") or ""
            dong_name = props.get("buld_dong_nm", "") or ""
            # Floors from VWorld properties
            grnd_floors = props.get("gro_flo_co")
            floors = int(grnd_floors) if grnd_floors and str(grnd_floors).isdigit() and int(grnd_floors) > 0 else 15
            height_m = floors * 2.8

            clean_bld_name = bld_name.replace(" ", "")

            # Target complex matching (same apartment name or dong format within close radius)
            is_target = False
            if clean_bld_name and (clean_bld_name in clean_name or clean_name in clean_bld_name):
                is_target = True
            elif dong_name and re.match(r'^\d+동?$', dong_name.strip()):
                # Check distance from complex center
                p0 = rings[0][0]
                dist_approx = ((p0[0] - lng)**2 + (p0[1] - lat)**2)**0.5 * 111000
                if dist_approx < 180: # within 180m radius of apartment coordinate
                    is_target = True

            bld_obj = {
                "id": str(props.get("bd_mgt_sn") or props.get("bul_man_no") or f"v_{len(target_buildings)+len(neighbors)}"),
                "dong": dong_name if dong_name else (bld_name if bld_name else f"동_{len(target_buildings)+1}"),
                "name": bld_name or apt_name,
                "floors": floors,
                "heightM": height_m,
                "rings": rings
            }

            if is_target:
                target_buildings.append(bld_obj)
            else:
                neighbors.append(bld_obj)

        if not target_buildings and neighbors:
            # Fallback: Closest buildings to lat,lng become target
            neighbors.sort(key=lambda b: ((b['rings'][0][0][0] - lng)**2 + (b['rings'][0][0][1] - lat)**2))
            target_buildings = neighbors[:min(10, len(neighbors))]
            neighbors = neighbors[min(10, len(neighbors)):]

        output_data = {
            "searchCode": str(search_code),
            "name": apt_name,
            "lawAddr": law_addr,
            "center": {"lat": lat, "lng": lng},
            "buildings": target_buildings,
            "neighbors": neighbors,
            "floorBands": [
                {"label": "저층", "fromFloor": 1, "toFloor": 5, "count": 10, "perPyeong": 0},
                {"label": "중층", "fromFloor": 6, "toFloor": 10, "count": 10, "perPyeong": 0},
                {"label": "고층", "fromFloor": 11, "toFloor": 20, "count": 10, "perPyeong": 0}
            ],
            "source": "vworld_gov_direct"
        }

        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False)

        return True, f"Saved VWorld 3D ({len(target_buildings)} blds, {len(neighbors)} nbrs)"
    except Exception as e:
        return False, str(e)

def run_vworld_batch(month_dir="202611", top_n=20, output_dir="data/3d", key=VWORLD_API_KEY, workers=3, limit=None):
    if not os.path.exists(month_dir):
        print(f"Directory {month_dir} not found!")
        return

    files = [f for f in os.listdir(month_dir) if f.endswith('.json') and not f.startswith('1000000000') and not f.startswith('summary')]
    print(f"[VWorld Direct] Scanning {len(files)} gungu files in {month_dir} (Top {top_n} per gungu)...")

    seen_codes = set()
    targets = []
    for fname in sorted(files):
        fpath = os.path.join(month_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                d = json.load(f)
                items = d.get('data', [])
                for item in items[:top_n]:
                    code = item.get('검색코드') or item.get('searchCode')
                    name = item.get('아파트명')
                    addr = item.get('법정동주소')
                    x = item.get('X')
                    y = item.get('Y')
                    rank = item.get('rank', 0)
                    if code and name and x and y and str(code) not in seen_codes:
                        seen_codes.add(str(code))
                        targets.append({
                            'code': str(code),
                            'name': name,
                            'addr': addr or '',
                            'lat': float(y),
                            'lng': float(x),
                            'rank': rank,
                            'file': fname
                        })
        except Exception as e:
            print(f"Error reading {fname}: {e}")

    if limit:
        targets = targets[:limit]

    print(f"Total target complexes to build via VWorld: {len(targets)}")
    success_cnt, skip_cnt, fail_cnt = 0, 0, 0
    start_time = time.time()

    def process(t, idx):
        ok, msg = build_complex_3d_vworld(t['code'], t['name'], t['addr'], t['lat'], t['lng'], output_dir=output_dir, key=key)
        time.sleep(0.15)
        return idx, t, ok, msg

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(process, t, i + 1): t for i, t in enumerate(targets)}
        for future in as_completed(futures):
            idx, t, ok, msg = future.result()
            if "SKIP" in msg:
                skip_cnt += 1
                status = "SKIP"
            elif ok:
                success_cnt += 1
                status = "OK"
            else:
                fail_cnt += 1
                status = "FAIL"

            done_total = success_cnt + skip_cnt + fail_cnt
            if done_total % 10 == 0 or status == "OK" or done_total == len(targets):
                elapsed = time.time() - start_time
                print(f"[{done_total}/{len(targets)}] ({status}) {t['name']} ({t['code']}) -> {msg} ({elapsed:.1f}s)", flush=True)

    print("\n==========================================", flush=True)
    print(f"VWorld Batch completed: Total {len(targets)} | Success {success_cnt} | Skipped {skip_cnt} | Failed {fail_cnt}", flush=True)
    print("==========================================", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RealRankers VWorld Pure Public 3D Builder")
    parser.add_argument("--key", default=VWORLD_API_KEY, help="VWorld API Key")
    parser.add_argument("--batch", action="store_true", help="Run batch build for gungu")
    parser.add_argument("--month", default="202611", help="Monthly directory")
    parser.add_argument("--top", type=int, default=20, help="Top N per gungu")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of complexes")
    parser.add_argument("--output", default="data/3d", help="Output directory")

    args = parser.parse_args()

    if args.batch:
        run_vworld_batch(month_dir=args.month, top_n=args.top, output_dir=args.output, key=args.key, limit=args.limit)
    else:
        print(f"Testing VWorld API key: {args.key} ...")
        try:
            feats = query_vworld_buildings(37.6628, 127.0563, buffer_m=100, key=args.key)
            print(f"VWorld Key is ACTIVE! Found {len(feats)} buildings.")
        except Exception as e:
            print(f"VWorld Key is currently PENDING/INACTIVE: {e}")
            print("Once VWorld approves your key, run:")
            print("  python scripts/build_complex_3d_vworld.py --batch --top 20")
