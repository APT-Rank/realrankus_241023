# PLAY HERO & TIME-SLIP TEST MODE SPECIFICATION v1.0

## 0. 문서 상태

- Document: `PLAY_HERO_TIME_SLIP_TEST_MODE_SPEC_v1.0.md`
- Scope: HERO Participant + Time-Slip Test Mode
- Parent Scope: `PLAY_LIVE_TIME_SLIP_SIMULATION_UI_SPEC_v1.0`
- Target: `/play/index.html`
- Simulation Target: 10P Property-Scale Simulation
- Status: DRAFT FOR IMPLEMENTATION APPROVAL

---

# 1. 목적

본 기능의 목적은 PLAY의 10P Property-Scale Simulation을 실제 사용자가 관찰하는 관점에서 경험할 수 있도록 하는 것이다.

이를 위해 특별한 Simulation Participant인:

```text
HERO
```

를 하나 생성한다.

HERO는:

> **현재 PLAY 화면을 보고 있는 실제 사용자를 Simulation World 안에 투영한 Participant**

로 정의한다.

따라서 사용자는 단순히 10명의 AI가 움직이는 모습을 보는 것이 아니라,

```text
AI Participants
       +
HERO
       ↓
같은 경제세계
       ↓
30년의 Time-Slip
```

을 경험한다.

---

# 2. HERO의 의미

HERO는 관리자 계정도 아니고 단순한 UI placeholder도 아니다.

HERO는 Simulation World의 실제 Participant다.

즉:

- Participant ID 존재
- Player State 존재
- Asset State 존재
- Decision State 존재
- Action State 존재
- Transaction 가능
- Outcome 존재
- Research Trace 가능

해야 한다.

---

# 3. HERO의 핵심 원칙

## H01 — 동일한 경제세계

HERO는 AI Participant와 동일한:

- economic environment
- property market
- supply
- transaction rules
- fee rules
- validation
- idempotency
- debt/asset rules

을 적용받는다.

---

## H02 — 특혜 금지

HERO에게 다음과 같은 숨은 특혜를 주지 않는다.

- 초기 현금 추가
- 무료 Property
- 낮은 transaction fee
- 높은 LTV
- 공급 우선권
- transaction bypass
- validation bypass
- ranking 제외
- 실패 무시

HERO가 실제 사용자라는 이유만으로 경제 규칙을 우회하지 않는다.

---

## H03 — HERO는 실제 사용자가 된다

사용자가 PLAY 화면을 볼 때:

```text
MY ASSET
```

은 HERO의 자산 상태를 보여준다.

예:

```text
HERO

Cash
Property
Debt
Net Worth
Economic Freedom
Recent Decisions
```

---

# 4. HERO ID

HERO는 별도의 안정적인 participant identifier를 가진다.

예:

```text
HERO
```

또는 실제 구현 규칙상 충돌을 피하기 위한:

```text
participant_type = HERO
participant_id = HERO
```

를 사용한다.

기존 Participant ID 규칙과 충돌하지 않아야 한다.

---

# 5. HERO Participant Type

Participant에는 다음 구분을 추가할 수 있다.

```text
participant_type:

HERO
AI
HUMAN
```

이번 테스트에서는:

```text
HERO = 1
AI = 10
```

으로 운영할 수 있다.

단, 기존 10P Simulation의 “10 participants” 정의가 유지되어야 한다면 HERO를 별도 Observer Participant로 둘 것인지, 10명 중 한 명으로 포함할 것인지 실행 전에 명확히 고정한다.

기본 권장:

```text
10 AI Participants
+
1 HERO Observer/Playable Participant
```

이다.

이렇게 하면 기존 10P Stress/Property Scale 기준과 HERO의 사용자 경험을 분리해서 분석할 수 있다.

---

# 6. HERO Initial State

HERO를 실제 Simulation Participant로 포함시키는 경우 AI와 동일한 초기조건을 사용한다.

```text
Initial Cash = 700,000,000 KRW
Initial Debt = 0
Initial Property = 0
Initial Financial Asset = 0
```

Initial Net Worth:

```text
700,000,000 KRW
```

HERO에게 별도의 초기 자산을 제공하지 않는다.

---

# 7. HERO Economic State

HERO의 경제상태는 authoritative Player State를 사용한다.

UI에서 별도로 계산하지 않는다.

최소:

```text
cash
locked_cash
debt
property_count
net_worth
economic_freedom
```

을 표시한다.

---

# 8. HERO Decision / Action

HERO는 일반 Participant와 동일한 Action Space를 가진다.

```text
EXPLORE
COMPARE
WATCH
HOLD
BUY
SELL
```

사용자가 직접 조작할 수 있는 경우 실제 사용자 행동이 HERO의 Decision / Action으로 기록된다.

---

# 9. HERO와 AI의 차이

HERO와 AI의 차이는 경제규칙이 아니라 **행동 주체**다.

```text
AI
→ Simulation Driver가 행동 생성

HERO
→ 실제 화면을 보는 사용자의 행동 또는
   테스트용 HERO Driver가 행동 생성
```

HERO에게 별도의 경제적 advantage를 주지 않는다.

---

# 10. HERO UI

상단 또는 핵심 영역에 HERO의 현재 상태를 명확하게 표시할 수 있다.

예:

```text
YOU ARE HERO

YEAR 12 · MONTH 08
PERIOD 152 / 360

Cash        5.8억
Property    2
Net Worth   9.1억
```

단, 실제 제품 UI에서 지나치게 게임 캐릭터처럼 보일 필요는 없다.

PLAY의 기존 visual language를 유지한다.

---

# 11. HERO HOME

HOME에서 HERO의 현재 상태와 세계 상태를 동시에 보여준다.

예:

```text
YOU

HERO
Net Worth 9.1억
Property 2

WORLD

P003 bought a property.
Region A became active.
P007 listed a property.

WHAT WILL YOU DO?
```

---

# 12. HERO MAP

지도에서 HERO가 보유한 Property는 명확하게 구분할 수 있다.

예:

```text
HERO OWNED
```

단, 모든 Property를 HERO 중심으로 강조하여 다른 참가자 행동을 가리지 않는다.

---

# 13. HERO REGION

지역탐색에서:

- HERO 관심
- HERO 보유 Property
- HERO 최근 행동

을 확인할 수 있다.

---

# 14. HERO MY ASSET

`내자산`은 HERO 전용 View다.

표시:

- Cash
- Locked Cash
- Debt
- Property
- Net Worth
- Economic Freedom
- Buy history
- Sell history
- Current holdings

---

# 15. HERO PEOPLE VIEW

다른 참가자 화면에서는:

```text
HERO
P001
P002
...
P010
```

등의 관계를 볼 수 있다.

HERO 자신을 “다른 참가자” 목록에 중복 표시하지 않는다.

---

# 16. HERO SEASON RANKING

HERO는 별도의 방식으로 제외하지 않는 한 Ranking에 포함한다.

예:

```text
#1 P003
#2 HERO
#3 P007
...
```

Ranking Metric은 기존 승인된 metric만 사용한다.

---

# 17. HERO Research Mapping

HERO 행동은 가능한 경우 다음과 연결한다.

```text
Exposure
 ↓
Decision
 ↓
Action
 ↓
Validation
 ↓
Transaction
 ↓
Outcome
```

HERO의 실제 UI 행동을 Research Logging에서 AI 행동과 구분할 수 있어야 한다.

예:

```text
participant_type = HERO
```

---

# 18. TIME-SLIP TEST MODE

Time-Slip UI는 **테스트 전용 모드**로 구현한다.

운영 기본값:

```text
OFF
```

---

# 19. ON/OFF 원칙

Time-Slip Test Mode는 필요할 때만 활성화한다.

```text
OFF
```

일반 PLAY 사용자에게 Simulation Control / Test UI를 노출하지 않는다.

```text
ON
```

일 때만:

- simulated time
- Run
- Pause
- Step
- Speed
- live activity
- HERO observation
- simulation controls

등을 노출한다.

---

# 20. OFF 상태

OFF에서는:

- Simulation Control 숨김
- Test Mode UI 숨김
- HERO 테스트 패널 숨김
- Run/Pause/Step/Speed 숨김
- 개발용 event stream 숨김

한다.

단, HERO가 실제 Participant로 사용되는 제품 구조라면 HERO의 일반적인 `내자산` 정보는 유지할 수 있다.

---

# 21. ON 상태

ON에서는:

```text
TIME-SLIP TEST MODE
```

를 명확하게 표시한다.

예:

```text
TEST MODE · TIME-SLIP ON

YEAR 14 · MONTH 03
PERIOD 159 / 360

[RUN] [PAUSE] [STEP]
1x 5x 20x 100x
```

실제 사용자가 일반 서비스와 혼동하지 않도록 해야 한다.

---

# 22. Safe Default

Time-Slip Test Mode의 기본값:

```text
OFF
```

로 한다.

새 브라우저/새 사용자/새 세션에서도 기본적으로 OFF가 안전하다.

---

# 23. Toggle Authority

ON/OFF 권한은 일반 사용자에게 무제한 제공하지 않는다.

다음 중 현재 프로젝트의 운영 방식에 맞는 방식을 사용한다.

- development configuration
- authorized operator flag
- admin/test account
- server-controlled test configuration

Client에서 단순히 boolean을 조작하는 것만으로 실제 backend Simulation을 활성화하지 않는다.

---

# 24. Persistence

ON/OFF 상태는 필요 시 다음 중 하나로 유지할 수 있다.

- operator configuration
- environment configuration
- authorized test setting

중요:

UI localStorage만으로 backend Simulation을 ON시키지 않는다.

---

# 25. Security

Time-Slip Test Mode가 ON이라고 해서:

- transaction authority
- admin authority
- Firestore write authority
- Security Rules
- economic calculation authority

가 생기면 안 된다.

Test Mode는 **관찰/실행 제어 기능의 노출 상태**일 뿐 권한 상승이 아니다.

---

# 26. Simulation Control

ON 상태에서:

```text
RUN
PAUSE
STEP
STOP
```

및:

```text
1x
5x
20x
100x
```

을 사용할 수 있다.

Control은 실제 Simulation authority에 연결한다.

UI animation만 실행하지 않는다.

---

# 27. HERO Time-Slip Experience

Time-Slip의 핵심은:

> “내가 HERO가 되어 30년의 경제생활을 압축해서 경험한다.”

이다.

따라서 시간 변화와 HERO 상태 변화를 연결한다.

예:

```text
YEAR 1
HERO starts with 7억
        ↓
YEAR 4
HERO explores Region A
        ↓
YEAR 7
HERO buys Property
        ↓
YEAR 12
HERO's asset position changes
        ↓
YEAR 20
HERO competes with other participants
        ↓
YEAR 30
Season Result
```

실제 행동/상태에 기반한 경우에만 표시한다.

---

# 28. HERO vs AI Activity

Live Activity에서는 HERO와 AI를 명확히 구분한다.

예:

```text
YOU
HERO bought Property A

AI
P003 bought Property B

AI
P007 listed Property C
```

---

# 29. Full Navigation Consistency

Time-Slip ON 상태에서 다음 모든 메뉴가 HERO와 세계의 동일한 상태를 반영해야 한다.

```text
HOME
MAP
REGION
MY ASSET
PEOPLE
SEASON RANKING
```

---

# 30. ON/OFF Isolation

OFF → ON:

- Simulation test UI appears
- HERO test context appears
- current authoritative state is loaded

ON → OFF:

- test UI disappears
- Simulation observation controls disappear
- economic state is NOT reset
- Firestore data is NOT deleted
- Season is NOT deleted
- HERO state is NOT deleted

OFF → ON:

- existing state resumes from authoritative backend state
- no duplicate Participant
- no duplicate transaction
- no duplicate listener

---

# 31. Refresh Behavior

Refresh while ON:

- authorized mode remains ON only if configured to persist
- current Simulation State restored
- HERO state restored

Refresh while OFF:

- Test Mode remains OFF unless operator configuration says otherwise.

---

# 32. Failure Rules

If HERO state and backend state disagree:

```text
BLOCKED
```

If ON/OFF toggle causes duplicate Simulation execution:

```text
BLOCKED
```

If OFF still exposes Test Mode controls to unauthorized users:

```text
BLOCKED
```

If HERO receives hidden economic advantage:

```text
BLOCKED
```

---

# 33. Acceptance Criteria

### HERO

- HERO exists as an identifiable Participant.
- HERO has authoritative Player State.
- HERO uses normal economic rules.
- HERO is visible in My Asset.
- HERO activity is visible where appropriate.
- HERO ranking is consistent with ranking rules.
- HERO behavior can be distinguished from AI behavior.

### TIME-SLIP

- Default OFF.
- Authorized ON.
- ON exposes Time-Slip controls.
- OFF hides test controls.
- ON/OFF does not reset simulation state.
- ON/OFF does not create duplicate state.
- Refresh/reconnect restores correct state.
- Six top-level views remain consistent.

### SECURITY

- Test Mode does not grant backend authority.
- Client cannot bypass Security Rules.
- HERO cannot bypass transaction validation.

---

# 34. Evidence

Generate:

```text
artifacts/hero_time_slip/
├── hero_participant.json
├── hero_initial_state.json
├── hero_state_trace.json
├── hero_ai_rule_parity.json
├── hero_navigation_trace.json
├── hero_ranking_trace.json
├── test_mode_on.json
├── test_mode_off.json
├── test_mode_toggle_integrity.json
├── refresh_persistence.json
├── no_duplicate_execution.json
├── no_privilege_escalation.json
└── final_hero_time_slip_report.md
```

---

# 35. Final Verdict

Use:

```text
READY FOR HERO TIME-SLIP SIMULATION
```

or:

```text
HERO/TIME-SLIP VERIFIED — FINDINGS REMAIN
```

or:

```text
BLOCKED — HERO/TIME-SLIP INTEGRATION FAILURE
```

---

# 36. Final Product Principle

> **사용자는 PLAY를 구경하는 사람이 아니라 HERO로서 그 세계 안에 들어간 사람이어야 한다.**

그리고:

> **Time-Slip은 PLAY의 상시 기능이 아니라 필요할 때 켜서 30년의 경제세계를 실제 화면에서 관찰하는 테스트/검증 모드여야 한다.**
