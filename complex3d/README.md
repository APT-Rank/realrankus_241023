# 🏙️ 리얼랭커스 FLY 3D (RealRankus FLY 3D)

리얼랭커스(RealRankus)의 전국 아파트 단지 3D 입체 건물 모형 탐색, 계단식 동·호수별 세대 분할, 세대별 창밖 조망(POV) 시뮬레이션, 실시간 태양 일조 & 그림자 궤적 분석, 주변 1km 주요 인프라 레이어를 제공하는 완전 독립형 3D 공간 분석 패키지입니다.

---

## 📁 디렉토리 구조

```
d:\APT-Rank_Git\complex3d\
├── index.html               # 3D 메인 웹 뷰어 (모바일 반응형 바텀시트 & 데스크톱 HUD 완비)
├── README.md                # 3D 시스템 아키텍처 및 파이프라인 가이드
├── js/
│   ├── complex_3d_view.js   # Three.js 3D 렌더링, 태양 물리 궤적, 세대별 POV 엔진
│   ├── three.min.js         # Three.js r128 코어 엔진
│   ├── OrbitControls.js     # 부드러운 궤도 카메라 및 관성 댐핑 컨트롤러
│   └── regions_map.js       # 전국 시군구 행정코드 매핑 테이블
├── assets/
│   └── images/              # 신카이 마코토 풍 가상 조경 모듈러 지반 및 4K 스카이돔 텍스처
├── data/
│   └── 3d/                  # 오프라인/로컬 샘플 3D 단지 GeoJSON 데이터 (8289, 111515 등)
└── scripts/                 # 3D 지오메트리 빌드 & Cloudflare R2 CDN 동기화 파이프라인
    ├── build_complex_3d.py
    ├── build_complex_3d_jiblab.py
    ├── build_complex_3d_vworld.py
    ├── sync_3d_to_r2.py
    ├── prepare_virtual_ground.py
    ├── generate_9tile_modular_ground.py
    ├── generate_shinkai_skydome.py
    └── verify_unit_slicing_and_pov.py
```

---

## 🚀 실행 및 연동 방법

### 1. 웹 브라우저에서 직접 실행
웹 서버(예: Live Server, Python HTTP 서버 등)를 통해 파라미터와 함께 호출합니다:
```bash
# 복합단지 3D 폴더 또는 프로젝트 루트에서 서버 실행
python -m http.server 5500
```
- 접속 URL: `http://localhost:5500/complex3d/?code=8289&region=4146310200`
- 파라미터 안내:
  - `code` (필수): 단지 고유 검색 코드 (예: `8289` 한라신영프로방스, `111515` 헬리오시티)
  - `region` (선택): 법정 시군구코드 (주변 인프라 레이어 렌더링용)
  - `embedded=1` (선택): 모바일 풀스크린 모달 내부 임베딩 모드

### 2. 메인 앱(`index.html`) 연동
- **모바일 환경**: 메인 화면의 `#baseModal` 위로 `#complex3dModal` 풀스크린 iframe이 슬라이드 인되며, 닫힐 때 `about:blank`를 할당하여 GPU VRAM을 100% 즉시 물리 회수합니다.
- **데스크톱 환경**: `window.open('./complex3d/index.html?code=...', '_blank')`로 광활한 와이드 뷰포트로 실행됩니다.

---

## 🎮 주요 핵심 기능

1. **계단식 동 & 호수(Unit)별 입체 세대 분할**:
   - 동일 동 내 라인별 층수 차이(예: 1~2라인 25층, 3~4라인 20층)를 실측 건축물 대장 기반으로 정밀 분할 압출.
   - 남향 정면 기준 좌측 끝 1호부터 우측 끝 4호까지 수학적 PCA 주성분 분석으로 일괄 정렬.
2. **세대별 창밖 조망 (Inward / Outward POV 모드)**:
   - 원하는 층과 호수를 터치하면 실제 발코니 창가 시점으로 순간 이동.
   - 창문 프레임 및 2배 확대된 선명한 태양 궤도 아이콘을 통해 계절별 조망 및 일조를 실감 나게 확인.
3. **주변 1km 입지 인프라 3D 시각화**:
   - 반경 250m(도보 3분), 500m(도보 7분), 1km(도보 15분) 거리 링 및 주변 학교, 학원가, 지하철역, 대형마트 3D 핀 마커.
4. **호갱노노/직방형 모바일 반응형 바텀시트**:
   - 모바일 접속 시 화면 85% 이상을 3D 그래픽에 온전히 할당하는 슬림 바텀시트(`Collapsed`).
   - `[상세설정 ⚙️]` 터치 시 계절, 카메라 프리셋, 지반 배경을 조절할 수 있는 확장 드로어(`Expanded`) 제공.
5. **감성 3D 로딩 오버레이 & 꿀팁 티커**:
   - 데이터 로드 및 지오메트리 빌드 동안 네온 프로그레스 바와 함께 주요 조작 꿀팁이 2.5초마다 순환.
