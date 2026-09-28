# PLAY_03.1_PROPERTY_MARKET_IMPLEMENTATION_SPEC_REVIEW.md

## A. Overall Assessment
*   **구현 가능성**: 기술적으로 Firebase(Cloud Functions + Firestore) 구조 내에서 서버 주도(Server Authority) 아키텍처로 구현이 충분히 가능합니다.
*   **주요 위험도**: 매매/전월세 매칭을 위한 트랜잭션 경합(Lock Contention) 문제와, 철저한 사용자 간 거래(User-to-User)만을 고집할 경우 발생할 수 있는 **초기 유동성 고갈(Cold Start)**이 가장 큰 위험입니다.
*   **현재 설계의 가장 중요한 문제**: `PLAY_02` 규정에 따르면 모든 플레이어는 초기 자산으로 주택 0채, 현금 7억 원만 들고 시작합니다. 그런데 가상 NPC나 Market Maker 매도자마저 전면 금지한다면, **시장에 아파트를 팔(SELL) 수 있는 주체가 단 한 명도 없으므로 시장의 거래가 영원히 시작될 수 없는 논리적 모순**이 존재합니다.

## B. Existing Code Compatibility
*   **재사용 가능한 부분**: Firebase Authentication(로그인/세션), `91_Complex_Valuation` 초기 단지 메타데이터(아파트명, 주소 등).
*   **새로 만들어야 하는 부분**: 서버 사이드의 Order Book 큐 관리, 매칭 엔진(Transaction), 유저의 지갑(Cash/Property 보유 상태) 업데이트 스케줄러.
*   **기존 코드와 충돌 가능성**: 기존 RealRankus는 프론트엔드가 주도하여 값을 계산하고 DB를 갱신합니다. PLAY는 Server Authority가 필수이므로, 기존 JS 클라이언트 로직을 혼용하려 하면 심각한 보안 및 상태 꼬임(Race Condition) 충돌이 발생합니다.
*   **분리 가능성**: Firestore 내에 `PLAY_` 접두사가 붙은 독립된 컬렉션들만 사용하고, API 엔드포인트를 분리하면 기존 RealRankus 서비스에 영향을 주지 않고 안전하게 격리할 수 있습니다.

## C. Data Model Issues
*   **`PLAY_PLAYER_ASSET` (소유 장부) 누락**: 플레이어가 어떤 아파트를 소유하고 있는지 빠르게 확인하기 위해, `PLAY_PROPERTY` 외에 유저 기준의 소유권(Ownership) 및 임차권(Occupancy) 상태를 담는 별도 Entity가 필요합니다.
*   **`locked_cash` / `locked_property` 누락**: 매수/매도 주문이 'OPEN' 상태일 때 다른 거래에 현금이나 집을 이중으로 사용할 수 없도록 상태를 동결하는 필드가 `PLAY_PLAYER_STATE`에 추가되어야 합니다.

## D. Order Book / Matching Issues
*   **부분 체결의 불필요성**: 부동산의 특성상 1채 미만 단위의 거래는 불가합니다. 수량(Quantity) 개념을 허용하더라도, 매수자와 매도자의 수량이 일치하지 않으면 부분 체결 후 잔여 소유권이나 전세 권리 처리가 극도로 복잡해집니다. MVP에서는 무조건 `Quantity = 1` 단위의 개별 주문으로 통제하는 것이 안정적입니다.

## E. Sale Market Issues
*   **초기 공급 문제**: (A 항목에서 언급했듯) 최초의 매물 공급처가 명시되지 않았습니다. 누군가 집을 팔아야 거래가 시작되며, 거래가 있어야 VWAP와 PLAY Price가 형성됩니다.

## F. Jeonse Market Issues
*   **보증금 미반환(Default) 리스크**: 전세 계약 만료 시점에 임대인(Landlord)이 현금을 다른 자산에 묶어두어 보증금을 돌려줄 수 없는 상황(깡통전세)에 대한 처리가 누락되었습니다.
*   **계약 기간과 오프라인**: 유저가 오프라인일 때 계약 기간이 끝났을 경우, 시스템이 자동으로 보증금을 반환 정산할지, 묵시적 갱신으로 넘길지에 대한 정의가 필요합니다.

## G. Monthly Rent Market Issues
*   **월세 미납 리스크**: 임차인(Tenant)이 이자 지출 등으로 현금이 부족해져 월세를 미납할 경우, 보증금에서 차감(Deduction)하는 로직과 보증금이 고갈되었을 때의 강제 퇴거(Eviction) 처리 프로세스가 정의되어야 합니다.

## H. Player State / Cash Flow Issues
*   현금흐름(Cash Flow)이 음수일 때, 단순 Cash만 마이너스로 떨어뜨릴지, 아니면 자동으로 연체 이자율이 붙는 시스템 부채(Debt)로 전환될지에 대한 기계적 계산 룰이 요구됩니다.

## I. Security Issues
*   **Server Authority 필수**: Client는 API를 통해 '주문 생성(Intent)'만 요청해야 합니다. Firestore의 클라이언트 직접 쓰기 권한은 `PLAY_HOUSING_CHOICE` 등 일부 로깅을 제외하고는 Security Rules에서 철저히 `false`로 막아야 합니다.

## J. Concurrency Issues
*   **이중 지출(Double Spend)**: 주문이 동시에 들어올 경우, 서버 측에서 Transaction을 사용해 잔고(`available_cash`) 확인 후 `locked_cash`로 이동시키는 Atomic한 처리가 필수입니다.
*   **중복 체결**: 다대다(N:N) 매칭이 일어나는 순간, 이미 체결된 주문(FILLED)이 다른 스레드에서 다시 체결되지 않도록 매칭 로직 내부에 낙관적 락(Optimistic Lock) 검증이 구현되어야 합니다.

## K. Performance / Cost Issues
*   **Firestore Write 경합**: 특정 인기 단지(호가창)에 주문이 몰릴 경우, 단일 Document 업데이트 한계(초당 1회)에 부딪힐 수 있습니다. 호가창은 셔딩(Sharding)하거나 주문만 개별 Document로 쌓고 Cloud Functions 트리거가 비동기로 매칭하는 Event Sourcing 방식이 적합합니다.
*   **History 데이터 폭증**: 매일 Batch마다 생성되는 `_HISTORY` 데이터는 시즌당 수천만 건에 달할 수 있습니다. 이는 Firestore에 적재 시 비용 폭탄의 원인이 되므로, 즉시 BigQuery로 스트리밍 저장하는 파이프라인(`Phase 9`)이 비용 면에서 매우 중요합니다.

## L. Forecast Data Issues
*   **사용자 의도 누락**: 현재 설계는 행동의 '결과(Buy, Sell)'는 잘 저장하지만 '이유'가 부족합니다. 매수 주문 시 간단한 `Reason Tag`(예: "금리 하락 기대", "거주 목적" 등)를 선택하게 하여 Forecast 데이터와 결합하면 예측 모델의 질이 비약적으로 상승할 것입니다.

## M. Missing Decisions
설계자가 반드시 추가로 결정해야 하는 핵심 사항들입니다.

1.  **초기 주택 공급 방식 (매우 중요)**: 가상 NPC를 금지한다면, 플레이어들의 초기 자산을 배분할 때 일부 유저에게 현금 대신 "주택 1채 + 대출"을 할당하여 시장에 매도자가 존재하도록 만들 것인가?
2.  **전세 보증금 미반환 시나리오**: 계약 종료 시 임대인 현금이 부족하면 (1) 강제매각 (2) 시스템 강제대출(고금리) (3) 파산 상태 부여 중 어떤 방식을 택할 것인가?
3.  **월세 연체 시나리오**: 보증금 고갈 시 월세 미납에 대한 강제 퇴거/패널티 규칙은 무엇인가?
4.  **수량(Quantity) 부분 체결 허용 여부**: MVP 모델에서 수량 1 고정으로 제한할 것인지, 아니면 쪼개기 매매를 허용할 것인지 확정이 필요합니다.

## N. Recommended Changes

*   **Current**: 사용자 간 거래만 허용하고 NPC 개입 전면 금지. 초기 자산은 모두 현금 7억.
*   **Problem**: 아무도 주택을 보유하지 않아 시장에 매도(SELL) 호가가 올라올 수 없으며 거래 엔진이 영원히 멈춥니다.
*   **Recommendation**: Season 시작 후 최초 1회에 한해, 시스템(가상 NPC)이 `initial_price`를 기준으로 초기 공급 물량(Initial Supply) 매도 호가를 제출하도록 예외를 두거나, 유저의 절반은 유주택자로 시작하도록 룰을 수정해야 합니다.
*   **Reason**: 최소한의 기초 유동성이 있어야 PLAY Price 형성과 의사결정 시뮬레이션이 시작될 수 있습니다.

*   **Current**: 주문 요청 시 지불 능력(Cash) 검증만 수행.
*   **Problem**: 유저가 7억을 들고 7억짜리 아파트 10곳에 동시에 매수 주문을 넣을 수 있는 이중 주문(Double Spend) 위험.
*   **Recommendation**: `PLAY_PLAYER_STATE`에 `available_cash`와 `locked_cash`(주문 동결금) 필드를 분리하여, 주문 즉시 가용 현금을 잠그도록 변경.
*   **Reason**: 주식 시장의 예수금 동결과 동일하게 시스템 무결성을 지키기 위함입니다.

*   **Current**: 전세/월세 계약 만료 시 보증금 반환 의무만 존재.
*   **Problem**: 임대인이 파산 상태이거나 현금이 묶인 상태일 경우의 시나리오가 부재하여 시뮬레이션이 중단될 우려가 큼.
*   **Recommendation**: 전세 만기 반환 실패 시, 시스템이 임대인에게 '강제 연체 대출(Penalty Loan)'을 발생시켜 임차인에게 보증금을 반환하도록 하고 임대인을 채무 불이행 상태로 페널티를 부여하는 룰 추가.
*   **Reason**: 시뮬레이션의 시간 축(Season Clock)은 멈추지 않고 흘러야 하므로, 현실의 법적 공방 과정을 시스템적으로 즉시 정산 가능한 형태로 추상화해야 합니다.
