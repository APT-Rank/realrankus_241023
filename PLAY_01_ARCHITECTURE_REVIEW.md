# PLAY_01_ARCHITECTURE_REVIEW.md

## 1. Architecture Compatibility

기존 RealRankus와 PLAY_01_ARCHITECTURE 간의 호환성은 전반적으로 **양호**합니다.
*   **인증(Auth) 공유**: Firebase Authentication을 이미 사용 중이므로, PLAY 사용자와 기존 서비스 사용자를 동일한 계정 체계로 관리하는 데 기술적 제약이 없습니다.
*   **데이터 분리 및 재사용**: 기존 부동산 마스터 데이터(JSON/CSV 파일 또는 Firestore)를 PLAY의 읽기 전용 기초 데이터로 활용하고, PLAY 전용 컬렉션(`PLAY_*`)을 신설하여 쓰기 권한을 분리하는 구조는 NoSQL(Firestore/Realtime DB) 특성상 유연하게 적용 가능합니다.
*   **하이브리드 아키텍처 모델**: 기존 프론트엔드 중심의 서비스(BaaS)를 그대로 유지하면서, PLAY의 핵심 로직만 별도 서버(API 또는 Cloud Functions)로 분리하는 모델은 기존 시스템을 훼손하지 않는 가장 안전한 접근법입니다.

## 2. Existing Code Conflicts

현재 코드베이스와 PLAY_01 아키텍처 간의 충돌 가능성:
*   **비즈니스 로직 위치의 불일치**: 기존 시스템(`weight_cal.js`, `simulation.js` 등)은 경제 시뮬레이션 및 점수 산출 로직을 프론트엔드 클라이언트에 두고 있습니다. PLAY_01 원칙(Server-Side Authority)에 따라 이 로직들을 서버로 옮겨야 할 경우, (1) 기존 코드를 Node.js 환경에 맞게 마이그레이션(포팅)하거나 (2) 클라이언트/서버에 로직이 중복으로 존재하게 되는 구조적 충돌(또는 유지보수 비용 증가)이 발생할 수 있습니다.
*   **글로벌 상태 관리 충돌**: 현재 바닐라 JS 기반으로 전역 변수(jQuery DOM 상태, 쿠키 등)에 의존하고 있어, PLAY의 복잡한 상태(Player State, Market State) 관리 시 기존 스크립트(`app_main.js` 등)와 변수명 충돌이나 사이드 이펙트가 우려됩니다.

## 3. Technical Constraints

구현 상의 제약 사항:
*   **프론트엔드 빌드 환경 부재**: 현재 `index.html`에서 CDN과 직접 스크립트 임포트 방식으로 프론트엔드를 구성하고 있습니다. PLAY 모듈을 위해 React/Vue 같은 모던 프레임워크를 도입하려면, 기존 프로젝트에 Webpack/Vite 등의 빌드 파이프라인을 구축해야 하는 제약이 있습니다. (이를 우회하기 위해 PLAY 프론트엔드를 `/play` 디렉토리 하위의 독립된 SPA 프로젝트로 분리 구성하는 방식이 필요할 수 있습니다.)
*   **DB 트랜잭션 제약**: Firebase Firestore나 Realtime Database를 사용할 경우, 여러 도큐먼트나 컬렉션 간의 복잡한 경제 엔진 트랜잭션(예: 플레이어 자산 차감 + 부동산 소유권 이전 + 시장 매물 감소 등 동시 처리)을 완벽한 ACID 트랜잭션으로 처리하는 데 NoSQL 특성상의 제약(트랜잭션 크기 제한, 동시성 처리 등)이 존재할 수 있습니다.

## 4. Unknowns

아직 확인되거나 확정되지 않은 사항:
*   **기존 데이터 수집 스크립트 실행 주기 및 인프라**: `PIR_BuyingPower.py` 등의 파이썬 스크립트가 어디서, 어떤 주기로 실행되어 프론트엔드에 데이터를 공급하는지 명확하지 않습니다. (PLAY의 경제 환경 동기화에 중요)
*   **트래픽 및 연산량(Scale)**: Economic Engine과 Season Time 업데이트가 어떤 주기(예: 매시간, 매일)로 동작할지, 동시에 시뮬레이션을 수행해야 할 플레이어 수 규모에 대한 정보가 없습니다. (서버 스펙 결정에 필수)

## 5. Security Concerns

*   **Firebase Security Rules 전면 개편 필요**: 기존 RealRankus가 클라이언트에서 직접 데이터를 조작하는 BaaS 모델이므로, PLAY 관련 컬렉션(`PLAY_PLAYER_STATE`, `PLAY_DECISION_LOG` 등)이 추가될 때 클라이언트에서 쓰기가 불가능하도록(Read-Only 또는 No-Access) Security Rules를 매우 엄격하게 분리 적용해야 합니다.
*   **클라이언트 위/변조 방지**: 사용자가 클라이언트 상에서 임의의 의사결정 로그(Decision Log)나 자산 갱신 API를 호출하는 어뷰징(Abusing)을 차단하기 위한 멱등성 보장 및 세션/시즌 검증 토큰 등 서버단의 방어 로직이 필수입니다.

## 6. Deployment Concerns

*   **서버 인프라 도입 및 배포 파이프라인**: 기존의 단순 정적 호스팅(Firebase Hosting 추정)에서 벗어나, 백엔드 로직이 실행될 환경(Firebase Cloud Functions, AWS EC2/Lambda 등)을 위한 CI/CD 배포 파이프라인 신설이 필요합니다.
*   **Firebase Billing Plan**: Cloud Functions를 사용하려면 Firebase 프로젝트가 Blaze 요금제(Pay-as-you-go)로 설정되어 있어야 합니다.

## 7. Recommended Technical Decisions

향후 설계를 위한 권장 기술적 방향:
*   **Backend 분리 모델 권장**: "Firebase Cloud Functions(TypeScript/Node.js)" 도입을 권장합니다. 기존 Firebase 생태계 및 인증 시스템과 가장 매끄럽게 통합되며, 초기 MVP의 인프라 관리 부담을 줄일 수 있습니다. (기존 JS 로직 재사용도 상대적으로 용이)
*   **PLAY 프론트엔드 완전 분리**: 기존 `index.html`과 섞이지 않도록, `play.realrankus.com`과 같은 서브도메인을 사용하거나 별도 모듈(`/play`)로 묶어 독립적인 번들링 환경을 구축할 것을 강력히 권장합니다.
*   **이벤트 기반 로깅 아키텍처**: Decision Log와 Transaction은 DB 트리거(예: Firestore OnWrite)나 Pub/Sub 구조를 통해 비동기적으로 Season Analysis에 적재되도록 분리 설계하여 게임 엔진 성능에 영향을 주지 않게 해야 합니다.

## 8. Questions Requiring Product/Business Decisions

구현 전 기획/제품 관점에서 확정해야 할 질문들:
1.  **시즌(Season)의 동기화 여부**: 모든 사용자가 전역적으로 같은 시간대(글로벌 타임라인)를 공유하며 플레이하는지, 아니면 사용자 개인별 독립적인 시뮬레이션 타임라인을 갖는지? (서버 트랜잭션과 엔진 구동 방식에 결정적 영향)
2.  **데이터 분석 목적에 따른 게임 규칙 통제**: 특정 가설 검증(예: "GLI 정보를 숨기면 사용자의 매수 결정이 달라지는가?")을 위해 A/B 테스트 환경을 구축한다면, 게임 내 정보 접근 권한(Feature Flag) 관리 정책이 미리 정의되어야 합니다.
3.  **오프라인 진행(Background Simulation) 허용**: 사용자가 접속하지 않은 상태에서도 Season Time이 흐르며 강제로 생활비가 차감되고 경제가 변동하는 구조인지?
4.  **시뮬레이션 주기의 현실 시간 맵핑**: `1 real day ≈ 4 simulated months`가 기준일 때, 서버 스케줄러가 매일 자정에 일괄로 4개월치 시뮬레이션을 돌리는 방식(Batch)인지, 아니면 실시간으로 점진적으로 시간이 흐르는 방식(Tick)인지?
