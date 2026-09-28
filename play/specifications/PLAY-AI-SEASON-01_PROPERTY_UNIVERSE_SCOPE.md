# PLAY-AI-SEASON-01 PROPERTY UNIVERSE SCOPE
## AI Season 1 Property Data Scope & Baseline Lock

**Status:** EXECUTION READY  
**Applies To:** PLAY AI Season 1 only

---

# 1. 목적

AI Season 1의 Property Universe를 명확하게 정의하고 고정한다.

이번 AI Season 1의 목적은 전국 부동산 시장을 재현하는 것이 아니다.

목적은:

> 제한된 Property Universe 안에서 10 → 100 → 1,000 → 10,000 AI Participant가 동시에 경제행동을 수행할 때 PLAY Engine의 Transaction Integrity, Concurrency, Traceability, Reconciliation, Bottleneck을 검증하는 것

이다.

따라서 Property 데이터의 전국적 대표성이나 시장 대표성을 이번 단계의 검증 목표로 삼지 않는다.

---

# 2. 현재 Property Data Baseline

현재 PLAY에서 실제로 상세 검증이 완료된 Property Master의 기준은 다음과 같다.

## Primary Verified Dataset

```text
Region: 경기도 용인시 수지구
Source:
경기도 용인시 수지구_202609_Data_sum_202609_Valuated_202609.csv
```

검증 기준:

```text
Total Property Master: 209
NORMAL: 200
INCOMPLETE: 9
```

따라서 AI Season 1의 기본 Property Universe는:

> **검증 완료된 용인시 수지구 209개 Property Master**

로 고정한다.

---

# 3. 기흥구 데이터에 대한 명확한 구분

기존 설계 단계에서는 다음 파일도 Property Source로 지정되어 있었다.

```text
경기도 용인시 기흥구_202609_Data_sum_202609_Valuated_202609.csv
```

그러나 현재 단계에서 상세 검증 및 Property Master 기준으로 확정된 것은 수지구 209개 데이터다.

따라서 기흥구 데이터는:

```text
SOURCE CANDIDATE
```

이며,

```text
AI Season 1 VERIFIED PROPERTY UNIVERSE
```

에 포함하지 않는다.

AG는 기흥구 데이터를 발견했다는 이유만으로 AI Season 1 Property Universe에 자동 추가해서는 안 된다.

---

# 4. 전국 데이터에 대한 제한

AI Season 1에서는 전국 단위 Property Dataset을 사용하지 않는다.

다음과 같은 확장은 금지한다.

```text
서울 추가
경기 타 지역 추가
인천 추가
광역시 추가
지방 추가
전국 통합 CSV 생성
```

이번 단계에서 Property Universe를 확대하지 않는다.

---

# 5. 왜 수지구 209개인가

이번 선택은 "수지구가 전국 시장을 대표한다"는 의미가 아니다.

이번 선택은 다음 목적을 위한 기술적 테스트 범위다.

```text
작고 통제 가능한 Property Universe
+
검증 완료 데이터
+
대량 AI Participant
+
대량 Transaction
=
Engine Integrity / Concurrency Test
```

따라서 결과를 다음과 같이 해석해야 한다.

### 올바른 해석

> "수지구 209개 Property Universe를 대상으로 PLAY Engine의 대규모 동시 처리와 무결성을 검증했다."

### 잘못된 해석

> "전국 아파트 시장에서 PLAY Engine이 검증되었다."

---

# 6. Property Status

기존 Property 정책을 그대로 적용한다.

```text
NORMAL
- tradable = true
- initial_price != null
- Primary / Secondary transaction 대상

INCOMPLETE
- tradable = false
- initial_price = null 또는 필수 정보 부족
- 거래 대상에서 제외
```

따라서 실제 거래 가능한 기본 Universe는:

```text
200 NORMAL
```

이며,

```text
9 INCOMPLETE
```

는 Property Master에 존재하지만 AI Season 1 거래 대상에서는 제외한다.

---

# 7. Property Master의 의미

209라는 숫자는:

> 2026-09 Valuated source file에서 현재 검증된 Property Master 레코드 수

를 의미한다.

이는 다음을 의미하지 않는다.

```text
수지구 전체 아파트의 절대적 완전 목록
전국 아파트 시장 대표 표본
실시간 최신 시장 전체
```

AI Season 1의 데이터 커버리지에 대한 주장은 반드시 이 범위를 벗어나지 않는다.

---

# 8. AI Season 1 테스트 구조

```text
AI Season 1
30 simulated years
360 periods
        │
        ├── 10 AI
        │
        ├── 100 AI
        │
        ├── 1,000 AI
        │
        └── 10,000 AI
                 │
                 ↓
       Property Universe
       ┌─────────────────┐
       │ 209 Master      │
       │ 200 NORMAL      │
       │   9 INCOMPLETE  │
       └─────────────────┘
```

AI가 거래하는 Property는 기본적으로 200개의 NORMAL Property다.

---

# 9. Property 데이터 변경 통제

AI Season 1 실행 중 다음을 하지 않는다.

- Property Master 재구축
- 전국 데이터 추가
- 기흥구 자동 추가
- Property ID 변경
- Property price source 변경
- representative area rule 변경
- NORMAL / INCOMPLETE 정책 변경
- initial_price fallback 추가

이미 검증된 Property 정책을 그대로 사용한다.

---

# 10. Property 관련 검증 대상

AI Season 1에서 Property는 시장 대표성보다 다음 검증을 위한 데이터다.

## 10.1 Concurrent Purchase

다수 AI가 동일 Property를 동시에 구매할 때:

- 공급 초과가 발생하지 않는가
- 중복 ownership이 발생하지 않는가
- cash가 중복 차감되지 않는가
- transaction이 중복 처리되지 않는가

## 10.2 Concurrent Secondary Market

다수 AI가 동일 Property에 대해:

- BUY
- SELL

을 동시에 요청할 경우:

- double match
- duplicate ownership
- duplicate cash mutation
- incorrect order state

가 발생하지 않는지 검증한다.

## 10.3 Property State Traceability

임의 거래에 대해:

```text
AI
→ Action
→ Transaction
→ Property State
→ Ownership
→ Cash Mutation
→ Decision Log
```

를 추적할 수 있어야 한다.

---

# 11. Scale별 Property Test

### 10 AI

소규모 정상 거래 및 기본 동시성 확인.

### 100 AI

동시 Property 접근 증가.

### 1,000 AI

동일 Property 및 다수 Property에 대한 동시 접근 증가.

### 10,000 AI

대규모 Property transaction 및 Firestore contention / queue / worker throughput 확인.

---

# 12. PASS 기준

AI Season 1 Property Scope는 다음을 만족해야 한다.

- Property Master = 209
- NORMAL = 200
- INCOMPLETE = 9
- INCOMPLETE Property 거래 차단
- Property ID immutable
- 초기 가격 정책 변경 없음
- 거래 결과와 ownership 일치
- 거래 결과와 cash mutation 일치
- Decision Log 추적 가능
- duplicate ownership = 0
- duplicate economic effect = 0
- unexplained Property state mutation = 0

---

# 13. 최종 Scope Declaration

AI Season 1의 Property Universe는 다음과 같이 선언한다.

> **AI Season 1은 현재 검증 완료된 경기도 용인시 수지구 209개 Property Master를 기준으로 실행한다. 이 중 200개 NORMAL Property만 거래 가능하며, 9개 INCOMPLETE Property는 거래 대상에서 제외한다. 전국 또는 추가 지역의 Property Data는 AI Season 1 범위에 포함하지 않는다.**

이 선언은 AI Season 1의 모든 테스트 보고서와 최종 결과 해석에 적용한다.
