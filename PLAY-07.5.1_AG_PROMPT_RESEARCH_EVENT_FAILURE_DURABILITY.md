# AG 지시 프롬프트
# PLAY-07.5.1 TEST-04 Research Event Failure Durability Verification

이번 작업은 PLAY-07.5 Research Logging 구현 이후
오직 TEST-04의 "Research Event 유실 방지" 의미를 확인하기 위한 제한적 검증이다.

먼저 다음 문서를 읽어라.

1. PLAY-07.5_RESEARCH_LOGGING_IMPLEMENTATION_SPEC.md
2. PLAY-07.5_RESEARCH_LOGGING_IMPLEMENTATION_REPORT.md
3. PLAY-07.5_RESEARCH_LOGGING_DECISION_RECORD.md
4. PLAY-RESEARCH-DATA-DICTIONARY.md
5. PLAY-07.5.1_RESEARCH_EVENT_FAILURE_DURABILITY_VERIFICATION.md
6. PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1.md
7. PLAY-07.4_VERIFIED_AREA_LOCK_PROTOCOL.md

==================================================
1. 이번 작업의 단 하나의 질문
==================================================

다음 질문에만 답하라.

"Research Writer가 일시적으로 실패해도 Transaction은 정상적으로 보호되면서,
Research Event가 조용히 유실되지 않고 감지·추적·재처리될 수 있는가?"

이번 검증은 Research Logging 전체를 다시 검증하는 것이 아니다.

==================================================
2. 현재 구현에서 확인된 사항
==================================================

현재 보고서상:

- RESEARCH_EVENTS 구현
- researchLogger.ts 구현
- purchasePrimaryProperty.ts에 research_context 연결
- EXPOSURE / DECISION / ACTION logging
- VALIDATION(SUCCESS)
- VALIDATION(REJECTED)
- TRANSACTION(COMPLETED)
- TEST-01 ~ TEST-06 PASS

로 보고되어 있다.

그러나 구현 보고서에는
`logResearchEventAsync`에서 오류를 catch하여
Economic Engine Critical Path에 영향을 주지 않도록 한다고 되어 있다.

따라서 이번 검증은 다음 둘을 반드시 분리해서 확인한다.

A.
Research Writer failure가 Transaction을 손상시키지 않는가?

B.
Research Writer failure가 Research Event의 silent loss로 이어지지 않는가?

==================================================
3. 절대 변경 금지
==================================================

다음 Verified Area를 변경하지 마라.

- Economic Engine
- Economic Batch
- Season Clock
- Reconciliation
- Transaction Atomicity
- Transaction Idempotency
- Property Master
- PLAY_DECISION_LOG
- GATE 4
- GATE 5
- GATE 6
- AI L10
- AI L100

특히:

Research Event 저장 실패
→ Transaction rollback

구조를 절대 만들지 마라.

==================================================
4. 먼저 Read-only 조사
==================================================

코드를 바로 수정하지 마라.

먼저 현재 Research Writer 구현을 확인하라.

특히:

1. `logResearchEventAsync`
2. error catch 처리
3. failure를 어디에도 저장하지 않는지
4. retry 로직 존재 여부
5. DLQ 존재 여부
6. failure record 존재 여부
7. Research Event idempotency 구현
8. correlation_id
9. request_id
10. trace_id
11. 실제 RESEARCH_EVENTS 저장 방식

을 확인하라.

그리고 현재 TEST-04가 정확히 무엇을 PASS시킨 것인지 확인하라.

"Transaction은 안전했다"와
"Research Event가 보존됐다"를 혼동하지 마라.

==================================================
5. TEST-04A
==================================================

통제된 Research Writer failure를 발생시켜라.

Fault는 Research Writer에만 적용한다.

Transaction 자체를 fault injection 대상으로 삼지 마라.

실행:

1. Controlled Test Season 생성
2. Participant 생성
3. 정상적인 Primary Purchase 준비
4. Research Writer 저장 실패 발생
5. Transaction 실행
6. Transaction 상태 확인
7. Research Event failure 상태 확인
8. Retry / Failure Record / DLQ 존재 확인
9. 재처리
10. 최종 Research Event 확인
11. 중복 여부 확인

==================================================
6. PASS 기준
==================================================

다음 두 조건을 모두 만족해야 한다.

### A. Transaction Integrity

Research Writer failure에도:

- Transaction COMMITTED
- cash 정상
- property ownership 정상
- net worth 정상
- 기존 Transaction Idempotency 정상

### B. Research Event Durability

다음 중 하나 이상의 실제 경로가 존재해야 한다.

FAILED
→ RETRY
→ PERSISTED

또는

FAILED
→ DLQ
→ 재처리
→ PERSISTED

또는

FAILED
→ 영속 Failure Record
→ 재처리
→ PERSISTED

핵심은:

"실패한 Research Event를 나중에 찾고 재처리할 수 있는가?"

이다.

==================================================
7. FAIL 기준
==================================================

다음 중 하나면 FAIL.

- Research Event가 실패했지만 아무 기록도 남지 않음
- retry 없음
- DLQ 없음
- failure record 없음
- 재처리 방법 없음
- Transaction이 Research Writer failure 때문에 실패/rollback
- retry 과정에서 duplicate Research Event 발생
- Raw Evidence 부족

특히:

Research Event
→ 실패
→ catch
→ 무시
→ 사라짐

이면 명확한 FAIL이다.

==================================================
8. Fire-and-Forget 판단
==================================================

`async` 또는 `fire-and-forget` 자체를 문제로 판단하지 마라.

다음이면 허용:

await하지 않음
+
failure 감지
+
failure 추적
+
retry/DLQ/재처리 가능

다음이면 FAIL:

await하지 않음
+
catch
+
무시

==================================================
9. Idempotency
==================================================

실제 구현된 Research Event idempotency 기준을 먼저 확인하라.

그 기준을 그대로 사용해 duplicate/retry를 검증하라.

임의의 새로운 idempotency key를 만들어 테스트하지 마라.

Retry가 여러 번 발생해도 논리적 Event가 중복 기록되지 않아야 한다.

==================================================
10. Raw Evidence
==================================================

최종 보고서에 반드시 포함:

- Transaction 성공 로그
- Research Writer failure 로그
- Failure Record / Retry / DLQ 증거
- 재처리 로그
- 최종 RESEARCH_EVENTS 조회 결과
- Transaction 최종 상태
- duplicate 여부
- correlation_id
- request_id
- trace_id

가능하면 하나의 correlation_id로 전체 흐름을 보여라.

==================================================
11. Attempt Rule
==================================================

PLAY_AG_WORK_CONTROL_PROTOCOL_v1.1 적용.

Attempt 1 PASS:
→ 증거 저장
→ 즉시 종료

Attempt 1 FAIL:
→ 원인 분석
→ 최소 수정 1회
→ Attempt 2

Attempt 2 PASS:
→ 증거 저장
→ 즉시 종료

Attempt 2 FAIL:
→ 즉시 STOP
→ 추가 수정 금지
→ Human Review

3번째 실행 금지.

==================================================
12. 코드 변경
==================================================

원칙적으로 코드 변경 금지.

다만 TEST-04의 목적을 달성하기 위한 실제 결함이 발견되어
최소 수정이 반드시 필요하다면:

- root cause 기록
- 변경 전 evidence
- 최소 변경
- 변경 diff
- Attempt 2

를 기록하라.

Transaction Path를 변경하지 마라.

Assertion을 완화하지 마라.

Failure를 warning으로 바꾸지 마라.

Test script를 PASS에 맞춰 수정하지 마라.

==================================================
13. 이번 작업에서 하지 않을 것
==================================================

- UX 설계
- UI 변경
- Research Schema 재설계
- AI L1000
- AI L10000
- Human Season
- GATE 4 재실행
- GATE 5 재실행
- GATE 6 재실행
- 기존 Verified Area 개선
- 추가 기능 개발

==================================================
14. 결과 문서
==================================================

다음 문서 하나만 생성하라.

PLAY-07.5.1_RESEARCH_EVENT_FAILURE_DURABILITY_VERIFICATION_REPORT.md

반드시 포함:

1. 검증 목적
2. 현재 구현 구조
3. TEST-04A 조건
4. Attempt 1
5. Attempt 2 (필요한 경우만)
6. Transaction Integrity
7. Research Event Failure
8. Retry/DLQ/Failure Record
9. Idempotency
10. Raw Evidence
11. 변경 내역
12. 최종 판정
13. Human Season 영향

최종 판정은 정확히 하나:

VERIFIED

또는

VERIFIED WITH LIMITATION

또는

BLOCKED

==================================================
15. 종료 조건
==================================================

이번 작업은 다음 질문에 답하면 끝이다.

"Research Logging failure가 발생해도
Transaction은 안전하고
Research Event는 조용히 사라지지 않는가?"

VERIFIED가 확인되면 즉시 종료하라.

추가 개선사항을 발견해도 이번 범위에 포함시키지 마라.

다음 단계는 별도 승인 후
PLAY Human Product / UX 설계다.

UX 설계를 이번 작업에 섞지 마라.
