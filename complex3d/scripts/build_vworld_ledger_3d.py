"""
=============================================================================
RealRankers Pure VWorld + Ledger 3D Complex Generator
SHP 파일 없이 순수하게 VWorld API(LT_C_SPBD) + 건축물대장(표제부/전유부)만으로
단지별 3D 건물 JSON 데이터를 생성하는 독립 실행형 모듈입니다.

사용 예시:
  # 단일/복수 단지 생성 (검색코드 지정)
  python build_vworld_ledger_3d.py --code 8289 109379 121971

  # 시군구 또는 시도 전체 생성
  python build_vworld_ledger_3d.py --sigungu 11680 --overwrite
  python build_vworld_ledger_3d.py --sido 11 --limit 50

  # 전국 일괄 생성
  python build_vworld_ledger_3d.py --batch --workers 6 --overwrite
=============================================================================
"""

import argparse
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

import pyproj
from shapely.geometry import MultiPolygon, Polygon

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
DEFAULT_OUTPUT_DIR = os.path.join(REPO_ROOT, "complex3d", "data", "3d")
DEFAULT_MIRROR_DIR = os.path.join(REPO_ROOT, "data", "3d")

DEFAULT_PYOJE_PATH = os.getenv(
    "PYOJE_PATH",
    r"D:\real_estate_data\99_GIS_Building_shp\국토교통부_건축물대장_표제부\mart_djy_03.txt",
)
DEFAULT_JEONYU_PATH = os.getenv(
    "JEONYU_PATH",
    r"D:\real_estate_data\99_GIS_Building_shp\국토교통부_건축물대장_전유부\mart_djy_09.txt",
)

VWORLD_API_KEY = os.getenv("VWORLD_API_KEY", "E87F22F1-8A2E-4F62-A53B-DDF1DF6E1F60")
VWORLD_DOMAIN = os.getenv("VWORLD_DOMAIN", "realrankus.com")

TRANSFORMER_TO_5186 = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:5186", always_xy=True)
TRANSFORMER_TO_4326 = pyproj.Transformer.from_crs("EPSG:5186", "EPSG:4326", always_xy=True)

AUX_KEYWORDS = (
    "경비", "관리", "노인", "주차", "상가", "유치원", "어린이집", "근린",
    "펌프", "전기", "변전", "발전", "기계", "보일러", "창고", "쓰레기",
    "분리", "화장실", "주민", "커뮤니티", "복지", "문고", "독서", "헬스",
    "테니스", "정자", "공공", "경로당", "문주", "스포츠", "체육",
)


def is_aux_name(name):
    s = str(name or "").strip()
    return any(k in s for k in AUX_KEYWORDS)


def extract_dong_from_addr(addr):
    s = re.sub(r"\s+(?:산\s*)?\d+(?:-\d+)?(?:번지?)?$", "", str(addr or "").strip())
    parts = s.split()
    return parts[-1] if parts else ""


def norm_bjdong_stem(dong_tok):
    """Normalize 행정동/법정동 token so 상계8동==상계동 while keeping 일원동!=역삼동."""
    s = re.sub(r"\s+", "", str(dong_tok or "").strip())
    if not s:
        return ""
    s = re.sub(r"동(?=\d+가$)", "", s)
    s = re.sub(r"(?:제?\d+)?동$", "", s)
    return s


_BRAND_ALIASES = (
    (r"the\s*sharp|더\s*샵", "더샵"),
    (r"hill\s*state|힐스테이트", "힐스테이트"),
    (r"raemian|래미안", "래미안"),
    (r"prugio|푸르지오", "푸르지오"),
    (r"lotte\s*castle|롯데캐슬", "롯데캐슬"),
    (r"i[\s\-]*park|아이파크", "아이파크"),
    (r"e[\s\-]*편한세상", "e편한세상"),
    (r"forena|포레나", "포레나"),
    (r"elife|엘리프", "엘리프"),
    (r"haus\s*d|하우스디", "하우스디"),
    (r"(?<![a-z0-9])xi(?![a-z0-9])", "자이"),
)


def _clean_cpx_text(s):
    s = str(s or "").lower()
    s = re.sub(r"\(.*?\)", "", s)
    for pat, rep in _BRAND_ALIASES:
        s = re.sub(pat, rep, s)
    s = re.sub(r"아파트|주상복합|도시형생활주택|오피스텔", "", s)
    s = re.sub(r"[\s\.\,\·\-\_]+", "", s)
    return s.strip()


def _extract_unit_tags(s):
    txt = str(s or "")
    danji = re.findall(r"(\d+)\s*단지", txt)
    chasu = re.findall(r"(\d+)\s*차", txt)
    jigu = re.findall(r"(\d+)\s*지구", txt)
    roman = (
        re.findall(r"(Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|I{1,3}V?)", txt)
        if any(r in txt for r in ("Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"))
        else []
    )
    return set(danji), set(chasu), set(jigu), set(roman)


def is_strict_name_match(cpx_name, pyoje_bld_names, cand_name):
    cand_raw = str(cand_name or "").strip()
    if not cand_raw or cand_raw == "None":
        return False

    c_danji, c_chasu, c_jigu, c_rom = _extract_unit_tags(cpx_name)
    a_danji, a_chasu, a_jigu, a_rom = _extract_unit_tags(cand_raw)

    if c_danji and a_danji and not (c_danji & a_danji):
        return False
    if c_chasu and a_chasu and not (c_chasu & a_chasu):
        return False
    if c_jigu and a_jigu and not (c_jigu & a_jigu):
        return False
    if c_rom and a_rom and not (c_rom & a_rom):
        return False

    cand_clean = _clean_cpx_text(cand_raw)
    if len(cand_clean) < 2:
        return False

    targets = [_clean_cpx_text(cpx_name)]
    for pn in (pyoje_bld_names or []):
        pc = _clean_cpx_text(pn)
        if pc and len(pc) >= 2:
            targets.append(pc)

    stripped_targets = list(targets)
    for t in targets:
        m = re.match(r"^[가-힣]{2,5}(?:마을|신도시|지구)(.+)$", t)
        if m and len(m.group(1)) >= 3:
            stripped_targets.append(m.group(1))

    for t in stripped_targets:
        if not t or len(t) < 2:
            continue
        if t == cand_clean:
            return True
        if len(t) >= 4 and len(cand_clean) >= 4:
            if t in cand_clean or cand_clean in t:
                return True
    return False


def is_strong_full_name_match(cpx_name, pyoje_bld_names, cand_name):
    if not is_strict_name_match(cpx_name, pyoje_bld_names, cand_name):
        return False
    cand_clean = _clean_cpx_text(cand_name)
    if len(cand_clean) < 5:
        return False
    targets = [_clean_cpx_text(cpx_name)] + [_clean_cpx_text(p) for p in (pyoje_bld_names or [])]
    return any(len(t) >= 5 and (t == cand_clean or t in cand_clean or cand_clean in t) for t in targets)


def is_needle_or_sliver(geom):
    """Reject sliver polygons (< 25 sqm or rotated minimum width < 3.0m)."""
    if geom is None or geom.is_empty:
        return True
    if geom.area < 25.0:
        return True
    minx, miny, maxx, maxy = geom.bounds
    if min(maxx - minx, maxy - miny) < 3.0:
        return True
    try:
        mrr = geom.minimum_rotated_rectangle
        if mrr is not None and mrr.geom_type == "Polygon":
            coords = list(mrr.exterior.coords)
            if len(coords) >= 4:
                e1 = math.hypot(coords[1][0] - coords[0][0], coords[1][1] - coords[0][1])
                e2 = math.hypot(coords[2][0] - coords[1][0], coords[2][1] - coords[1][1])
                if min(e1, e2) < 3.0:
                    return True
    except Exception:
        pass
    return False


def _norm_dong_key(d):
    s = re.sub(r"\s+", "", str(d or "").strip())
    s = re.sub(r"^제(?=\d)", "", s)
    return s


def match_ledger_dong(dong_name, ledger_dict):
    """Exact and numeric-token-safe dong matcher ('1동' never matches '101동')."""
    if not ledger_dict or not dong_name:
        return None
    if dong_name in ledger_dict:
        return ledger_dict[dong_name]
    norm_target = _norm_dong_key(dong_name)
    for k, v in ledger_dict.items():
        if _norm_dong_key(k) == norm_target:
            return v
    m_num = re.match(r"^(\d+)동?$", norm_target)
    if m_num:
        num_str = m_num.group(1)
        for k, v in ledger_dict.items():
            kn = _norm_dong_key(k)
            km = re.match(r"^(\d+)동?$", kn)
            if km and km.group(1) == num_str:
                return v
    return None


def load_target_complexes(month_dir, filter_codes=None, filter_sido=None, filter_sigungu=None):
    files = [
        f
        for f in sorted(os.listdir(month_dir))
        if f.endswith(".json") and not f.startswith("1000000000") and not f.startswith("summary")
    ]
    code_set = set(str(c) for c in filter_codes) if filter_codes else None
    complexes = {}

    for fname in files:
        if filter_sido and filter_sido != "all" and not fname.startswith(filter_sido):
            continue
        if filter_sigungu and not fname.startswith(filter_sigungu):
            continue
        fpath = os.path.join(month_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as fp:
                d = json.load(fp)
            for it in d.get("data", []):
                code = str(it.get("검색코드") or it.get("searchCode") or "")
                if not code or code in complexes:
                    continue
                if code_set and code not in code_set:
                    continue
                addr = it.get("법정동주소") or ""
                x = float(it.get("X") or 0)
                y = float(it.get("Y") or 0)
                if x == 0 or y == 0:
                    continue
                m = re.search(r"(\d+)(?:-(\d+))?$", addr.strip())
                bun = f"{int(m.group(1)):04d}" if m else "0000"
                ji = f"{int(m.group(2)):04d}" if m and m.group(2) else "0000"
                complexes[code] = {
                    "code": code,
                    "name": it.get("아파트명") or "",
                    "addr": addr,
                    "x": x,
                    "y": y,
                    "sido": fname[:2],
                    "sigungu_code": fname[:5],
                    "bun": bun,
                    "ji": ji,
                    "households": it.get("세대수") or 0,
                }
        except Exception as e:
            print(f"[WARN] Failed reading {fname}: {e}")
    return complexes


def scan_ledgers(complex_list, pyoje_path=DEFAULT_PYOJE_PATH, jeonyu_path=DEFAULT_JEONYU_PATH):
    """Scan Pyoje (표제부) & Jeonyu (전유부) once for target complexes."""
    target_parcels = {}
    for c in complex_list:
        pk = (c["sigungu_code"], c["bun"], c["ji"])
        stem = norm_bjdong_stem(extract_dong_from_addr(c.get("addr", "")))
        target_parcels.setdefault(pk, set())
        if stem:
            target_parcels[pk].add(stem)

    print(f"[Ledger] Indexing Pyoje/Jeonyu for {len(target_parcels):,} target parcels...")
    pyoje_data = {}
    t0 = time.time()
    if os.path.exists(pyoje_path):
        with open(pyoje_path, "r", encoding="utf-8", errors="ignore") as fp:
            for line in fp:
                parts = line.strip().split("|")
                if len(parts) <= 60:
                    continue
                sigungu, bun, ji = parts[8], parts[11], parts[12]
                pk = (sigungu, bun, ji)
                if pk not in target_parcels:
                    continue
                row_stem = norm_bjdong_stem(extract_dong_from_addr(parts[5]))
                exp_stems = target_parcels[pk]
                if exp_stems and row_stem and row_stem not in exp_stems:
                    continue
                key = (sigungu, row_stem if exp_stems else "", bun, ji)
                bjdong = parts[9].strip()
                pnu_type = "1" if parts[10].strip() in ("0", "") else "2"
                pnu = f"{sigungu}{bjdong}{pnu_type}{bun}{ji}"

                bld_name = parts[7].strip()
                dong = parts[22].strip() or bld_name
                main_sub = parts[24].strip()
                use_cd = parts[34].strip()
                use_nm = parts[35].strip()
                use_etc = parts[36].strip()

                entry = pyoje_data.setdefault(key, {"dongs": {}, "pnu_set": set(), "bld_names": set()})
                if len(pnu) == 19:
                    entry["pnu_set"].add(pnu)
                if bld_name:
                    entry["bld_names"].add(bld_name)

                def _int(v, d=0):
                    try:
                        return int(v) if v else d
                    except Exception:
                        return d

                def _flt(v, d=0.0):
                    try:
                        return float(v) if v else d
                    except Exception:
                        return d

                hh = _int(parts[37])
                height = _flt(parts[42])
                grnd_flr = _int(parts[43])
                ugrnd_flr = _int(parts[44])
                elev_pass = _int(parts[45])
                elev_emerg = _int(parts[46])
                park_self = _int(parts[54])

                is_res = (
                    main_sub == "주건축물"
                    and (use_cd == "02000" or "공동주택" in use_nm or "아파트" in use_etc)
                    and (not is_aux_name(dong))
                    and (hh > 0 or grnd_flr >= 3)
                )

                entry["dongs"][dong] = {
                    "bld_name": bld_name,
                    "dong": dong,
                    "height": height,
                    "grnd_flr": grnd_flr,
                    "ugrnd_flr": ugrnd_flr,
                    "elev_pass": elev_pass,
                    "elev_emerg": elev_emerg,
                    "park_self": park_self,
                    "struct": parts[32].strip(),
                    "use_apr": parts[60].strip(),
                    "hh": hh,
                    "is_res": is_res,
                }
        print(f"[Ledger] Pyoje indexed in {time.time() - t0:.2f}s ({len(pyoje_data):,} parcels)")
    else:
        print(f"[WARN] Pyoje file not found: {pyoje_path}")

    jeonyu_data = {}
    t0 = time.time()
    if os.path.exists(jeonyu_path):
        with open(jeonyu_path, "r", encoding="utf-8", errors="ignore") as fp:
            for line in fp:
                parts = line.strip().split("|")
                if len(parts) <= 25:
                    continue
                sigungu, bun, ji = parts[8], parts[11], parts[12]
                pk = (sigungu, bun, ji)
                if pk not in target_parcels:
                    continue
                row_stem = norm_bjdong_stem(extract_dong_from_addr(parts[5]))
                exp_stems = target_parcels[pk]
                if exp_stems and row_stem and row_stem not in exp_stems:
                    continue
                key = (sigungu, row_stem if exp_stems else "", bun, ji)
                dong = parts[21].strip()
                ho = parts[22].strip()
                try:
                    flr = int(parts[25]) if parts[25] else 1
                except Exception:
                    flr = 1

                p_map = jeonyu_data.setdefault(key, {})
                d_info = p_map.setdefault(
                    dong, {"line_floors": {}, "units": [], "min_floor": 999, "max_floor": 0}
                )
                m_line = re.search(r"(\d{1,2})$", ho)
                line_no = f"{int(m_line.group(1)):02d}" if m_line else "01"
                lf = d_info["line_floors"].setdefault(line_no, {"floorMin": flr, "floorMax": flr, "count": 0})
                lf["floorMin"] = min(lf["floorMin"], flr)
                lf["floorMax"] = max(lf["floorMax"], flr)
                lf["count"] += 1
                d_info["min_floor"] = min(d_info["min_floor"], flr)
                d_info["max_floor"] = max(d_info["max_floor"], flr)
                if len(d_info["units"]) < 100:
                    d_info["units"].append({"unit": ho, "floor": flr, "line": line_no})
        print(f"[Ledger] Jeonyu indexed in {time.time() - t0:.2f}s ({len(jeonyu_data):,} parcels)")
    else:
        print(f"[WARN] Jeonyu file not found: {jeonyu_path}")

    return pyoje_data, jeonyu_data


def _fetch_json(url, retries=3):
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
    params = {
        "service": "data",
        "request": "GetFeature",
        "data": "LT_C_SPBD",
        "key": key,
        "domain": domain,
        "geomFilter": f"POINT({lng} {lat})",
        "buffer": str(buffer_m),
        "geometry": "true",
        "format": "json",
        "size": "1000",
    }
    url = f"https://api.vworld.kr/req/data?{urllib.parse.urlencode(params)}"
    data = _fetch_json(url)
    resp = data.get("response", {})
    status = resp.get("status")
    if status == "NOT_FOUND":
        return []
    if status != "OK":
        err = resp.get("error", {})
        raise RuntimeError(f"VWorld Error ({err.get('code', '')}): {err.get('text', 'Unknown')}")
    return resp.get("result", {}).get("featureCollection", {}).get("features", [])


def query_vworld_features(lat, lng, buffer_m=340, key=VWORLD_API_KEY, domain=VWORLD_DOMAIN):
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


def _ring_to_5186(ring):
    return [TRANSFORMER_TO_5186.transform(pt[0], pt[1]) for pt in ring if len(pt) >= 2]


def _geojson_to_5186(geom):
    if not geom:
        return None
    gt = geom.get("type")
    coords = geom.get("coordinates") or []
    try:
        if gt == "Polygon":
            if not coords or len(coords[0]) < 3:
                return None
            p = Polygon(_ring_to_5186(coords[0]), [_ring_to_5186(h) for h in coords[1:] if len(h) >= 3])
            return p if p.is_valid else p.buffer(0)
        elif gt == "MultiPolygon":
            polys = []
            for pc in coords:
                if not pc or len(pc[0]) < 3:
                    continue
                p = Polygon(_ring_to_5186(pc[0]), [_ring_to_5186(h) for h in pc[1:] if len(h) >= 3])
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


def _geom_to_wgs84_rings(geom):
    rings = []
    poly = geom if geom.geom_type == "Polygon" else (max(geom.geoms, key=lambda a: a.area) if geom.geom_type == "MultiPolygon" else None)
    if poly is None:
        return rings
    rings.append([list(TRANSFORMER_TO_4326.transform(x, y)) for x, y in poly.exterior.coords])
    for interior in poly.interiors:
        rings.append([list(TRANSFORMER_TO_4326.transform(x, y)) for x, y in interior.coords])
    return rings


def build_complex_from_vworld(cpx, pyoje_data, jeonyu_data, key=VWORLD_API_KEY, domain=VWORLD_DOMAIN):
    """Build 3D complex JSON purely from VWorld LT_C_SPBD + Pyoje + Jeonyu."""
    cx, cy = TRANSFORMER_TO_5186.transform(cpx["x"], cpx["y"])
    try:
        hh_total = int(str(cpx.get("households") or 0).replace(",", "").strip())
    except Exception:
        hh_total = 0
    buf = 550 if hh_total >= 1500 else (420 if hh_total >= 500 else 340)

    raw_features = query_vworld_features(cpx["y"], cpx["x"], buffer_m=buf, key=key, domain=domain)
    if not raw_features:
        return None, "No features in VWorld"

    rows = []
    for f in raw_features:
        geom = _geojson_to_5186(f.get("geometry"))
        if geom is None or geom.is_empty:
            continue
        pr = f.get("properties") or {}
        bd_mgt_sn = str(pr.get("bd_mgt_sn") or "").strip()
        pnu = bd_mgt_sn[:19] if len(bd_mgt_sn) >= 19 else ""
        a5 = ""
        if len(pnu) == 19:
            try:
                b_i, j_i = int(pnu[11:15]), int(pnu[15:19])
                a5 = f"{b_i}-{j_i}" if j_i > 0 else str(b_i)
            except Exception:
                a5 = str(pr.get("buld_no") or "").strip()
        bld_nm = str(pr.get("buld_nm") or "").strip()
        bld_dc = str(pr.get("buld_nm_dc") or "").strip()
        try:
            flr = int(pr.get("gro_flo_co") or 0)
        except Exception:
            flr = 0
        a9 = "단독주택" if ("단독" in bld_nm or "단독" in bld_dc) else ("공동주택" if bld_nm else "")
        rows.append({
            "a2": pnu,
            "a4": str(pr.get("gu") or "").strip(),
            "a5": a5,
            "a9": a9,
            "a24": bld_nm,
            "a25": bld_dc,
            "flr": flr,
            "geom": geom,
        })

    if not rows:
        return None, "No valid VWorld polygons"

    addr_dong = extract_dong_from_addr(cpx.get("addr", ""))
    dong_stem = norm_bjdong_stem(addr_dong)
    parcel_key = (cpx["sigungu_code"], dong_stem, cpx["bun"], cpx["ji"])
    if parcel_key not in pyoje_data and (cpx["sigungu_code"], "", cpx["bun"], cpx["ji"]) in pyoje_data:
        parcel_key = (cpx["sigungu_code"], "", cpx["bun"], cpx["ji"])

    pyoje_bundle = pyoje_data.get(parcel_key, {})
    cpx_pyoje = pyoje_bundle.get("dongs", {})
    pnu_set = pyoje_bundle.get("pnu_set", set())
    pyoje_bld_names = pyoje_bundle.get("bld_names", set())
    cpx_jeonyu = jeonyu_data.get(parcel_key, {})
    pyoje_res_dongs = {k: v for k, v in cpx_pyoje.items() if v.get("is_res")}

    bun_int = int(cpx["bun"]) if cpx["bun"].isdigit() else 0
    ji_int = int(cpx["ji"]) if cpx["ji"].isdigit() else 0
    bun_ji_str = f"{bun_int}-{ji_int}" if ji_int > 0 else str(bun_int)

    selected = []
    selected_idx = set()
    assigned_pyoje = set()

    # Stage 1: Exact PNU / Lot Match
    for idx, r in enumerate(rows):
        geom = r["geom"]
        if is_needle_or_sliver(geom):
            continue
        in_pnu = (r["a2"] in pnu_set) if pnu_set else False
        in_parcel = bool(addr_dong and addr_dong in r["a4"] and r["a5"] == bun_ji_str)
        if not (in_pnu or in_parcel):
            continue
        if r["a9"] == "단독주택" and pyoje_res_dongs and r["a25"] not in cpx_pyoje:
            continue
        if r["a24"] and not is_strict_name_match(cpx["name"], pyoje_bld_names, r["a24"]):
            if not (r["a25"] and match_ledger_dong(r["a25"], cpx_pyoje)):
                continue
        if not r["a24"] and not r["a25"] and geom.area < 65.0:
            continue
        selected.append((idx, r, None))
        selected_idx.add(idx)

    # Stage 2: Strict Complex Name Match + Pyoje Cross-Check
    c_danji, _, _, _ = _extract_unit_tags(cpx["name"])
    pyoje_has_numbered = any(re.search(r"\d+동?$", _norm_dong_key(k)) for k in pyoje_res_dongs)
    for idx, r in enumerate(rows):
        if idx in selected_idx:
            continue
        geom = r["geom"]
        if is_needle_or_sliver(geom) or r["a9"] == "단독주택":
            continue
        if not is_strict_name_match(cpx["name"], pyoje_bld_names, r["a24"]):
            continue
        if pyoje_res_dongs:
            gc = geom.centroid
            dist_m = math.hypot(gc.x - cx, gc.y - cy)
            strong_nm = is_strong_full_name_match(cpx["name"], pyoje_bld_names, r["a24"])
            if r["a25"] and not is_aux_name(r["a25"]):
                if match_ledger_dong(r["a25"], cpx_pyoje) is None:
                    if not (not pyoje_has_numbered and strong_nm and dist_m <= 180.0):
                        continue
            else:
                if match_ledger_dong(r["a25"], cpx_pyoje) is None:
                    a5_bun = re.split(r"\D+", r["a5"])[0] if r["a5"] else ""
                    same_bun = (bun_int > 0 and a5_bun == str(bun_int))
                    if not (same_bun or (strong_nm and dist_m <= 220.0)):
                        continue
                    a_danji, _, _, _ = _extract_unit_tags(f"{r['a24']} {r['a25']}")
                    if c_danji and (not a_danji or not (c_danji & a_danji)):
                        if not (strong_nm and dist_m <= 220.0):
                            continue
        selected.append((idx, r, None))
        selected_idx.add(idx)

    # Stage 2.5: Nearby Parcel-Cluster Dong-Set Rescue (when Stage 1 + 2 found 0 non-aux residential-scale polygons)
    has_res_cand_so_far = any(
        (not is_aux_name(r["a25"])) and (r["geom"].area >= 120.0 or r["flr"] >= 3)
        for _, r, _ in selected
    )
    if (not has_res_cand_so_far) and pyoje_res_dongs:
        clusters = {}
        c_sig = str(cpx.get("sigungu_code") or "")
        search_r = 220.0 if hh_total >= 500 else 160.0
        for idx, r in enumerate(rows):
            if idx in selected_idx or is_needle_or_sliver(r["geom"]) or r["a9"] == "단독주택":
                continue
            if c_sig and len(r["a2"]) >= 5 and r["a2"][:5] != c_sig:
                continue
            gc = r["geom"].centroid
            dist_m = math.hypot(gc.x - cx, gc.y - cy)
            if dist_m > search_r:
                continue
            pk = r["a2"][:19] if len(r["a2"]) >= 19 else r["a5"]
            if not pk:
                continue
            cl = clusters.setdefault(pk, {"rows": [], "matched": set(), "unmatched_num": set(), "bad_name": False, "name_ok": False, "min_dist": 9999.0})
            cl["rows"].append((idx, r))
            cl["min_dist"] = min(cl["min_dist"], dist_m)
            if r["a24"]:
                if is_strict_name_match(cpx["name"], pyoje_bld_names, r["a24"]):
                    cl["name_ok"] = True
                elif r["flr"] >= 3 and not is_aux_name(r["a25"]):
                    cl["bad_name"] = True
            dn = r["a25"]
            if dn and "," not in dn and not is_aux_name(dn):
                pm = match_ledger_dong(dn, pyoje_res_dongs)
                if pm:
                    cl["matched"].add(pm["dong"])
                elif match_ledger_dong(dn, cpx_pyoje) is None and re.match(r"^(?:제?\d+|[A-Za-z])동?$", _norm_dong_key(dn)):
                    cl["unmatched_num"].add(_norm_dong_key(dn))

        qualifying = []
        for pk, cl in clusters.items():
            if cl["bad_name"]:
                continue
            m_cnt = len(cl["matched"])
            u_cnt = len(cl["unmatched_num"])
            md = cl["min_dist"]
            ok = (
                (m_cnt >= 2 and u_cnt == 0 and md <= 130.0)
                or (m_cnt >= 3 and u_cnt <= 1 and m_cnt >= u_cnt * 2 and md <= 130.0)
                or (len(pyoje_res_dongs) == 1 and m_cnt == 1 and u_cnt == 0 and md <= 75.0)
                or (cl["name_ok"] and u_cnt == 0 and md <= 100.0)
            )
            if ok:
                qualifying.append((m_cnt, -md, pk, cl))
        if qualifying:
            qualifying.sort(reverse=True)
            chosen_pks = [qualifying[0][3]]
            for m_cnt, neg_md, pk, cl in qualifying[1:]:
                if cl["name_ok"] or (cl["matched"] and len(cl["unmatched_num"]) == 0 and (-neg_md) <= 100.0):
                    chosen_pks.append(cl)
            for cl in chosen_pks:
                for idx, r in cl["rows"]:
                    if idx not in selected_idx:
                        selected.append((idx, r, None))
                        selected_idx.add(idx)

    for _, r, fd in selected:
        dn = fd or r["a25"]
        if not dn:
            m_d = re.search(r"(\d+동)", r["a24"])
            dn = m_d.group(1) if m_d else ""
        pm = match_ledger_dong(dn, pyoje_res_dongs)
        if pm:
            assigned_pyoje.add(pm["dong"])

    missing_res = [v for k, v in pyoje_res_dongs.items() if k not in assigned_pyoje]

    # Clean unlabeled Stage 1 rows
    unlabeled_s1 = []
    cleaned = []
    for idx, r, fd in selected:
        if not r["a24"] and not r["a25"] and fd is None:
            unlabeled_s1.append((idx, r))
        else:
            cleaned.append((idx, r, fd))

    unlabeled_s1.sort(key=lambda item: -item[1]["geom"].area)
    kept_unlabeled = []
    for idx, r in unlabeled_s1:
        if missing_res and r["geom"].area >= 150.0 and (r["a9"] in ("", "공동주택", "아파트") or r["flr"] >= 3):
            tp = missing_res.pop(0)
            kept_unlabeled.append((idx, r, tp["dong"]))
            assigned_pyoje.add(tp["dong"])
        elif r["flr"] >= 1 and r["a9"] not in ("", "공동주택", "아파트") and r["geom"].area >= 65.0:
            kept_unlabeled.append((idx, r, None))
        else:
            selected_idx.discard(idx)
    selected = cleaned + kept_unlabeled

    # Stage 3: Orphan Polygon Rescue (unlabeled polygons near matched hull)
    if missing_res and selected:
        xs_c = [r["geom"].centroid.x for _, r, _ in selected]
        ys_c = [r["geom"].centroid.y for _, r, _ in selected]
        min_bx, max_bx = min(xs_c) - 90.0, max(xs_c) + 90.0
        min_by, max_by = min(ys_c) - 90.0, max(ys_c) + 90.0
        mid_x, mid_y = sum(xs_c) / len(xs_c), sum(ys_c) / len(ys_c)

        orphans = []
        for idx, r in enumerate(rows):
            if idx in selected_idx or is_needle_or_sliver(r["geom"]) or r["geom"].area < 200.0:
                continue
            if r["a24"] or r["a25"] or r["a9"] not in ("", "공동주택", "아파트"):
                continue
            gc = r["geom"].centroid
            if min_bx <= gc.x <= max_bx and min_by <= gc.y <= max_by:
                orphans.append((math.hypot(gc.x - mid_x, gc.y - mid_y), -r["geom"].area, idx, r))
        orphans.sort()
        for _, _, idx, r in orphans:
            if not missing_res:
                break
            tp = missing_res.pop(0)
            selected.append((idx, r, tp["dong"]))
            selected_idx.add(idx)
            assigned_pyoje.add(tp["dong"])

    if not selected:
        return None, "Matched 0 target buildings"

    buildings = []
    total_hh = 0
    total_elev_p = 0
    total_elev_e = 0
    total_park = 0
    max_h = 0.0
    structs = set()
    aprs = set()
    res_cnt = 0

    for idx, r, fd in selected:
        geom = r["geom"]
        if is_needle_or_sliver(geom):
            continue
        dong_name = fd or r["a25"]
        if not dong_name:
            m_d = re.search(r"(\d+동)", r["a24"])
            dong_name = m_d.group(1) if m_d else f"동_{len(buildings)+1}"

        rings = _geom_to_wgs84_rings(geom)
        if not rings:
            continue

        p_dong = match_ledger_dong(dong_name, cpx_pyoje)
        j_dong = match_ledger_dong(dong_name, cpx_jeonyu)
        flr = r["flr"]
        height = 0.0

        if p_dong:
            if p_dong["height"] > 0:
                height = p_dong["height"]
            if p_dong["grnd_flr"] > 0:
                flr = p_dong["grnd_flr"]
            if p_dong["struct"]:
                structs.add(p_dong["struct"])
            if p_dong["use_apr"]:
                aprs.add(p_dong["use_apr"])
            total_elev_p += p_dong["elev_pass"]
            total_elev_e += p_dong["elev_emerg"]
            total_park += p_dong["park_self"]
        elif flr <= 0 and "지하주차" in dong_name:
            continue

        if height <= 0:
            height = max(flr * 3.0, 9.0) if flr > 0 else 15.0
        if flr <= 0:
            flr = max(int(height / 3.0), 3)

        minx, miny, maxx, maxy = geom.bounds
        is_small_aux = (geom.area < 65.0 or min(maxx - minx, maxy - miny) < 6.5)

        lines = []
        piloti = False
        is_res = (not is_aux_name(dong_name)) and (not is_small_aux) and (flr >= 3 or (p_dong is not None and p_dong.get("is_res", False) and flr >= 2))
        if is_small_aux and flr > 2:
            flr = 2
            height = min(height, 6.0)
            is_res = False
        elif j_dong and not is_small_aux:
            for l_no, ld in sorted(j_dong["line_floors"].items()):
                lines.append({
                    "line": l_no,
                    "floorMin": ld["floorMin"],
                    "floorMax": ld["floorMax"],
                    "count": ld["count"],
                })
            piloti = (j_dong["min_floor"] > 1)

        if is_res:
            res_cnt += 1
        max_h = max(max_h, height)

        bld_hh = sum(l["count"] for l in lines) if lines else (p_dong["hh"] if p_dong else 0)
        total_hh += bld_hh
        buildings.append({
            "id": f"bd_{cpx['code']}_{len(buildings)+1}",
            "dong": dong_name,
            "name": f"{cpx['name']} {dong_name}",
            "usage": "공동주택" if is_res else "부속시설",
            "residential": is_res,
            "households": bld_hh,
            "floors": flr,
            "floorsBelow": p_dong["ugrnd_flr"] if p_dong else 1,
            "heightM": round(height, 2),
            "approvalDate": p_dong["use_apr"] if p_dong else "",
            "piloti": piloti,
            "lines": lines,
            "units": j_dong["units"] if (j_dong and not is_small_aux) else [],
            "hardware": {
                "elevPass": p_dong["elev_pass"] if p_dong else 0,
                "elevEmerg": p_dong["elev_emerg"] if p_dong else 0,
                "parkSelf": p_dong["park_self"] if p_dong else 0,
                "structure": p_dong["struct"] if p_dong else "철근콘크리트구조",
            },
            "rings": rings,
            "kind": "primary",
            "selectable": is_res,
            "label": dong_name,
        })

    if len(pyoje_res_dongs) >= 2 and res_cnt == 0:
        return None, f"Safety abort: Pyoje expects {len(pyoje_res_dongs)} res dongs, matched 0"

    # Stage 5: Neighbors within 220m (max 80)
    nbr_cands = []
    for idx, r in enumerate(rows):
        if idx in selected_idx or r["geom"].area < 80.0:
            continue
        dist = math.hypot(r["geom"].centroid.x - cx, r["geom"].centroid.y - cy)
        if dist <= 220.0:
            nbr_cands.append((dist, idx, r))
    nbr_cands.sort(key=lambda x: x[0])

    neighbors = []
    for _, _, r in nbr_cands[:80]:
        rings = _geom_to_wgs84_rings(r["geom"])
        if not rings:
            continue
        nf = max(1, r["flr"] if r["flr"] > 0 else 3)
        neighbors.append({
            "id": f"nb_{cpx['code']}_{len(neighbors)+1}",
            "dong": r["a25"] or r["a24"],
            "floors": nf,
            "heightM": round(nf * 3.0, 2),
            "rings": rings,
            "kind": "neighbor",
            "selectable": False,
        })

    result = {
        "searchCode": str(cpx["code"]),
        "name": cpx["name"],
        "lawAddr": cpx["addr"],
        "center": {"lat": float(cpx["y"]), "lng": float(cpx["x"])},
        "specs": {
            "totalDongCount": res_cnt or len(buildings),
            "totalHouseholds": total_hh or cpx["households"],
            "maxHeightM": round(max_h, 2),
            "maxFloors": max((b["floors"] for b in buildings), default=0),
            "avgFloorHeightM": round(max_h / max((b["floors"] for b in buildings), default=1), 2),
            "structure": next(iter(structs), "철근콘크리트구조"),
            "useApprovalDate": next(iter(aprs), ""),
            "parking": {
                "totalSelf": total_park,
                "perHousehold": round(total_park / (total_hh or 1), 2) if total_park > 0 else None,
            },
            "elevators": {
                "passenger": total_elev_p,
                "emergency": total_elev_e,
                "householdsPerElevator": round(total_hh / total_elev_p, 1) if total_elev_p > 0 else None,
            },
        },
        "buildings": buildings,
        "neighbors": neighbors,
        "floorBands": [5, 10, 15, 20, 25, 30],
        "coverage": {
            "primaryCount": len(buildings),
            "residentialCount": res_cnt,
            "steppedCount": sum(1 for b in buildings if len(b["lines"]) > 1),
        },
        "source": "vworld_ledger_pure_v2",
    }
    return result, f"OK ({len(buildings)} blds, {res_cnt} res, {len(neighbors)} nbrs)"


def main():
    parser = argparse.ArgumentParser(description="Pure VWorld API + Pyoje/Jeonyu 3D Builder (No SHP required)")
    parser.add_argument("--code", nargs="*", help="Target complex searchCode(s), e.g. 8289 109379")
    parser.add_argument("--sido", default=None, help="Filter by 2-digit sido code (e.g. 11, 41)")
    parser.add_argument("--sigungu", default=None, help="Filter by 5-digit sigungu code (e.g. 11680)")
    parser.add_argument("--batch", action="store_true", help="Build all matching complexes in month folder")
    parser.add_argument("--month", default=os.path.join(REPO_ROOT, "202611"), help="Complex master JSON directory")
    parser.add_argument("--pyoje", default=DEFAULT_PYOJE_PATH, help="Path to mart_djy_03.txt")
    parser.add_argument("--jeonyu", default=DEFAULT_JEONYU_PATH, help="Path to mart_djy_09.txt")
    parser.add_argument("--key", default=VWORLD_API_KEY, help="VWorld API Key")
    parser.add_argument("--domain", default=VWORLD_DOMAIN, help="VWorld registered domain")
    parser.add_argument("--out-dir", default=DEFAULT_OUTPUT_DIR, help="Primary output directory")
    parser.add_argument("--mirror-dir", default=DEFAULT_MIRROR_DIR, help="Optional secondary mirror directory (pass '' to disable)")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent VWorld API threads")
    parser.add_argument("--limit", type=int, default=None, help="Max complexes to process")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing output files")
    args = parser.parse_args()

    if not args.code and not args.sido and not args.sigungu and not args.batch:
        parser.print_help()
        return

    cpx_map = load_target_complexes(
        args.month,
        filter_codes=args.code,
        filter_sido=args.sido,
        filter_sigungu=args.sigungu,
    )
    targets = list(cpx_map.values())
    if args.limit:
        targets = targets[: args.limit]
    if not targets:
        print("No target complexes matched filters.")
        return

    mirror_dir = None if (not args.mirror_dir or args.mirror_dir.lower() == "none") else args.mirror_dir
    os.makedirs(args.out_dir, exist_ok=True)
    if mirror_dir:
        os.makedirs(mirror_dir, exist_ok=True)

    OFFICIAL_V2_MARKERS = ('"korea_gis_ledger_fused_v2"', '"vworld_ledger_fused_v2"', '"vworld_ledger_pure_v2"')
    todo = []
    skipped = 0
    for c in targets:
        out_f = os.path.join(args.out_dir, f"{c['code']}.json")
        if not args.overwrite and os.path.exists(out_f) and os.path.getsize(out_f) > 1000:
            try:
                with open(out_f, "r", encoding="utf-8") as fp:
                    txt = fp.read()
                if any(m in txt for m in OFFICIAL_V2_MARKERS):
                    skipped += 1
                    continue
            except Exception:
                pass
        todo.append(c)

    if not todo:
        print(f"All {skipped} target complexes already exist (use --overwrite to rebuild).")
        return

    pyoje_data, jeonyu_data = scan_ledgers(todo, pyoje_path=args.pyoje, jeonyu_path=args.jeonyu)

    succ, fail = 0, 0
    t0 = time.time()

    def _run_one(c):
        time.sleep(0.05)
        try:
            return c, *build_complex_from_vworld(c, pyoje_data, jeonyu_data, key=args.key, domain=args.domain)
        except Exception as e:
            return c, None, str(e)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(_run_one, c) for c in todo]
        for i, fut in enumerate(as_completed(futs), 1):
            c, data, msg = fut.result()
            if data:
                txt = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
                with open(os.path.join(args.out_dir, f"{c['code']}.json"), "w", encoding="utf-8") as fp:
                    fp.write(txt)
                if mirror_dir:
                    with open(os.path.join(mirror_dir, f"{c['code']}.json"), "w", encoding="utf-8") as fp:
                        fp.write(txt)
                succ += 1
            else:
                fail += 1
            print(f"[{i}/{len(todo)}] {c['code']} {c['name']} -> {msg}", flush=True)

    print(f"Done in {time.time() - t0:.1f}s: Success={succ}, Skipped={skipped}, Failed={fail}")


if __name__ == "__main__":
    main()
