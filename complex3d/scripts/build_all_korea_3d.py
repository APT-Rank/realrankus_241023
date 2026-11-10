"""
build_all_korea_3d.py
=====================
전국 GIS 건물 SHP + 국토교통부 건축물대장(표제부/전유부) 융합 3D 빌더 파이프라인

융합 데이터:
1. 전국 GIS 건물 외곽선 SHP (EPSG:5186 -> EPSG:4326): 실측 동별 풋프린트 & 높이
2. 건축물대장 표제부 (mart_djy_03.txt): 엘리베이터, 자주식/기계식 주차, 층고, 내진/구조, 사용승인일
3. 건축물대장 전유부 (mart_djy_09.txt): 라인별 계단식 단차(floorMin/Max), 1층 필로티, 실존 호수 목록

출력:
complex3d/data/3d/{searchCode}.json 및 data/3d/{searchCode}.json
R2 동기화:
--upload 옵션 시 Cloudflare R2 버킷 s3://realrankus-data/data/3d/ 에 자동 동기화
"""

import os
import sys
import glob
import json
import re
import time
import argparse
from concurrent.futures import ThreadPoolExecutor

try:
    import pyproj
    import geopandas as gpd
    import pandas as pd
    from shapely.geometry import mapping
except ImportError:
    print("Required packages: pyproj, geopandas, pandas, shapely")
    sys.exit(1)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
GIS_DIR = r"D:\real_estate_data\99_GIS_Building_shp"
PYOJE_PATH = os.path.join(GIS_DIR, r"국토교통부_건축물대장_표제부\mart_djy_03.txt")
JEONYU_PATH = os.path.join(GIS_DIR, r"국토교통부_건축물대장_전유부\mart_djy_09.txt")
OUTPUT_DIR = os.path.join(REPO_ROOT, "complex3d", "data", "3d")

# Coordinate transformers
transformer_to_5186 = pyproj.Transformer.from_crs('EPSG:4326', 'EPSG:5186', always_xy=True)
transformer_to_4326 = pyproj.Transformer.from_crs('EPSG:5186', 'EPSG:4326', always_xy=True)

SIDO_MAP = {
    '11': '서울', '12': '광주/전남', '26': '부산', '27': '대구', '28': '인천', '29': '광주',
    '30': '대전', '31': '울산', '36': '세종', '41': '경기', '42': '강원',
    '43': '충북', '44': '충남', '45': '전북', '46': '전남', '47': '경북',
    '48': '경남', '50': '제주', '51': '강원', '52': '전북'
}

def load_all_target_complexes(month_dir=os.path.join(REPO_ROOT, "202611"), filter_sido=None):
    """Load all unique complexes from RealRankus month folder."""
    files = [f for f in os.listdir(month_dir) if f.endswith('.json') and not f.startswith('1000000000') and not f.startswith('summary')]
    
    complexes = {}
    for fname in sorted(files):
        sido_prefix = fname[:2]
        if filter_sido and filter_sido != 'all' and sido_prefix != filter_sido:
            continue
            
        fpath = os.path.join(month_dir, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as fp:
                d = json.load(fp)
                for it in d.get('data', []):
                    code = str(it.get('검색코드') or it.get('searchCode') or '')
                    if not code or code in complexes:
                        continue
                    
                    addr = it.get('법정동주소') or ''
                    name = it.get('아파트명') or ''
                    x = float(it.get('X') or 0)
                    y = float(it.get('Y') or 0)
                    if x == 0 or y == 0:
                        continue
                        
                    # Extract parcel bun and ji
                    m = re.search(r'(\d+)(?:-(\d+))?$', addr.strip())
                    bun = f"{int(m.group(1)):04d}" if m else "0000"
                    ji = f"{int(m.group(2)):04d}" if m and m.group(2) else "0000"
                    
                    complexes[code] = {
                        'code': code,
                        'name': name,
                        'addr': addr,
                        'x': x,
                        'y': y,
                        'sido': sido_prefix,
                        'sigungu_code': fname[:5],
                        'bun': bun,
                        'ji': ji,
                        'households': it.get('세대수') or 0
                    }
        except Exception as e:
            print(f"Error reading {fname}: {e}")
            
    return complexes

def scan_ledgers_for_complexes(complex_list):
    """Scan Pyoje and Jeonyu text files once for target complexes."""
    target_parcels = set()
    for c in complex_list:
        target_parcels.add((c['sigungu_code'], c['bun'], c['ji']))
        
    print(f"Indexing ledgers for {len(target_parcels)} target parcels...")
    
    # 1. Scan Pyoje (표제부)
    pyoje_data = {} # (sigungu, bun, ji) -> list of building dicts
    t0 = time.time()
    if os.path.exists(PYOJE_PATH):
        with open(PYOJE_PATH, 'r', encoding='utf-8', errors='ignore') as fp:
            for line in fp:
                # Fast sigungu check: e.g. line has parts[8]
                # A quick slice or split
                parts = line.strip().split('|')
                if len(parts) > 60:
                    sigungu = parts[8]
                    bun = parts[11]
                    ji = parts[12]
                    key = (sigungu, bun, ji)
                    if key in target_parcels:
                        dong = parts[22].strip()
                        if not dong:
                            dong = parts[7].strip()
                        if key not in pyoje_data:
                            pyoje_data[key] = {}
                        
                        try:
                            height = float(parts[42]) if parts[42] else 0.0
                        except:
                            height = 0.0
                        try:
                            grnd_flr = int(parts[43]) if parts[43] else 0
                        except:
                            grnd_flr = 0
                        try:
                            ugrnd_flr = int(parts[44]) if parts[44] else 0
                        except:
                            ugrnd_flr = 0
                        try:
                            elev_pass = int(parts[45]) if parts[45] else 0
                        except:
                            elev_pass = 0
                        try:
                            elev_emerg = int(parts[46]) if parts[46] else 0
                        except:
                            elev_emerg = 0
                        try:
                            park_indoor = float(parts[48]) if parts[48] else 0
                        except:
                            park_indoor = 0
                        try:
                            park_self = int(parts[54]) if parts[54] else 0
                        except:
                            park_self = 0
                            
                        pyoje_data[key][dong] = {
                            'bld_name': parts[7].strip(),
                            'dong': dong,
                            'height': height,
                            'grnd_flr': grnd_flr,
                            'ugrnd_flr': ugrnd_flr,
                            'elev_pass': elev_pass,
                            'elev_emerg': elev_emerg,
                            'park_indoor': park_indoor,
                            'park_self': park_self,
                            'struct': parts[32].strip(),
                            'use_apr': parts[60].strip()
                        }
        print(f"Pyoje indexed in {time.time()-t0:.2f}s (found {len(pyoje_data)} parcels)")
    else:
        print("Pyoje file not found, skipping Pyoje indexing.")

    # 2. Scan Jeonyu (전유부)
    jeonyu_data = {} # (sigungu, bun, ji) -> dong -> { lines: {}, units: [], has_piloti: bool }
    t0 = time.time()
    if os.path.exists(JEONYU_PATH):
        with open(JEONYU_PATH, 'r', encoding='utf-8', errors='ignore') as fp:
            for line in fp:
                parts = line.strip().split('|')
                if len(parts) > 25:
                    sigungu = parts[8]
                    bun = parts[11]
                    ji = parts[12]
                    key = (sigungu, bun, ji)
                    if key in target_parcels:
                        dong = parts[21].strip()
                        ho = parts[22].strip()
                        try:
                            flr = int(parts[25]) if parts[25] else 1
                        except:
                            flr = 1
                            
                        if key not in jeonyu_data:
                            jeonyu_data[key] = {}
                        if dong not in jeonyu_data[key]:
                            jeonyu_data[key][dong] = {
                                'line_floors': {},
                                'units': [],
                                'min_floor': 999,
                                'max_floor': 0
                            }
                            
                        # Determine line from ho (e.g. 101 -> line 1, 1502 -> line 2)
                        m_line = re.search(r'(\d{1,2})$', ho)
                        line_no = f"{int(m_line.group(1)):02d}" if m_line else "01"
                        
                        lf = jeonyu_data[key][dong]['line_floors']
                        if line_no not in lf:
                            lf[line_no] = {'floorMin': flr, 'floorMax': flr, 'count': 0}
                        lf[line_no]['floorMin'] = min(lf[line_no]['floorMin'], flr)
                        lf[line_no]['floorMax'] = max(lf[line_no]['floorMax'], flr)
                        lf[line_no]['count'] += 1
                        
                        jeonyu_data[key][dong]['min_floor'] = min(jeonyu_data[key][dong]['min_floor'], flr)
                        jeonyu_data[key][dong]['max_floor'] = max(jeonyu_data[key][dong]['max_floor'], flr)
                        if len(jeonyu_data[key][dong]['units']) < 100: # keep sample
                            jeonyu_data[key][dong]['units'].append({'unit': ho, 'floor': flr, 'line': line_no})
                            
        print(f"Jeonyu indexed in {time.time()-t0:.2f}s (found {len(jeonyu_data)} parcels)")
    else:
        print("Jeonyu file not found, skipping Jeonyu indexing.")
        
    return pyoje_data, jeonyu_data

def build_complex_json(cpx, gdf_sido, pyoje_data, jeonyu_data):
    """Build a rich 3D JSON for a single complex using SHP polygons and ledger data."""
    cx, cy = transformer_to_5186.transform(cpx['x'], cpx['y'])
    
    # 250m bounding box
    bbox = (cx - 250, cy - 250, cx + 250, cy + 250)
    try:
        # Spatial filter in memory
        matched_gdf = gdf_sido.cx[bbox[0]:bbox[2], bbox[1]:bbox[3]]
    except Exception:
        return None
        
    if len(matched_gdf) == 0:
        return None
        
    # Match apartment buildings
    clean_name = re.sub(r'\(.*?\)', '', cpx['name']).strip()
    key_word = clean_name.replace('아파트', '').strip()[:4]
    
    matched = matched_gdf[matched_gdf['A24'].str.contains(key_word, na=False) | matched_gdf['A25'].str.contains(key_word, na=False)]
    if len(matched) == 0:
        # Fallback to bun
        matched = matched_gdf[matched_gdf['A5'].astype(str) == str(int(cpx['bun']))]
        
    if len(matched) == 0:
        # Final fallback: take buildings within 150m of center having A9 공동주택/아파트
        dist_sq = (matched_gdf.geometry.centroid.x - cx)**2 + (matched_gdf.geometry.centroid.y - cy)**2
        matched = matched_gdf[dist_sq <= (180.0**2)]
        
    if len(matched) == 0:
        return None
        
    parcel_key = (cpx['sigungu_code'], cpx['bun'], cpx['ji'])
    cpx_pyoje = pyoje_data.get(parcel_key, {})
    cpx_jeonyu = jeonyu_data.get(parcel_key, {})
    
    buildings = []
    total_households = 0
    total_elev_pass = 0
    total_elev_emerg = 0
    total_park_self = 0
    max_height = 0.0
    structures = set()
    use_approval_dates = set()
    
    for idx, row in matched.iterrows():
        bld_name = str(row['A24'] or '')
        dong_name = str(row['A25'] or '')
        if not dong_name or dong_name == 'None':
            # Extract dong from bld_name
            m_d = re.search(r'(\d+동)', bld_name)
            dong_name = m_d.group(1) if m_d else f"{len(buildings)+1}01동"
            
        # Get polygon rings transformed to EPSG:4326
        geom = row.geometry
        if geom is None or geom.is_empty:
            continue

        # [방안 A] 바닥면적 25㎡ 미만 또는 최소 변 3.0m 미만 초소형 노이즈/환기탑/기호 원천 제거
        poly_area = geom.area
        minx, miny, maxx, maxy = geom.bounds
        if poly_area < 25.0 or min(maxx - minx, maxy - miny) < 3.0:
            continue
            
        rings = []
        if geom.geom_type == 'Polygon':
            coords = [list(transformer_to_4326.transform(x, y)) for x, y in geom.exterior.coords]
            rings.append(coords)
            for interior in geom.interiors:
                rings.append([list(transformer_to_4326.transform(x, y)) for x, y in interior.coords])
        elif geom.geom_type == 'MultiPolygon':
            # Take largest polygon
            poly = max(geom.geoms, key=lambda a: a.area)
            coords = [list(transformer_to_4326.transform(x, y)) for x, y in poly.exterior.coords]
            rings.append(coords)
            for interior in poly.interiors:
                rings.append([list(transformer_to_4326.transform(x, y)) for x, y in interior.coords])
                
        if not rings:
            continue
            
        # Check Pyoje & Jeonyu
        p_dong = cpx_pyoje.get(dong_name) or next((v for k, v in cpx_pyoje.items() if dong_name in k or k in dong_name), None)
        j_dong = cpx_jeonyu.get(dong_name) or next((v for k, v in cpx_jeonyu.items() if dong_name in k or k in dong_name), None)
        
        # Determine height and floors safely handling NaN / None
        try:
            flr_val = row['A26']
            flr = int(float(flr_val)) if flr_val is not None and not pd.isna(flr_val) else 0
        except Exception:
            flr = 0
            
        try:
            h_val = row['A16']
            height = float(h_val) if h_val is not None and not pd.isna(h_val) else 0.0
        except Exception:
            height = 0.0
        if p_dong:
            if p_dong['height'] > 0:
                height = p_dong['height']
            if p_dong['grnd_flr'] > 0:
                flr = p_dong['grnd_flr']
            if p_dong['struct']:
                structures.add(p_dong['struct'])
            if p_dong['use_apr']:
                use_approval_dates.add(p_dong['use_apr'])
            total_elev_pass += p_dong['elev_pass']
            total_elev_emerg += p_dong['elev_emerg']
            total_park_self += p_dong['park_self']
            
        if height <= 0:
            height = max(flr * 3.0, 9.0) if flr > 0 else 15.0
        if flr <= 0:
            flr = max(int(height / 3.0), 3)
            
        max_height = max(max_height, height)
        
        # Build lines with stepped단차
        lines = []
        piloti = False
        if j_dong:
            for l_no, l_data in sorted(j_dong['line_floors'].items()):
                lines.append({
                    'line': l_no,
                    'floorMin': l_data['floorMin'],
                    'floorMax': l_data['floorMax'],
                    'count': l_data['count']
                })
            piloti = (j_dong['min_floor'] > 1)
            
        bld_entry = {
            'id': f"bd_{cpx['code']}_{len(buildings)+1}",
            'dong': dong_name,
            'name': f"{cpx['name']} {dong_name}",
            'usage': '공동주택',
            'residential': True,
            'households': sum(l['count'] for l in lines) if lines else 0,
            'floors': flr,
            'floorsBelow': p_dong['ugrnd_flr'] if p_dong else 1,
            'heightM': round(height, 2),
            'approvalDate': p_dong['use_apr'] if p_dong else '',
            'piloti': piloti,
            'lines': lines,
            'units': j_dong['units'] if j_dong else [],
            'hardware': {
                'elevPass': p_dong['elev_pass'] if p_dong else 0,
                'elevEmerg': p_dong['elev_emerg'] if p_dong else 0,
                'parkSelf': p_dong['park_self'] if p_dong else 0,
                'structure': p_dong['struct'] if p_dong else '철근콘크리트구조'
            },
            'rings': rings,
            'kind': 'primary',
            'selectable': True,
            'label': dong_name
        }
        total_households += bld_entry['households']
        buildings.append(bld_entry)
        
    if not buildings:
        return None
        
    # Build complex-level hardware specs
    specs = {
        'totalDongCount': len(buildings),
        'totalHouseholds': total_households or cpx['households'],
        'maxHeightM': round(max_height, 2),
        'maxFloors': max((b['floors'] for b in buildings), default=0),
        'avgFloorHeightM': round(max_height / max((b['floors'] for b in buildings), default=1), 2),
        'structure': next(iter(structures), '철근콘크리트구조'),
        'useApprovalDate': next(iter(use_approval_dates), ''),
        'parking': {
            'totalSelf': total_park_self,
            'perHousehold': round(total_park_self / (total_households or 1), 2) if total_park_self > 0 else None
        },
        'elevators': {
            'passenger': total_elev_pass,
            'emergency': total_elev_emerg,
            'householdsPerElevator': round(total_households / total_elev_pass, 1) if total_elev_pass > 0 else None
        }
    }
    
    return {
        'searchCode': str(cpx['code']),
        'name': cpx['name'],
        'lawAddr': cpx['addr'],
        'center': {'lat': float(cpx['y']), 'lng': float(cpx['x'])},
        'specs': specs,
        'buildings': buildings,
        'neighbors': [],
        'floorBands': [5, 10, 15, 20, 25, 30],
        'coverage': {
            'primaryCount': len(buildings),
            'steppedCount': sum(1 for b in buildings if len(b['lines']) > 1)
        },
        'source': 'korea_gis_ledger_fused'
    }

def process_sido(sido_code, limit=None, overwrite=False):
    """Process all complexes in a given Sido."""
    sido_name = SIDO_MAP.get(sido_code, sido_code)
    print(f"\n==========================================")
    print(f"[*] Processing Sido: {sido_code} ({sido_name})")
    print(f"==========================================")
    
    # 1. Load target complexes for this sido
    complexes = load_all_target_complexes(filter_sido=sido_code)
    cpx_list = list(complexes.values())
    if limit:
        cpx_list = cpx_list[:limit]
    print(f"Found {len(cpx_list)} complexes in {sido_name}")
    if not cpx_list:
        return 0, 0
        
    # 2. Find matching SHP files for this sido
    shp_pattern = os.path.join(GIS_DIR, f"AL_D010_{sido_code}_*\\*.shp")
    shp_files = glob.glob(shp_pattern)
    if not shp_files:
        # Check direct
        shp_pattern = os.path.join(GIS_DIR, f"AL_D010_{sido_code}_*.shp")
        shp_files = glob.glob(shp_pattern)
        
    if not shp_files:
        print(f"No SHP files found for Sido {sido_code} in {GIS_DIR}")
        return 0, 0
        
    print(f"Loading {len(shp_files)} SHP files for {sido_name}...")
    t0 = time.time()
    gdfs = []
    for s in shp_files:
        try:
            # Load residential/apartment buildings
            gdf = gpd.read_file(s, encoding='cp949')
            # Ensure spatial index
            _ = gdf.sindex
            gdfs.append(gdf)
        except Exception as e:
            print(f"Error loading {s}: {e}")
            
    if not gdfs:
        return 0, 0
        
    import pandas as pd
    combined_gdf = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=gdfs[0].crs)
    print(f"Combined {len(combined_gdf):,} features in {time.time()-t0:.2f}s")
    
    # 3. Scan Pyoje & Jeonyu
    pyoje_data, jeonyu_data = scan_ledgers_for_complexes(cpx_list)
    
    # 4. Generate JSON for each complex
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    success_cnt = 0
    skip_cnt = 0
    fail_cnt = 0
    
    t0 = time.time()
    for idx, cpx in enumerate(cpx_list):
        out_file = os.path.join(OUTPUT_DIR, f"{cpx['code']}.json")
        if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
            if not overwrite:
                skip_cnt += 1
                continue
            # overwrite mode: only regenerate legacy (non-fused) files
            try:
                with open(out_file, 'r', encoding='utf-8') as fp:
                    if '"korea_gis_ledger_fused"' in fp.read():
                        skip_cnt += 1
                        continue
            except Exception:
                pass
            
        try:
            data = build_complex_json(cpx, combined_gdf, pyoje_data, jeonyu_data)
        except Exception as e:
            data = None
        if data and len(data['buildings']) > 0:
            with open(out_file, 'w', encoding='utf-8') as fp:
                json.dump(data, fp, ensure_ascii=False, indent=2)
            # Also write to repo root data/3d for local testing
            root_out = os.path.join(REPO_ROOT, "data", "3d", f"{cpx['code']}.json")
            os.makedirs(os.path.dirname(root_out), exist_ok=True)
            with open(root_out, 'w', encoding='utf-8') as fp:
                json.dump(data, fp, ensure_ascii=False, indent=2)
            success_cnt += 1
        else:
            fail_cnt += 1
            
        if (idx + 1) % 100 == 0 or (idx + 1) == len(cpx_list):
            print(f"Progress [{sido_name}]: {idx+1}/{len(cpx_list)} | Success: {success_cnt} | Skipped: {skip_cnt} | Failed: {fail_cnt}")
            
    print(f"Finished {sido_name} in {time.time()-t0:.2f}s: {success_cnt} created, {skip_cnt} skipped, {fail_cnt} failed")
    return success_cnt, fail_cnt

def main():
    parser = argparse.ArgumentParser(description="Build rich 3D complex data from nationwide GIS & ledgers")
    parser.add_argument('--sido', default='11', help="Sido code (e.g. 11 for Seoul, 41 for Gyeonggi, or 'all')")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of complexes per Sido for testing")
    parser.add_argument('--overwrite', action='store_true', help="Overwrite existing 3D json files")
    parser.add_argument('--upload', action='store_true', help="Automatically upload to Cloudflare R2 after building")
    args = parser.parse_args()
    
    print(f"=== Starting RealRankus Nationwide 3D Generator ===")
    print(f"Output Directory: {OUTPUT_DIR}")
    
    if args.sido == 'all':
        sido_list = ['11', '41', '28', '26', '27', '12', '30', '31', '36', '43', '44', '47', '48', '50', '51', '52']
    else:
        sido_list = [args.sido]
        
    total_success = 0
    total_fail = 0
    for s in sido_list:
        succ, fail = process_sido(s, limit=args.limit, overwrite=args.overwrite)
        total_success += succ
        total_fail += fail
        
    print(f"\n==========================================")
    print(f"Total 3D generation complete: {total_success} generated, {total_fail} failed")
    print(f"==========================================")
    
    if args.upload:
        print("\n[*] Triggering Cloudflare R2 Synchronization...")
        sync_script = os.path.join(REPO_ROOT, "complex3d", "scripts", "sync_3d_to_r2.py")
        if os.path.exists(sync_script):
            os.system(f"{sys.executable} {sync_script}")
        else:
            print(f"Sync script not found: {sync_script}")

if __name__ == '__main__':
    main()
