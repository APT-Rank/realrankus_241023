# PLAY_03.2_PROPERTY_MARKET_DESIGN_FINAL_REVIEW.md

지시하신 `PLAY_03.2_PROPERTY_MARKET_DESIGN_FINAL.md`에 대한 Review 결과를 아래와 같이 정리했습니다. 이번 검토에서는 코드 구현을 수행하지 않으며, 설계의 논리적 일관성과 기술적 정합성을 중점적으로 분석했습니다.

---

## A. Overall Assessment
*   Primary Market과 Secondary Market을 분리한 아이디어는 이전 리뷰에서 지적된 **초기 유동성 고갈(Cold Start) 문제를 매우 우아하게 해결**합니다. 
*   가상 NPC나 Market Maker를 배제하려는 철학을 지키면서도, 모든 플레이어가 7억 원의 현금으로 시장에 진입할 수 있는 완벽한 통로가 확보되었습니다.
*   전반적인 설계(Quantity=1 고정, 락킹 메커니즘, 부채 추상화)가 부동산 시장의 현실적 특성을 시스템적으로 매우 잘 추상화하고 있으며, 기술적 구현에 무리가 없습니다.

## B. Architecture Compatibility
*   **완벽히 호환됩니다.** Firebase Cloud Functions 중심의 Server Authority 구조는 기존 RealRankus의 프론트엔드 중심 구조와 독립적으로 구동될 수 있어 상호 간섭(Side-effect)이 없습니다.

## C. Primary / Secondary Market
*   **논리적 타당성**: 분리 구조가 타당하며 완벽히 작동합니다. Primary Market은 신규 분양(Initial Public Offering)과 같은 역할을 하므로, 시장 참여자들로 하여금 시스템과 NPC를 혼동하지 않게 만듭니다.
*   **전환 과정**: Primary Market에서 구매가 체결되는 즉시 플레이어에게 Ownership이 부여되고, 이후 이 주택을 팔 때는 자연스럽게 Secondary Market의 SELL Order로 등록되므로 프로세스 간 단절이나 모순이 없습니다.

## D. Data Model
*   **Quantity=1 및 Partial Fill 제거**: 부동산의 비대체성(Non-fungible)과 가장 잘 부합하는 완벽한 결정입니다. 부분 체결을 제거함으로써 스마트 컨트랙트(계약) 및 권리(Ownership) 상태 관리가 기하급수적으로 단순해지고 무결성이 보장됩니다.
*   **locked_cash / locked_property**: 이중 지출(Double Spend) 및 이중 매도(Double Sell)를 원천 차단하는 가장 표준적이고 강력한 모델입니다.

## E. Order Book / Matching
*   **가격 우선 + 시간 우선 + 먼저 들어온 주문 가격**: 주식 시장의 단일가 매매 및 연속 복수 가격 매매에서 사용되는 가장 안정적인 매칭 룰이며, Firestore Transaction 환경에서도 논리적 오류 없이 구현 가능합니다.

## F. Sale Market
*   현금 7억 원으로 시작하는 유저들이 Primary Market에서 초기 물량을 확보하고, 이후 시세 차익이나 주거 이동을 위해 Secondary Market에 매도하게 되는 흐름이 매우 자연스럽습니다.

## G. Jeonse Market
*   **Penalty Loan 구조**: 현실의 지루한 소송과 경매 절차를 과감하게 생략하고, 임대인에게 강제로 '징벌적 부채'를 안기는 방식은 훌륭한 게임적 추상화입니다. `PLAY_02`의 Debt Engine(이자 비용 발생 및 Cash 차감)과도 완벽하게 연동됩니다.

## H. Monthly Rent Market
*   **Grace Period 및 강제퇴거 구조**: Economic Engine의 Cash Buffer와 매끄럽게 연동됩니다. 현금이 마이너스로 떨어지지 않게 보증금을 깎아나가다가, 퇴거시키는 방식은 시스템의 장부 무결성 유지에 매우 좋습니다.

## I. Player State / Cash Flow
*   **음수 Cash 금지와 Forced Sale**: '마이너스 통장'을 시스템적으로 허용하지 않고, 이를 Debt(부채)나 강제 매각(Forced Sale)으로 즉시 변환하는 것은 데이터의 정합성을 지키고 Economic Engine의 처리 로직을 통일시키는 데 크게 기여합니다.

## J. Security
*   **Server Authority**: 클라이언트의 조작을 전면 배제하고 오직 Order Intent(주문 의도)만 서버로 전송하는 구조는 금융 시뮬레이션의 보안 요구사항을 충족합니다.

## K. Concurrency
*   **Firestore Transaction / Optimistic Lock**: Order Book 매칭 시 다중 동시 접근을 제어하기 위해 필수적이며, 제시된 설계 방향이 정확합니다.

## L. Performance / Cost
*   **Firestore와 BigQuery 역할 분리**: State(현재 상태)는 Firestore에 두고 History(과거 이력)는 BigQuery로 넘기는 구조는 Firebase의 높은 Write/Read 비용을 방어하는 최적의 아키텍처입니다.

## M. Forecast Data
*   Primary Market 초기 거래량 데이터를 분석 대상에서 분리하고, 실제 유저 간의 Secondary Market 거래만을 가격 모델링(VWAP 등)에 사용하기로 한 점은 **예측 모델의 오염을 방지하는 최고의 설계적 결정**입니다.
*   Reason Tag 역시 선택 사항으로 두어 행동 데이터 자체를 훼손하지 않게 설계된 점이 타당합니다.

---

## N. Missing Decisions & O. Recommended Changes

설계자가 반드시 추가로 결정해야 하는 논리적 공백들입니다. 임의로 구현할 수 없으므로 설계 확정이 필요합니다.

### Issue 1: Primary Market의 공급량 및 유지 기간
*   **Problem**: Primary Market에 등록되는 초기 주택의 공급 수량(Supply limit)과 이 시장이 열려있는 기간(Duration)이 정의되지 않았습니다.
*   **Current Design**: 시스템이 초기 주택 공급 Pool을 제공하며, 가격은 Initial Price로 고정됩니다.
*   **Why It Matters**: Primary Market의 공급이 무한대(Unlimited)이거나 기간 제한이 없다면, 플레이어들은 굳이 Secondary Market에서 프리미엄을 주고 살 이유가 없어 가격 상승과 유동성 형성이 원천 억제됩니다. 반면 공급이 너무 적으면 0.1초 만에 초기 물량이 매진되는 Scalping이 일어납니다.
*   **Options**:
    1. 물량은 무제한이나, Season 시작 후 특정 기간(예: 현실 시간 3일) 뒤 Primary Market 일괄 폐쇄.
    2. 단지별로 실제 세대수의 일정 비율(예: 10%)만 선착순 한정 수량 공급.
    3. 시간대별로 조금씩 물량을 분할해서 공급(Vesting 방식).
*   **Recommendation**: Option 1 (특정 기간 후 Primary Market 일괄 폐쇄). 초기 시장 형성(분양 단계)이라는 느낌을 주고 이후 Secondary로 전환하기 용이합니다.
*   **Required Decision**: Primary Market의 단지별 공급 한도(무제한 vs 유한) 및 폐쇄(Close) 조건 확정.

### Issue 2: Jeonse Penalty Loan의 징벌적 금리 수준
*   **Problem**: 전세 보증금 반환 실패 시 임대인에게 발생하는 Penalty Loan의 금리 정책이 없습니다.
*   **Current Design**: 보증금 반환 실패 시 시스템이 임차인에게 먼저 반환하고, 임대인에게는 Penalty Loan을 발생시켜 부채(Debt)를 증가시킵니다.
*   **Why It Matters**: Penalty Loan의 금리가 일반 주택 담보 대출 금리와 같거나 낮다면, 임대인 플레이어는 "전세 만기 시 고의로 보증금을 안 주고 버티는 것"이 전략적으로 이득이 되는 어뷰징(Abusing)이 발생합니다.
*   **Options**:
    1. 일반 대출 금리(Base Rate) + 가산 금리(예: 10%p) 적용.
    2. 발생 즉시 1회성 현금 패널티(보증금의 5%)를 강제 차감 후 일반 대출로 전환.
*   **Recommendation**: Option 1 (징벌적 고금리 지속 부과). 막대한 이자 비용을 발생시켜 임대인 스스로 주택을 강제 매각(Forced Sale)하게끔 압박하는 것이 자연스럽습니다.
*   **Required Decision**: Penalty Loan에 적용될 징벌적 이자율(Penalty Rate) 또는 패널티 공식 확정.

### Issue 3: 강제 퇴거(Eviction) 이후 임차인의 주거 상태
*   **Problem**: 월세 미납으로 인해 강제 퇴거된 플레이어의 후속 주거 상태와 패널티가 정의되지 않았습니다.
*   **Current Design**: 보증금 고갈 -> Grace Period 경과 -> 강제 퇴거 및 계약 종료.
*   **Why It Matters**: 현실과 달리 시뮬레이션 내에서 무주택/노숙 상태가 허용되는지 여부가 중요합니다. 강제 퇴거 후에도 지출이 전혀 없다면, 렌트비를 안 내고 쫓겨나는 것이 현금 흐름상 오히려 이득이 될 수 있습니다.
*   **Options**:
    1. 시스템 임시 거처 강제 배정 및 매월 가혹한 '기본 생존 월세' 자동 차감.
    2. 무주택 상태를 허용하되, 현금 흐름(Cash Flow) 계산 시 극심한 '사회적 비용(Social Cost)' 패널티 항목을 강제 추가.
*   **Recommendation**: Option 2. 무주택 상태는 허용하되, 필수 지출(Essential Expense)을 대폭 늘려 강제퇴거가 경제적 파멸로 이어지게끔 징벌.
*   **Required Decision**: 강제 퇴거된 유저의 주거 상태 속성 및 페널티 지출(Cash flow penalty) 부과 정책 확정.
