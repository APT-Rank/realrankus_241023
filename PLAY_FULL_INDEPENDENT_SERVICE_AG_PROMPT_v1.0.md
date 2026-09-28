# PLAY 완전 독립 서비스 구조화 — AG 작업 지시서 v1.0

**작업 유형:** 구조 분리 / 구현 / 회귀 검증  
**작업 단계:** IA-03 이전 필수 기반 작업  
**IA-03 구현:** 금지 — 독립화 완료 및 별도 승인 전 시작하지 않는다.  
**기준 저장소:** `D:\APT-Rank_Git`  
**기준 진입 URL:** `http://127.0.0.1:5500/play/`  
**최종 목표:** PLAY를 독립 진입·독립 프런트엔드·명확한 데이터/백엔드 경계를 가진 서비스 영역으로 만들고, 기존 RealRankers는 PLAY 진입 링크만 제공하게 한다.

---

## 0. 작업 전 필수 사항

먼저 다음 문서를 읽고 현재 작업 트리의 지침과 충돌 여부를 확인한다.

1. `PLAY_INDEPENDENT_SERVICE_ARCHITECTURE_SPEC_v1.0.md`
2. `PLAY-IA-02_IMPLEMENTATION_REPORT.md`
3. `PLAY_IA_02_COMPLEX_TO_LISTING_SPEC_v1.0.md`
4. `PLAY_INFORMATION_ARCHITECTURE_SPEC_v1.0.md`
5. `PLAY_HUMAN_UX_PRINCIPLES_v1.0.md`
6. `PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1_HANDOFF.md`
7. PLAY Architecture, Engine, Property Market, Research Logging 관련 최신 보고서
8. `firebase.json`, `.gitignore`, `CNAME`, `_config.yml`, `functions/package.json`, `functions/src/index.ts`

### 작업 트리 보호

- 첫 단계에서 `git status --short`를 기록한다.
- 기존 수정·미추적 파일을 사용자 작업으로 간주한다. 덮어쓰기, 초기화, 정리, 삭제하지 않는다.
- 특히 현재 변경된 `index.html`, `.gitignore`와 미추적 PLAY 문서, `play.html`, `js/play_app.js`, `play/`, `functions/`를 보존한다.
- `git reset`, `git clean`, 대량 포맷, 무관 파일 정리, 기존 작업을 되돌리는 명령은 금지한다.
- 보호 파일은 변경 전후 해시/상태를 비교해 작업 범위 밖의 변경이 없음을 보고한다.

## 1. 현재 발견된 기준 상태

이 내용은 사전 점검에서 확인한 시작점이다. 구현 전에 다시 확인하고, 달라졌으면 실제 상태를 우선한다.

- `play/index.html`이 `/play/` 진입 HTML이다.
- PLAY 전용 파일은 `play/css/play.css`, `play/js/play_app.js`, `play/data/suji_properties.json`에 있다.
- `play/index.html`은 PLAY 전용 CSS·JS·데이터를 상대경로로 불러온다. Naver Maps, jQuery, Bootstrap, Font Awesome, 폰트는 외부 CDN/API 의존성이다.
- 커스텀 PLAY CSS는 `.play-app` 범위로 작성되어 있으나 외부 Bootstrap 등 공용 라이브러리도 로드한다.
- 루트 `play.html`은 구형 구현을 포함한다. `js/play_app.js`와 `play/js/play_app.js`는 점검 시 파일 해시가 같았다. 삭제 전에 모든 참조와 사용자 작업 여부를 확인해야 한다.
- RealRankers 루트 `index.html`에는 `./play/index.html`로 이동하는 `PLAY 시작` 링크 변경이 있다. 기존 변경을 보존하고, 마지막에 이 링크가 하나의 PLAY 진입점만 가리키는지 확인한다.
- `firebase.json`에는 Functions와 Firestore 설정이 있지만 Hosting 설정은 없다. 루트의 `CNAME`과 `_config.yml` 등 기존 정적 사이트 배포 구조를 먼저 확인한다. Firebase Hosting으로 임의 전환하지 않는다.
- 검증된 Functions는 단일 `functions` 코드베이스 아래 `functions/src/play/`에 이름공간별로 있다. `functions/src/index.ts`가 이 함수들을 기존 코드베이스에서 export한다.
- PLAY 정적 데이터는 총 209건이며 NORMAL 200건, INCOMPLETE 9건이다. 데이터 의미·정책·순서를 임의로 바꾸지 않는다.

## 2. 권한과 범위

이 지시서는 PLAY 서비스 구조화 작업을 허가한다. 단, 아래의 명시적 보호 경계 및 중단 조건이 우선한다.

### 수정 허용 범위

- `/play/` 아래 PLAY 전용 프런트엔드 파일과 PLAY 전용 설정/문서
- 사용처를 확인한 뒤의 PLAY 전용 중복 파일 정리 또는 호환 진입 처리
- 기존 RealRankers 루트에는 PLAY 진입 링크 하나만 필요한 최소 범위에서 유지·수정
- 독립화 결과 보고서와 필요한 경계 문서

### 절대 보호 영역 — 수정·이동·복제·이름 변경·재배포 금지

```text
app_main_lang.js
기존 RealRankers CSS / JS / 화면 / URL / Firebase 로직
firestore.rules 및 Security Rules
PLAY Economic Engine
PLAY Property Market Engine
PLAY Transaction Engine
Season Clock
Batch / Aggregator
Reconciliation
Research Logging 저장·durability 인프라
검증된 Cloud Function의 공개 이름, 리전, 호출 계약, 배포 식별자
```

보호 영역과의 의존성·충돌이 발견되면 우회 구현하지 말고 그 지점에서 멈춰 보고한다.

## 3. 독립성의 정의와 목표 구조

완료 기준은 PLAY 프런트엔드가 RealRankers의 전역 자산이나 애플리케이션 런타임에 의존하지 않고 직접 `/play/`에서 실행되며, backend는 PLAY 도메인 경계를 유지하면서 검증된 배포 계약을 보존하는 것이다.

```text
RealRankers repository
├─ 기존 RealRankers 앱
│  ├─ index.html
│  ├─ app_main_lang.js
│  ├─ 기존 css/ 및 js/
│  └─ 기존 Firebase/Functions 설정
│
└─ play/
   ├─ index.html                 # canonical PLAY entry
   ├─ css/                       # PLAY 전용, namespace 적용
   ├─ js/                        # PLAY 전용 런타임
   ├─ data/                      # 승인된 읽기 전용 스냅샷/클라이언트 데이터
   ├─ assets/                    # PLAY 전용 이미지·아이콘(필요한 경우)
   ├─ config/                    # PLAY 전용 공개 설정(필요한 경우)
   └─ README.md                  # 경로·배포·경계·의존성

functions/                       # 기존 배포 루트 유지
└─ src/play/                     # 검증된 PLAY backend 이름공간 유지
```

`play/functions/`를 무조건 만들어 기존 함수를 옮기거나 복사하지 않는다. 프런트엔드와 backend가 서로 다른 독립성 단계임을 문서화한다. 검증된 backend를 별도 배포 코드베이스로 물리 분리해야만 목표를 충족할 수 있다고 판단되는 경우, 구체적인 호출/배포 위험과 호환 계획을 작성하고 **그 이동·이름 변경·재배포 전에는 중단하여 Product Owner 승인을 받는다.**

독립성은 엔진 재작성이나 코드 복제를 뜻하지 않는다. PLAY는 기존 검증된 Engine 경계를 API/데이터 계약으로 소비해야 하며, Engine 내부를 수정하지 않는다.

## 4. 조사 및 사전 보고 — 코드 변경 전에 완료

다음 보고를 먼저 AG에게 보여준다. 안전한 구현 경로와 영향 파일이 명확하면 보고 후 구현을 계속한다. 충돌이 있으면 중단한다.

```text
# PLAY FULL INDEPENDENCE AUDIT
## Baseline Working Tree and User Changes
## Canonical and Legacy Entry Points
## PLAY Frontend File/Dependency Graph
## CSS and JavaScript Isolation Findings
## Data Source and 209/200/9 Integrity
## Firebase Function Names, Exports, Imports, and Deployment Codebase
## Hosting, Domain, and /play/ Routing
## Existing RealRankers Entry Link
## Duplicate Files and Reference Search
## Protected Files and Hashes
## Migration Plan and Rollback Points
## Risks / Conflicts / Stop Conditions
## Recommendation
```

확인할 사항:

- 저장소 전체에서 `play.html`, `js/play_app.js`, `/play/`, `play/index.html`의 참조 검색
- PLAY 페이지가 `app_main_lang.js`, 기존 RealRankers CSS·JS·DOM 전역에 의존하는지 확인
- PLAY가 읽는 모든 로컬 리소스 경로를 확인하고 `/play/` 기준으로 직접 접근 가능한지 확인
- CDN/API 의존성과 필요한 공개 key 설정의 주입 위치를 목록화한다. 비밀값이나 service account key를 클라이언트에 넣지 않는다.
- Firebase Functions 전체 export 이름, `src/play` import graph, 리전, 호출 방식 및 package/build 구성을 읽기 전용으로 확인한다. 실제 production 배포/계정 상태를 추측하지 않는다.
- 데이터 스냅샷과 Firebase source of truth 관계를 확인하고 클라이언트 데이터가 임의 생성/수정되지 않았는지 확인한다.
- root `CNAME`, `_config.yml`, 현재 승인 로컬 주소 `http://127.0.0.1:5500/`의 운영 방식과 `/play/` 정적 경로 호환성을 확인한다.

## 5. 구현 지시

### 5.1 단일 canonical entry

- `play/index.html`을 유일한 실제 PLAY 화면 entry로 지정한다.
- RealRankers에서 진입할 때도 `/play/` 또는 동등한 canonical 경로 하나만 사용한다.
- 루트 `play.html`은 참조 검색과 동작 확인 후 호환 redirect로 바꾸거나, 이미 운영 참조가 있으면 유지하며 그 이유를 기록한다.
- 구형 진입점을 삭제하지 않는다. 삭제가 안전하고 필요한 경우에도 변경 전후 참조 증거와 되돌리기 방법을 보고한다.

### 5.2 HTML 및 자산 경계

- PLAY HTML이 기존 RealRankers CSS·JS·`app_main_lang.js`를 가져오지 않게 한다.
- PLAY 로컬 CSS·JS·데이터·이미지는 `/play/` 아래로 모으고 명시적 상대경로를 사용한다.
- `../`로 루트 RealRankers 자산을 참조하는 것을 금지한다. 공용 자산이 꼭 필요하면 외부 공개 라이브러리인지, 제품 코드인지 구분하여 사유와 대안을 기록한다.
- 외부 라이브러리를 임의로 복사하거나 버전을 바꾸지 않는다. 라이선스·키·CORS·인증 문제를 발견하면 기록한다.
- 실제로 쓰이지 않는 `assets/` 등 빈 디렉터리를 형식상 만들지 않는다. 필요한 자산만 둔다.

### 5.3 CSS 경계

- PLAY 전용 스타일은 `/play/css/` 아래에 둔다.
- 커스텀 selector는 `.play-app` 등 PLAY root namespace 아래에 둔다.
- RealRankers 전역 스타일을 PLAY 때문에 수정하지 않는다.
- Bootstrap 등 라이브러리의 전역 영향이 PLAY 밖으로 새지 않는지 점검한다. 기존 화면에 CSS를 주입하지 않는다.

### 5.4 JavaScript 경계

- PLAY 브라우저 런타임은 `/play/js/`만 canonical source로 사용한다.
- `window` 전역을 불필요하게 오염시키거나 RealRankers 함수·DOM ID·전역 상태와 충돌하지 않게 한다.
- 기존 중복 `js/play_app.js`는 사용처 확인 없이 삭제·덮어쓰지 않는다. 다른 소비자가 있으면 호환성을 유지하고, 소비자가 없으면 legacy 경로 처리 계획과 근거를 보고한다.
- IA-01/IA-02 흐름, 필터·정렬, 뒤로가기, 한글 UI 및 Research Logging Hook을 유지한다.
- IA-03, BUY/SELL 거래 로직, 화면 재디자인은 이 작업에 포함하지 않는다.

### 5.5 데이터 경계

- 승인된 수지구 데이터 209/200/9를 보존한다.
- `INCOMPLETE` 매물을 매매 가능한 것으로 표시하지 않는다.
- 사용자/Engine 상태를 정적 JSON에 추가하거나, 정적 property snapshot을 source of truth로 승격하지 않는다.
- 클라이언트가 쓰기 권한이 필요한 경우 기존 Security Rules 변경으로 해결하지 말고 중단하여 보고한다.

### 5.6 Backend / Functions 경계

- 기존 `functions/src/play/`가 PLAY backend의 논리적 소유 경계인지, root `functions/src/index.ts`가 유지해야 할 기존 export facade인지 기록한다.
- 검증된 함수의 본문, export 이름, region, callable/request schema, Auth/App Check, idempotency, collection schema, secrets, IAM, deployment target을 변경하지 않는다.
- `firebase.json`, rules, indexes, package/build를 변경해야 한다면 변경 이유와 영향 범위를 먼저 제시한다. Functions 이동이나 별도 codebase 배포, 삭제·이름 변경은 별도 승인 전 금지한다.
- backend 코드 복사본을 만들어 독립된 것처럼 보이게 하지 않는다.
- PLAY UI가 현재 prototype 단계에서 JSON snapshot만 쓰는지, 검증된 backend를 호출하는 기능이 있는지 구분하고 근거를 남긴다.

### 5.7 Hosting / RealRankers 연결

- 현재 정적 Hosting이 GitHub Pages인지 다른 방식인지 실제 설정·기록으로 확인한다.
- Firebase Hosting으로 임의 전환하거나 `firebase.json`에 새 배포 대상을 추가하지 않는다.
- 기존 RealRankers에서는 PLAY 진입 링크만 둔다. 기존 화면·URL·초기화 코드 구조를 리팩터링하지 않는다.
- canonical `/play/` 직접 접근과 root에서의 진입이 동일한 PLAY 화면으로 도착해야 한다.

## 6. 필수 회귀 확인 및 증거

작업 통제 문서의 2-Strike STOP 원칙을 따른다. 같은 검증은 최대 2회다. 실패 후 수정은 직접 원인에 대한 최소 1회만 허용한다. 2차 실패 시 즉시 멈춘다. 테스트를 우회하거나 assertion을 완화해 PASS를 만들지 않는다.

모든 확인은 현재 승인된 origin을 사용한다. Naver Maps 인증이 성공하는 기준 주소는 `http://127.0.0.1:5500/`이며, 이전 임시 포트에서 난 지도 인증 실패를 앱 오류로 오판하지 않는다.

필수 확인:

1. `/play/` 직접 접근 및 정적 자산 로딩
2. RealRankers 루트 접근 및 PLAY 링크 진입
3. 기존 RealRankers 기본 화면 Smoke 확인
4. PLAY 화면의 커스텀 CSS가 기존 페이지에 영향을 주지 않는지 확인
5. PLAY JS가 RealRankers JS와 별도 실행되는지 확인
6. WORLD → REGION → COMPLEX → LISTING → LISTING DETAIL 및 Back 흐름
7. 가격/면적 정렬과 incomplete 표시 정책
8. 데이터 209 / NORMAL 200 / INCOMPLETE 9
9. 한글 UI와 Research Logging Hook 보존
10. Desktop 60:40, Mobile 지도 위/패널 아래 레이아웃
11. 보호된 엔진·Rules·Function export·기존 deployment config 변경 없음
12. 각 검증의 Expected / Actual / Evidence와 실행 URL·뷰포트

검증을 실행하지 못한 항목은 PASS라고 하지 말고 `NOT RUN` 또는 `EVIDENCE INCOMPLETE`로 표기한다. 실제 Function 재배포는 검증 범위에 포함하지 않는다.

## 7. 중단 조건

아래 중 하나면 그 변경을 중지하고 원본 상태/증거/원인/영향을 보고한다. 승인 없이 우회하지 않는다.

- RealRankers의 기존 화면·스크립트·스타일·URL이 바뀌거나 깨질 위험
- 기존 파일 사용처나 ownership이 불분명
- 검증된 Cloud Function, public export, deployment name, Security Rules 또는 Firestore schema 변경이 필요
- Engine/Research Logging 경계를 건드려야만 분리가 가능한 경우
- `/play/` 정적 경로가 현재 호스팅과 맞지 않아 DNS/Hosting 전환이 필요한 경우
- 민감한 credential/key를 새로 노출하거나 기존 위치를 클라이언트로 옮겨야 하는 경우
- 회귀 테스트 2회 실패 또는 raw evidence 누락
- 변경 중 사용자가 소유한 untracked/modified 파일을 덮어써야 하는 경우

## 8. 최종 보고서

`PLAY_FULL_INDEPENDENT_SERVICE_IMPLEMENTATION_REPORT.md`를 작성하고 다음 항목을 채운다.

```text
# PLAY FULL INDEPENDENT SERVICE IMPLEMENTATION REPORT
## 1. Initial Working Tree (preserved changes)
## 2. Before/After Structure
## 3. Canonical Entry and Legacy Routes
## 4. HTML / CSS / JS Isolation
## 5. Data Source and 209/200/9 Evidence
## 6. Firebase Functions Boundary and Deployment Contract
## 7. Hosting / Routing
## 8. RealRankers Entry Link
## 9. IA-01/IA-02 Regression Evidence
## 10. Desktop/Mobile Evidence
## 11. Existing RealRankers Smoke Evidence
## 12. Protected Areas and Before/After Hashes
## 13. Files Changed (with reason)
## 14. Files Intentionally Not Moved/Deleted
## 15. Issues / NOT RUN / Risks
## 16. Final Verdict: READY / READY AFTER FIXES / STOP — HUMAN REVIEW REQUIRED
```

완료 판정은 파일 경로가 분리된 것만으로 내리지 않는다. `/play/` 실행, 기존 서비스 회귀, 엔진 경계 보존을 증거로 확인해야 한다. 결과가 준비되면 IA-03 구현은 시작하지 말고 별도 제품 승인 대기 상태로 마친다.

---

## AG 실행 지시

위 문서 범위에 따라 먼저 감사 결과를 제시한 다음, 안전한 프런트엔드 독립화를 완료하고 회귀 증거와 구현 보고서를 작성하라. 기존 RealRankers 서비스와 검증된 PLAY Engine 경계를 보존하라. 이 작업에서는 IA-03을 구현하지 않는다.
