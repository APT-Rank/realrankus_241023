# PLAY_TOP_NAV_LIVE_TIME_SLIP_DATA_SPEC_v1.0

- Status: READY FOR IMPLEMENTATION
- Test Region: 경기도 용인시 수지구
- Active Participants: HERO 1 + AI 10 = 11명
- Simulation: 360 simulated months = 30 simulated years
- Source of Truth: PLAY backend / Firestore authoritative state

## 1. 목적

상단 메뉴 전체를 실제 Time-Slip 경제세계와 연결한다.

Time-Slip 실행 경로는 다음과 같다.

Season Clock → Economic Engine / AI Actions → Firestore → Central Live State → 모든 상단 메뉴

모든 화면은 동일한 season_id, simulation_period, region_scope, participant_state를 사용해야 한다.

## 2. 절대 원칙

- 테스트 Season에서는 강남구 mock/static data를 사용하지 않는다.
- 현재 테스트 지역은 경기도 용인시 수지구다.
- 모든 화면은 하나의 Central Live State를 관찰한다.
- UI는 경제적 권위자가 아니며 authoritative backend state를 표시한다.
- 화면별 독립적인 경제 상태나 임의의 mock ranking/participant data를 만들지 않는다.

## 3. 테스트 지역

현재 Season:
- province: 경기도
- city: 용인시
- district: 수지구
- region_scope: 경기도 용인시 수지구

향후 지역 변경을 위해 지역은 하드코딩하지 않고 active_region_scope 또는 Season configuration으로 관리한다.

## 4. 지도보기

기존 강남구 대신 수지구를 표시한다.

레이아웃은 기존의 [왼쪽 지도] + [오른쪽 Context Panel]을 유지한다.

오른쪽 패널은 실시간으로 다음을 표시할 수 있어야 한다.
- 현재 Period
- 수지구 시장 상태
- 가격 변화
- 거래 건수
- BUY / SELL 활동
- 신규 Listing
- 최근 체결
- Watch 활동
- 참가자 활동
- 주요 Complex 변화
- 현재 경제환경

지도상의 Complex/Property 상태도 거래와 상태 변화에 따라 Live State에서 갱신한다.

전체 재조회보다 변경 데이터 중심의 targeted listener / incremental update를 우선한다.

## 5. 지역탐색

강남구가 아니라 현재 테스트 중인 수지구를 사용한다.

Time-Slip 진행에 따라 다음을 실시간 갱신한다.
- 현재 Period
- 지역 경제상태
- 가격 변화
- 거래량
- BUY / SELL
- 주요 Complex
- 최근 거래
- 활동 참가자
- 시장 변화 이벤트

Region → Complex → Listing → Decision 흐름을 유지한다.

## 6. 내 자산

브라우저의 관찰 Participant는 HERO다.

내 자산은 authoritative PLAY_PLAYER_ASSET / Player State를 사용한다.

실시간 표시:
- 현금
- Locked Cash
- 부채
- 보유 부동산
- 보유 자산 수
- 순자산
- 경제적 자유 관련 지표
- 최근 BUY / SELL
- 최근 자산 변화
- 현재 Period

거래 발생 시 새로고침 없이 갱신한다.

### HERO 자율행동

HERO는 단순 UI dummy가 아니라 실제 Participant다.

HERO도 AI와 동일한 경제 규칙을 적용받으며 자율적으로:
- EXPLORE
- COMPARE
- WATCH
- HOLD
- BUY
- SELL

할 수 있어야 한다.

HERO에 특별한 현금, 정보, 가격, 우선권, 성공률 등의 hidden advantage를 주지 않는다.

HERO의 행동은:
경제상태 관찰 → Decision → Action → Validation → Transaction/Rejection → Outcome
의 동일한 경로를 사용한다.

## 7. 다른 참가자

현재 테스트 Season에는 총 11명이 표시되어야 한다.

- HERO 1명
- AI 10명

실시간 표시:
- Participant
- Participant Type
- 현재 Period
- 현금
- 부동산 보유 수
- 부채
- 순자산
- 최근 행동
- 최근 거래
- 현재 활동 상태
- 마지막 행동 시점

Live Activity 역시 11명의 실제 행동을 표시한다.

Activity Feed는 관찰용이며 경제 상태의 권위는 authoritative Player State / Transaction에 있다.

## 8. 시즌랭킹

HERO + AI 10명, 총 11명을 실시간 표시한다.

최소 항목:
- 순위
- Participant
- 자산
- 부채
- 순자산
- 경제적 자유 지표
- 거래/행동 수
- 현재 Period

Ranking은 승인된 Season ranking metric만 사용한다. 확정되지 않은 지표를 임의로 추가하지 않는다.

## 9. HERO 일관성

동일 시점에서 다음 값이 일치해야 한다.

내 자산의 HERO 상태
=
다른 참가자의 HERO 상태
=
시즌랭킹의 HERO 상태

HERO는 Participant 목록에서도 동일한 하나의 Participant다.

## 10. Central Live State

구조:

Firestore
→ Live State Manager
→ Home / 지도보기 / 지역탐색 / 내 자산 / 다른 참가자 / 시즌랭킹

모든 화면은 동일한:
- season_id
- simulation_period
- active_region_scope
- economic state
- participant state
- transaction state
를 참조한다.

모든 화면의 Period는 동일해야 한다.

## 11. Transaction 전파

예를 들어 HERO BUY 발생 시:

내 자산
→ 현금 감소 / 부동산 증가

지도
→ 해당 Complex 상태 변경

지역탐색
→ 거래 활동 증가

다른 참가자
→ HERO 활동 표시

시즌랭킹
→ HERO 상태 변경

이 결과가 동일한 authoritative transaction/state를 기준으로 전파되어야 한다.

## 12. Listener 정책

각 화면이 중복 listener를 생성하지 않도록 Central Live State Manager를 사용한다.

필수:
- listener 1회 등록
- navigation 전환 시 중복 listener 방지
- unsubscribe 관리
- reconnect 시 재구독
- Season 변경 시 이전 listener 제거
- ON/OFF 전환으로 transaction 중복 생성 금지

## 13. Time-Slip

ON:
- simulation period
- RUN
- PAUSE
- STEP
- STOP
- speed
- Live Activity
- AI/HERO observation

OFF:
- Test Mode control UI 숨김
- Season/HERO/Participant/Firestore state 삭제 또는 초기화 금지

RUN:
Season Clock = RUNNING → Economic Batch → AI/HERO Decision → State Update → Live State → 모든 화면 갱신

STEP:
정확히 1 simulated month만 진행한다.

## 14. Reconnect

브라우저 refresh/network reconnect 후에도 authoritative state에서 다음을 복원한다.
- Season
- Period
- HERO
- 10 AI
- Region
- Property
- Ranking
- Activity

중복 Activity/listener가 발생하지 않는다.

## 15. 데이터 소스

경제:
- PLAY Economic State

참가자:
- PLAY_PLAYER
- PLAY_PLAYER_ASSET
- Player State

부동산:
- PLAY_PROPERTY_MASTER
- PLAY_PROPERTY_STATE
- PLAY_PROPERTY_OWNERSHIP

Primary:
- PLAY_PRIMARY_SUPPLY

Secondary:
- PLAY_SECONDARY_LISTING
- PLAY_PROPERTY_TRANSACTION

행동:
- PLAY_DECISION_LOG
- Research Events

Season:
- PLAY_SEASON
- PLAY_SEASON_CLOCK
- Batch / Clock state

## 16. Human Viewer와 HERO

브라우저 사용자는 HERO를 관찰하지만 HERO 자체는 실제 Participant다.

따라서 브라우저 사용자가 아무 행동을 하지 않아도 HERO AI는 autonomous policy에 따라 행동할 수 있어야 한다.

브라우저 관찰 자체가 HERO에게 경제적 advantage를 주어서는 안 된다.

## 17. Acceptance Gate

NAV-01 Time-Slip ON에서 현재 지역이 수지구다.

NAV-02 지도보기 오른쪽 패널이 수지구 Live State를 표시한다.

NAV-03 지역탐색이 수지구 Live State를 표시한다.

NAV-04 STEP마다 지도/지역 데이터가 갱신된다.

NAV-05 HERO가 실제 Participant로 존재한다.

NAV-06 HERO가 AI와 동일한 규칙으로 자율행동한다.

NAV-07 내 자산이 HERO authoritative state와 일치한다.

NAV-08 다른 참가자에 HERO + AI 10 = 11명이 표시된다.

NAV-09 참가자 Activity가 실시간 갱신된다.

NAV-10 시즌랭킹에 HERO + AI 10이 표시된다.

NAV-11 Ranking 값이 authoritative participant state와 일치한다.

NAV-12 하나의 BUY/SELL 결과가 관련 화면에 전파된다.

NAV-13 모든 화면의 simulation_period가 동일하다.

NAV-14 RUN/PAUSE/STEP/STOP이 일관되게 동작한다.

NAV-15 reconnect 후 상태가 복원된다.

NAV-16 listener 중복이 없다.

NAV-17 테스트 Season에서 mock 강남구 데이터가 표시되지 않는다.

NAV-18 P360 종료 시 11명의 최종 상태가 모든 화면에서 동일하게 조회된다.

## 18. 구현 순서

1. Central Live State 확인/정리
2. Active Region을 수지구로 연결
3. 지도보기 Live binding
4. 지역탐색 Live binding
5. HERO autonomous participant 연결
6. 내 자산 Live binding
7. 다른 참가자 11명 Live binding
8. 시즌랭킹 11명 Live binding
9. listener / reconnect / duplicate listener 검증
10. Browser Time-Slip E2E
11. 10 AI + HERO = 11 participant / 360 period 실행

## 19. Non-Scope

변경하지 않는다.
- Economic Engine 핵심 로직
- IA-03C BUY transaction
- IA-04D secondary transaction
- Supply Policy FIXED_ONE
- Security Rules
- Idempotency
- Research Logging
- Property Master
- transaction atomicity
- 100P simulation

## 20. 최종 경험

TIME-SLIP ON
→ 수지구 경제세계가 움직임
→ 11명의 참가자가 행동
→ HERO도 AI로 행동
→ 거래 발생
→ 자산 변화
→ 지도/지역 변화
→ 참가자 활동 변화
→ 시즌랭킹 변화
→ 새로운 의사결정

상단 메뉴는 독립 페이지가 아니라 하나의 Living Economic World를 서로 다른 관점에서 관찰하는 View가 된다.

## Final Gate

다음 항목 모두 PASS 후에만 10 AI + HERO / 360 Period 실제 실행을 시작한다.

- 수지구 Live Data
- Central Live State
- HERO autonomous activity
- 11 Participant Live View
- Live Ranking
- RUN / PAUSE / STEP / STOP
- Reconnect
- No duplicate listener
- No mock data
- Browser E2E PASS

최종 판정:
READY FOR 11-PARTICIPANT / 360-PERIOD TIME-SLIP SIMULATION
