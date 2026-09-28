# PLAY_00_EXISTING_REALRANKUS_ANALYSIS.md

## 0. 문서 목적

이 문서는 기존 **RealRankus 서비스의 현재 코드베이스와 시스템 구조를 분석하고, 향후 PLAY를 기존 서비스에 안전하게 추가하기 위한 사전 분석 문서**이다.

현재 단계에서는 PLAY를 구현하지 않는다.

목표는 다음과 같다.

1. 기존 RealRankus의 전체 기술 구조를 파악한다.
2. 기존 코드 중 PLAY에서 재사용할 수 있는 부분을 식별한다.
3. PLAY를 기존 RealRankus에 어떤 방식으로 추가할 수 있는지 파악한다.
4. 기존 서비스에 영향을 최소화하면서 PLAY를 확장할 수 있는 위치를 찾는다.
5. 이후 PLAY 아키텍처 설계를 위한 기술적 사실과 제약조건을 정리한다.

---

# 1. 절대 준수사항

## 1.1 현재 단계에서는 코드를 수정하지 않는다

다음 작업은 금지한다.

- 기존 코드 수정
- 기존 파일 삭제
- 기존 파일 이름 변경
- 기존 DB 스키마 변경
- 기존 API 변경
- 기존 환경변수 변경
- 패키지 추가/삭제
- 라이브러리 버전 변경
- 배포 설정 변경
- 기존 서비스의 동작 변경
- PLAY 코드 신규 작성

현재 작업은 **READ ONLY 분석 단계**이다.

---

## 1.2 추측하지 않는다

코드에서 확인할 수 없는 내용은 임의로 추측하지 않는다.

확인할 수 없는 경우 다음과 같이 기록한다.

> 확인 필요

또는

> 현재 코드베이스에서 확인되지 않음

---

## 1.3 기존 서비스의 목적을 임의로 변경하지 않는다

RealRankus의 기존 서비스 구조와 목적을 존중한다.

PLAY는 기존 RealRankus를 대체하는 것이 아니라 **기존 서비스에 추가되는 별도의 기능/모듈**로 간주한다.

---

# 2. 분석 대상

프로젝트 전체를 다음 영역으로 구분하여 분석한다.

### 2.1 프로젝트 구조

다음 정보를 확인한다.

- 최상위 디렉토리
- 주요 디렉토리
- 주요 파일
- 설정 파일
- 환경설정 파일
- 빌드 파일
- 배포 관련 파일
- 테스트 디렉토리
- 문서 디렉토리

프로젝트 구조를 Tree 형태로 정리한다.

실제 프로젝트 구조를 기준으로 작성한다.

---

# 3. 기술 스택 분석

현재 실제 사용 중인 기술을 확인한다.

다음 항목을 조사한다.

### Frontend

- Framework
- Language
- UI Library
- State Management
- Routing
- Build Tool

### Backend

- Language
- Framework
- API 구조
- Authentication
- Business Logic 구조

### Database

- DB 종류
- ORM
- 주요 테이블
- 주요 관계
- Migration 방식

### Infrastructure

- Hosting
- Server
- Cloud
- Storage
- CDN
- Domain 관련 구조

### Development

- Package Manager
- Git 사용 여부
- Branch 구조
- Test Framework
- CI/CD

각 항목에 대해 반드시 **실제 코드에서 확인한 근거**를 기록한다.

---

# 4. 실행 구조 분석

현재 RealRankus가 실제로 어떻게 실행되는지 분석한다.

확인할 것:

1. 개발 환경 실행 방법
2. Frontend 실행 방법
3. Backend 실행 방법
4. Database 실행 방법
5. 전체 서비스를 실행하는 방법
6. Build 방법
7. Test 방법
8. Production 배포 방법

가능하다면 관련 명령어를 기록한다.

단, 실제 실행이 필요한 경우에도 **코드를 수정하지 않는 범위에서만 실행한다.**

---

# 5. Frontend 분석

현재 RealRankus Frontend 구조를 분석한다.

다음 항목을 확인한다.

### 5.1 화면 구조

- 주요 페이지
- 주요 컴포넌트
- Layout
- Navigation
- User flow

### 5.2 데이터 연결

- API 호출 방식
- API client
- 상태관리
- 서버 데이터 처리 방식

### 5.3 부동산 관련 화면

RealRankus의 핵심 서비스와 관련된 화면을 찾아 분석한다.

예:

- 지역
- 아파트
- 가격
- GLI
- LTV
- 분석 리포트
- 검색
- 지도
- 기타 관련 화면

실제 존재하는 기능만 기록한다.

---

# 6. Backend 분석

Backend의 전체 구조를 분석한다.

다음 항목을 확인한다.

### 6.1 API

- API routing 구조
- 주요 endpoint
- 인증이 필요한 API
- 부동산 데이터 API
- 분석 관련 API

### 6.2 Business Logic

실제 비즈니스 로직이 어느 위치에 존재하는지 파악한다.

예:

```text
Controller
↓
Service
↓
Repository
↓
Database
```

실제 구조가 다르면 실제 구조를 기록한다.

---

# 7. Database 분석

PLAY 개발에서 매우 중요한 부분이다.

현재 DB 구조를 조사한다.

### 7.1 주요 테이블

다음 정보를 표 형태로 작성한다.

| Table | 목적 | 주요 컬럼 | 주요 관계 | PLAY 재사용 가능성 |
|---|---|---|---|---|

### 7.2 부동산 데이터

특히 다음과 관련된 데이터를 찾는다.

- 지역
- 아파트
- 가격
- 거래
- 면적
- 임대
- 공급
- 인구
- 개발
- 교통
- 교육
- GLI
- LTV
- 기타 RealRankus 지표

### 7.3 사용자 데이터

확인한다.

- User
- Account
- Profile
- Authentication
- Subscription
- Payment
- Report
- 기타 관련 데이터

개인정보 또는 민감정보는 분석 결과에 불필요하게 복사하지 않는다.

---

# 8. RealRankus 기존 핵심 로직 분석

현재 RealRankus의 핵심적인 계산/분석 로직을 찾아본다.

특히 다음을 확인한다.

- GLI 계산
- LTV 계산
- 가격 분석
- 지역 분석
- 부동산 평가
- 데이터 수집
- 데이터 정제
- 리포트 생성
- 기타 알고리즘

각 로직에 대해 다음을 기록한다.

| 기능 | 코드 위치 | 입력 | 출력 | PLAY 재사용 가능성 | 비고 |
|---|---|---|---|---|---|

중요한 계산식이나 알고리즘이 발견되면 코드 위치와 함께 설명한다.

---

# 9. 데이터 수집 구조 분석

RealRankus가 외부 데이터를 어떻게 가져오는지 확인한다.

예:

- 공공데이터
- 국토교통부
- 부동산 데이터
- 인구 데이터
- 경제 데이터
- 외부 API
- 크롤링
- 파일 데이터

확인할 항목:

- 데이터 source
- 수집 방식
- 저장 위치
- 갱신 주기
- 데이터 모델
- 오류 처리
- 과거 데이터 보관 여부

---

# 10. 인증 및 사용자 구조 분석

PLAY는 기존 RealRankus의 사용자 계정을 재사용할 가능성이 높다.

따라서 다음을 확인한다.

- 회원가입
- 로그인
- Session
- JWT
- OAuth
- User ID 구조
- 권한 관리
- 탈퇴
- 사용자 데이터 연결 방식

단, 현재 단계에서는 인증 구조를 변경하지 않는다.

---

# 11. 결제 및 서비스 구조 분석

RealRankus에 이미 결제/유료 서비스가 있다면 분석한다.

확인:

- 결제 시스템
- 유료 리포트
- Subscription
- Payment
- 주문
- 사용자별 구매 이력
- 이메일 발송
- 리포트 생성

향후 PLAY 보상/프리미엄 서비스와 연결할 수 있는 가능성만 분석한다.

---

# 12. 배포 및 운영 구조 분석

현재 서비스가 어디에서 어떻게 운영되는지 확인한다.

확인:

- Hosting
- Server
- Database Server
- Storage
- Domain
- SSL
- Environment Variables
- Logging
- Monitoring
- Backup
- CI/CD

---

# 13. 테스트 구조 분석

현재 프로젝트에 테스트가 존재하는지 확인한다.

확인:

- Unit Test
- Integration Test
- E2E Test
- Test Framework
- Test Data
- Test 실행 방법
- CI에서 테스트 실행 여부

테스트가 없다면 없다고 명시한다.

---

# 14. PLAY와 재사용 가능한 코드 식별

기존 RealRankus에서 PLAY가 사용할 수 있는 요소를 분류한다.

다음 기준을 사용한다.

### A. 그대로 재사용 가능

수정 없이 사용할 수 있는 코드/데이터.

### B. 일부 수정 후 재사용

기존 구조를 활용할 수 있으나 PLAY 요구사항에 맞는 수정이 필요한 부분.

### C. 새로 개발 필요

PLAY를 위해 별도로 만들어야 하는 기능.

표로 정리한다.

| 기존 기능/코드 | 위치 | 분류 | PLAY 활용 방법 | 위험도 |
|---|---|---|---|---|

---

# 15. PLAY가 추가될 수 있는 위치 분석

현재 코드 구조를 기준으로 PLAY가 어디에 들어가는 것이 적절한지 분석한다.

예를 들어 다음과 같은 구조를 가정할 수 있지만, 실제 프로젝트에 맞게 판단한다.

```text
RealRankus
│
├── Existing Service
│
└── PLAY
    ├── Economic Engine
    ├── Simulation Engine
    ├── Property Engine
    ├── Transaction Engine
    ├── Decision Logger
    ├── Season Engine
    ├── Ranking
    └── Analysis Engine
```

이 구조가 적합한지 검토한다.

더 좋은 구조가 있다면 제안한다.

단, 현재 단계에서는 실제 코드를 변경하지 않는다.

---

# 16. 데이터베이스 확장 방향 분석

PLAY에서 향후 필요할 가능성이 있는 데이터 영역을 식별한다.

예:

```text
PLAY_USER
PLAY_SEASON
PLAY_PLAYER_STATE
PLAY_PROPERTY
PLAY_TRANSACTION
PLAY_DECISION_LOG
PLAY_MARKET_STATE
PLAY_ECONOMIC_STATE
PLAY_RANKING
PLAY_REWARD
PLAY_ANALYSIS
```

위 테이블을 반드시 생성하라는 의미가 아니다.

현재 RealRankus DB와 비교하여 **어떤 데이터가 기존 DB에서 재사용 가능하고 어떤 데이터가 신규로 필요할지** 분석한다.

---

# 17. 기존 서비스 영향도 분석

PLAY를 추가할 경우 기존 RealRankus에 발생할 수 있는 위험을 분석한다.

다음 항목을 확인한다.

- 기존 API 영향
- DB 영향
- Frontend 영향
- 성능 영향
- 서버 비용 영향
- 사용자 인증 영향
- 배포 영향
- 데이터 정합성 영향
- 기존 서비스 장애 가능성

각 위험에 대해:

| 위험 | 원인 | 영향 | 심각도 | 대응 방향 |
|---|---|---|---|---|

---

# 18. 추천 개발 구조

현재 분석 결과를 바탕으로 PLAY를 기존 RealRankus에 추가하는 방법을 제안한다.

다음 중 어떤 방식이 적합한지 판단한다.

### Option A

기존 서비스 내부에 PLAY 모듈 추가

### Option B

기존 서비스와 PLAY를 논리적으로 분리

### Option C

별도 Backend / Service로 분리

### Option D

Hybrid 구조

각 방식의 장단점을 비교한다.

최종적으로 하나를 추천하되, **현재 단계에서는 실제 구현하지 않는다.**

---

# 19. PLAY 개발을 위한 기술적 선결과제

분석 결과를 바탕으로 PLAY 개발 전에 해결해야 할 기술적 문제를 정리한다.

예:

1. 기존 DB 구조 확인
2. 사용자 ID 재사용 가능 여부
3. 부동산 데이터 재사용 가능 여부
4. Python 경제엔진 연결 방식
5. Simulation API 구조
6. Decision Log 저장 방식
7. Season 데이터 분리 방식
8. 대규모 시뮬레이션 처리 방식
9. 기존 서비스와 PLAY의 장애 격리
10. 테스트 환경 구축

우선순위를 부여한다.

---

# 20. 분석 결과 요약

최종적으로 다음 내용을 반드시 작성한다.

## 20.1 현재 RealRankus 기술 구조

짧은 설명과 구조도.

## 20.2 가장 중요한 재사용 자산 TOP 10

기존 RealRankus에서 PLAY 개발에 가장 가치 있는 코드/데이터/기능을 선정한다.

단, "가치"는 PLAY 개발 관점의 기술적 재사용 가능성을 의미한다.

## 20.3 PLAY 신규 개발 영역

새롭게 개발해야 할 영역을 정리한다.

## 20.4 가장 큰 기술적 위험 TOP 5

PLAY 개발 시 가장 주의해야 할 부분.

## 20.5 추천 아키텍처

현재 코드베이스를 기준으로 추천하는 PLAY 확장 방식.

## 20.6 다음 단계 제안

다음 문서인

`PLAY_01_ARCHITECTURE.md`

를 작성하기 전에 반드시 필요한 선행 작업을 정리한다.

---

# 21. 최종 출력 형식

최종 분석 결과는 다음 구조로 작성한다.

```text
# RealRankus Existing System Analysis

## 1. Executive Summary

## 2. Project Structure

## 3. Technology Stack

## 4. Runtime Architecture

## 5. Frontend Architecture

## 6. Backend Architecture

## 7. Database Architecture

## 8. Existing RealRankus Core Logic

## 9. Data Pipeline

## 10. Authentication & User System

## 11. Payment & Report System

## 12. Deployment & Infrastructure

## 13. Testing

## 14. Reusable Components

## 15. PLAY Integration Points

## 16. Database Extension Analysis

## 17. Risk Analysis

## 18. Recommended Integration Architecture

## 19. Technical Prerequisites

## 20. Summary

## 21. Recommended Next Step
```

---

# 22. 완료 조건

이 문서는 다음 조건을 모두 만족해야 완료된 것으로 본다.

- [ ] 전체 프로젝트 구조를 확인했다.
- [ ] 실제 기술 스택을 확인했다.
- [ ] Frontend 구조를 확인했다.
- [ ] Backend 구조를 확인했다.
- [ ] Database 구조를 확인했다.
- [ ] 기존 RealRankus 핵심 로직을 확인했다.
- [ ] 부동산 데이터 구조를 확인했다.
- [ ] 사용자 구조를 확인했다.
- [ ] 배포 구조를 확인했다.
- [ ] 테스트 구조를 확인했다.
- [ ] PLAY에서 재사용 가능한 요소를 확인했다.
- [ ] PLAY 신규 개발 영역을 확인했다.
- [ ] 기존 서비스 영향도를 분석했다.
- [ ] PLAY 통합 방향을 제안했다.
- [ ] **기존 코드를 변경하지 않았다.**
- [ ] **DB를 변경하지 않았다.**
- [ ] **패키지를 변경하지 않았다.**
- [ ] **PLAY 기능을 구현하지 않았다.**

---

# 23. 중요 원칙

이 프로젝트의 최종 목적은 단순한 부동산 게임 제작이 아니다.

PLAY는 향후 다음 구조를 목표로 한다.

```text
실제 경제환경
      ↓
PLAY 경제환경
      ↓
사용자의 경제적 의사결정
      ↓
의사결정 결과
      ↓
RAW 행동 데이터
      ↓
Season Analysis
      ↓
행동 패턴 / 인사이트 / 가설
      ↓
다음 Season
      ↓
RealRankus 모델 개선
```

따라서 PLAY의 코드를 설계할 때도 단순히 "게임이 작동하는가"만 보는 것이 아니라,

> **동일한 경제환경에서 사람들의 의사결정을 관찰하고 분석할 수 있는 구조인가?**

를 장기적인 기준으로 삼는다.

그러나 현재 `PLAY_00` 단계에서는 **이 목적을 실제 코드로 구현하지 않는다.**

현재 단계의 유일한 목표는:

> **"우리가 이미 가지고 있는 RealRankus라는 자산을 정확히 이해하는 것"**

이다.

분석이 끝나면 결과를 ChatGPT에 전달하고, 그 결과를 바탕으로 다음 단계의 아키텍처를 설계한다.
