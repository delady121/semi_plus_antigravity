# Semi-PLUS PRD — 반도체 FAB 레이아웃 및 협업 통합 시스템

> **문서 버전:** v1.0.0 | **상태:** 개발 착수본 | **대상:** Claude Code 기반 개발 진행용

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [사용자 페르소나 및 시나리오](#2-사용자-페르소나-및-시나리오)
3. [핵심 기능 명세](#3-핵심-기능-명세)
   - 3.1 [대시보드 프레임워크](#31-대시보드-프레임워크-low-code-환경)
   - 3.2 [데이터 엔진 (Global Data)](#32-데이터-엔진-global-data)
   - 3.3 [레이아웃 시뮬레이터](#33-레이아웃-시뮬레이터)
   - 3.4 [워크플로우 및 협업](#34-워크플로우-및-협업)
   - 3.5 [버전 관리](#35-버전-관리)
4. [UI/UX 화면 설계](#4-uiux-화면-설계)
5. [데이터베이스 스키마 및 API 설계](#5-데이터베이스-스키마-및-api-설계)
6. [기술 스택 및 보안 제약사항](#6-기술-스택-및-보안-제약사항)
7. [예외 케이스 처리 및 개발 로드맵](#7-예외-케이스-처리-및-개발-로드맵)
8. [부록](#8-부록)

---

## 1. 프로젝트 개요

### 1.1 배경

반도체 제조 기획 부서는 FAB(Fabrication Plant) 내 설비의 **반입/반출 일정 관리**와 **레이아웃 배치 계획 수립**을 핵심 업무로 수행한다. 현재 이 업무는 복수의 분리된 도구를 사용하여 파편화된 방식으로 처리되고 있다.

**현행 시스템 문제:**

| 문제 유형 | 현상 |
|-----------|------|
| 데이터 파편화 | Excel 설비 DB + Spotfire 시각화 + 도면 시스템이 각각 독립 운영 |
| 데이터 무결성 결여 | 수동 복사-붙여넣기로 인한 누락·오류 빈발 |
| 레이아웃 시뮬레이션 불가 | 도면 시스템이 조회 전용, 배치 검토 불가 |
| Dead Space 관리 불가 | Maintenance 공간 고려 없이 설비 배치 계획 수립 |
| 협업 워크플로우 부재 | 유관 부서 검토·승인 프로세스가 이메일/구두로만 진행 |
| 버전 관리 미흡 | As-is 도면과 To-be 기획안의 체계적 비교 불가 |

### 1.2 목적

- **단일 진실의 원천(Single Source of Truth)** 확립: 설비 마스터 데이터를 통합 DB에 집중 관리
- **인터랙티브 레이아웃 시뮬레이션**: 7레이어 Canvas 기반 도면에서 드래그 앤 드롭 및 공간 최적화 수행
- **구조화된 협업 워크플로우**: 상태 기반 승인 프로세스로 부서 간 검토 체계화
- **데이터 기반 의사결정 지원**: Web-Spotfire 수준의 시각화·분석 도구 통합 제공
- **유연한 대시보드 환경**: Low-Code 위젯 시스템으로 비개발자도 화면 구성 가능

### 1.3 기대효과

| 구분 | 정량적 효과 | 정성적 효과 |
|------|------------|------------|
| 데이터 관리 | 데이터 누락률 90% 이상 감소, 수작업 업데이트 주 20h → 2h | 단일 DB에서 실시간 정확한 정보 조회 |
| 레이아웃 계획 | 배치 계획 수립 시간 50% 단축, Dead Space 20% 이상 감소 | 물리적 제약(OHT, 유지보수 공간) 반영 현실적 시뮬레이션 |
| 협업 효율 | 승인 리드타임 평균 3일 → 1일, 검토 누락 0건 목표 | 유관 부서 실시간 알림 및 상태 추적 |
| 의사결정 | 보고서 작성 시간 60% 절감, As-is/To-be 비교 즉시 가능 | 데이터 기반 투자 구분별 시나리오 비교 |

---

## 2. 사용자 페르소나 및 시나리오

### 2.1 페르소나

#### 페르소나 A — 제조 기획자 (주 사용자)

```
이름/직위:   김태준 / 선임 엔지니어 (제조기획팀)
경력:        반도체 FAB 운영 7년, 기획 업무 4년
주요 업무:   설비 반입/반출 일정 수립, FAB 레이아웃 기획, 부서 간 협업 조율
기술 수준:   Excel 고급, Spotfire 중급, CAD 기초
주요 고충:   수작업 데이터 취합에 매일 2시간 소요, 배치 변경 시마다 담당자에게 메일 발송
목표:        레이아웃 기획안을 빠르게 시각화하고, 유관 부서 승인을 시스템에서 추적
```

#### 페르소나 B — 유관 부서 검토자 (기술/건설/안전)

```
이름/직위:   박민지 / 책임 엔지니어 (설비기술팀)
경력:        설비 엔지니어링 10년
주요 업무:   설비 Maintenance 공간 검토, 설치 가능 여부 확인
기술 수준:   Excel 중급, 사내 ERP 시스템 활용
주요 고충:   검토 요청이 메일로 오며 도면이 첨부 PDF여서 현황 파악이 어려움
목표:        웹에서 직접 도면을 보며 의견을 남기고 승인/반려 처리
```

#### 페르소나 C — 시스템 관리자

```
이름/직위:   이상현 / 수석 (IT 인프라팀)
주요 업무:   사용자 권한 관리, 내비게이션 구성, 데이터 연동 설정
기술 수준:   SQL 중급, 시스템 관리 경험 다수
주요 고충:   비개발자도 화면 구성 요청하므로 매번 개발팀 의뢰 필요
목표:        Low-Code 환경에서 직접 메뉴·위젯·권한 설정 가능
```

### 2.2 핵심 시나리오

#### 시나리오 1 — 신규 설비 배치 기획

1. 제조 기획자가 Semi-PLUS 대시보드 로그인 후, `[레이아웃]` 메뉴에서 FAB Bay 선택
2. L5(설비) 레이어 활성화하여 현재 배치된 설비 현황 확인
3. Origin_Table에서 신규 반입 예정 설비(장비번호, 크기, Maintenance 공간) 조회
4. 설비 패널에서 신규 설비 객체를 드래그하여 Canvas 상에 배치 시도
5. OHT 레일 스냅 기능으로 설비 전면이 OHT 레일에 자동 정렬됨
6. 실시간 거리 HUD에서 인접 설비와의 간격(상하좌우 mm) 즉시 확인
7. L7(검토) 레이어에서 최적 배치 알고리즘 실행 → Dead Space 최소화 추천 위치 표시
8. 기획안을 `가안` 상태로 저장하고, 유관 부서(기술팀, 건설팀)에 검토 요청 발송

#### 시나리오 2 — 유관 부서 검토 및 승인

1. 기술팀 검토자가 실시간 알림(이메일/시스템 알림) 수신
2. Semi-PLUS 접속 후 `[검토 요청]` 목록에서 해당 기획안 선택
3. 레이아웃 도면에서 L5(설비) + L6(배치) 레이어를 겹쳐 보며 Maintenance 공간 충분성 확인
4. 검토 의견 입력 후 `승인` 또는 `반려` 처리
5. 모든 부서(기술/건설/안전)가 승인 완료 시 최종 상태 `확정`으로 자동 전환
6. 제조 기획자에게 승인 완료 알림 발송

#### 시나리오 3 — As-is / To-be 비교 분석

1. 사내 Datalake에서 최근 3년치 실도면(As-is) 데이터 API로 자동 가져오기
2. `[버전 관리]` 화면에서 As-is 레이어와 To-be 기획안 레이어를 Overlay 표시
3. 변경 설비 객체가 색상으로 구분되어 추가/이동/제거 현황 한눈에 파악
4. 투자 구분별(신규투자/증설/대체) 필터로 시나리오 별도 비교
5. Dead Space 변화량, 총 배치 설비 수 등 KPI 자동 집계 표시

---

## 3. 핵심 기능 명세

### 3.1 대시보드 프레임워크 (Low-Code 환경)

#### 3.1.1 내비게이션 빌더

시스템 관리자는 코드 작성 없이 메뉴 구조를 구성할 수 있다.

- 대분류(GNB) / 소분류(LNB) **2단계 계층 메뉴** 구성
- 각 메뉴 항목에 아이콘, 권한 그룹, 연결 페이지 지정
- 드래그 앤 드롭으로 메뉴 순서 변경
- 역할(Role) 기반 메뉴 표시/숨김 제어
- 메뉴 변경 시 실시간 미리보기 제공

#### 3.1.2 위젯 그리드 시스템

각 페이지는 **12컬럼 그리드** 기반으로 위젯을 자유 배치한다.

| 위젯 유형 | 서브타입 | 주요 속성 |
|-----------|----------|-----------|
| 테이블 위젯 | Grid / TreeGrid | 데이터 소스, 컬럼 표시 설정, 페이지네이션, 인라인 편집, 엑셀 내보내기 |
| 차트 위젯 | Bar / Pie / Line / KPI / CrossTable | 데이터 소스, X/Y축 컬럼, Marking 그룹 연동, 색상 팔레트 |
| 레이아웃 위젯 | Canvas Viewer / Editor | FAB Bay 선택, 레이어 가시성, Marking 연동 그룹, 편집 모드 허용 여부 |
| 필터 위젯 | 드롭다운 / 날짜범위 / 검색 | 연동 위젯 그룹, 기본값, 다중선택 허용 |
| KPI 카드 | 단일 수치 / 증감율 | 계산식, 비교 기간, 임계값 색상 알림 |

---

### 3.2 데이터 엔진 (Global Data)

#### 3.2.1 Origin_Table (마스터 DB)

사용자가 직접 생성·관리하는 원천 데이터 테이블.

**컬럼 정의 시 설정 항목:**

| 설정 항목 | 옵션값 | 설명 |
|-----------|--------|------|
| 컬럼 제목 | 자유 텍스트 | 화면에 표시될 컬럼명. 영문 내부 ID와 별도 관리 |
| 데이터 타입 | `TEXT` / `NUMBER` / `DATE` / `BOOLEAN` / `FILE` | 유효성 검사 및 정렬 기준으로 활용 |
| 데이터 출처 | `Origin`(직접입력) / `Join`(참조) | Join: 다른 테이블 컬럼을 FK로 참조 (JOIN 컬럼, 매핑 키 지정) |
| 필수 여부 | 필수 / 선택 | 저장 시 유효성 검사 적용 |
| 기본값 | 고정값 / 수식 | 신규 행 추가 시 자동 입력되는 값 또는 수식 |

**엑셀 벌크 붙여넣기 (Ctrl+V) 동작 명세:**

- 클립보드 데이터를 Tab/개행 구분으로 파싱하여 셀 단위 매핑
- 컬럼 수 불일치 시: 부족한 컬럼은 빈값, 초과 컬럼은 드롭 후 경고 토스트
- 타입 불일치 셀: 해당 셀 빨간 테두리 표시 및 저장 블록
- 붙여넣기 완료 후 **미리보기 모달** 표시 → 사용자 최종 확인 후 저장
- 최대 10,000행 단위 트랜잭션으로 처리 (초과 시 분할 처리 안내)

#### 3.2.2 DB_Table (통합 뷰)

기존 Origin_Table 및 사내 Datalake 테이블을 조합한 **Read-only 뷰**.

- GUI 기반 JOIN 빌더: `FROM → JOIN 테이블 선택 → JOIN 조건(컬럼 = 컬럼)` 설정
- WHERE 조건 필터 추가 가능
- 결과 컬럼 선택 및 별칭(Alias) 지정
- 실제 실행 SQL 미리보기 제공 (Read-only 표시)
- 스케줄 새로고침: 매일 00:00 자동 갱신 또는 수동 새로고침

#### 3.2.3 GUI 수식 빌더

비개발자가 마우스 클릭만으로 계산된 컬럼을 생성하는 인터페이스.

**지원 함수 목록:**

| 카테고리 | 함수명 | 예시 |
|----------|--------|------|
| 조건 | `IF` / `ELSE IF` / `ELSE` | `IF([상태]='완료', 1, 0)` |
| 조건 | `CASE WHEN` | `CASE WHEN [투자구분]='신규' THEN '신규투자' ELSE '기타' END` |
| 집계 | `SUM` / `AVG` / `COUNT` | 파티션 컬럼 지정으로 그룹별 집계 가능 |
| 집계 | `AVG_DISTINCT` | 중복 값 제거 후 평균 계산 |
| 문자열 | `CONCAT` / `TRIM` / `LEFT` / `RIGHT` / `LEN` | 문자열 결합, 공백 제거, 부분 추출 |
| 날짜 | `DATE_DIFF` / `DATE_ADD` / `TODAY` | `DATE_DIFF([예정일], TODAY(), 'DAY')` → D-Day 계산 |
| 수식 | `ROUND` / `ABS` / `MOD` / `RANK` | 수치 연산 및 순위 계산 |

**수식 빌더 UI 동작:**

- 함수 카테고리 패널 → 함수 클릭 → 인수 입력 필드 자동 생성
- 컬럼 참조는 드롭다운에서 선택 (오타 방지)
- 수식 미리보기: 실시간 SQL 변환 결과 + 샘플 데이터 적용 결과 5행 표시
- 전역 적용: 생성된 계산 컬럼은 모든 위젯에서 일반 컬럼처럼 사용 가능
- 수식 버전 이력 관리 (최대 20개)

---

### 3.3 레이아웃 시뮬레이터

#### 3.3.1 7레이어 구조

| 레이어 | 코드명 | 역할 | 상세 명세 |
|--------|--------|------|-----------|
| **L1** | `IMG` | 시설물 베이스 | FAB 건물 도면 이미지(PNG/SVG) 최하위 레이어. 편집 불가. 축척 정보(mm/px) 저장하여 거리 계산 기준으로 활용 |
| **L2** | `영역` | 배치 가능 구역 | 설비 배치가 허용된 영역을 다각형(Polygon)으로 정의. 색상/투명도 설정. L5 설비 객체는 이 영역 밖으로 이동 불가(제약) |
| **L3** | `OHT` | 물류 레일 | OHT 레일 경로. 설비 전면부가 이 레일 라인에 스냅 정렬됨. 스냅 허용 거리: ±50px 이내 |
| **L4** | `Grid` | 600mm 가이드 | 600mm 간격 격자선 표시. 가시성 토글 가능. 설비 배치 시 600mm 단위 스냅 옵션 제공 |
| **L5** | `설비` | 실시간 연동 객체 | Origin_Table 설비 데이터 연동. 설비 크기(W×D mm), 상태(운영중/반출예정/반입예정)에 따라 색상 구분. 클릭 시 상세 패널 표시 |
| **L6** | `배치` | 사용자 마킹 | 사용자가 직접 그리는 기획 레이어. 사각형/원/텍스트/화살표 도형 지원. To-be 계획안 작성에 활용 |
| **L7** | `검토` | 알고리즘 결과 | 최적 배치 알고리즘 실행 결과 및 제약 위반 경고 표시. 추천 위치는 녹색 점선, 경고는 빨간 영역으로 표시 |

#### 3.3.2 인터랙션 명세

**드래그 앤 드롭:**
- 설비 패널에서 Canvas로 드래그: 마우스 버튼 누름 → 반투명 객체 미리보기 → 드롭 위치 확정
- Canvas 내 이동: L2 영역 벗어나면 이동 블록 + 빨간 테두리
- 다중 선택: `Shift+클릭` 또는 영역 드래그로 복수 설비 동시 이동
- 실행취소/재실행: `Ctrl+Z` / `Ctrl+Y`, 조작 이력 최대 50단계 관리

**OHT 레일 스냅 (전면부 자동 정렬):**
- 설비 배치 또는 이동 중 전면부가 OHT 레일로부터 스냅 허용 거리(기본 50px) 이내 접근 시 자동 흡착
- 스냅 발생 시 파란 정렬선(snap guide) 표시
- 스냅 강도 설정: 강/중/약/Off (사용자 환경설정)

**실시간 거리 HUD:**
- 설비 선택 또는 이동 시 상하좌우 방향으로 가장 인접한 설비(또는 벽)까지의 거리(mm) 표시
- Maintenance 공간(기본 800mm) 미만 접근 시 해당 방향 수치 **빨간색**으로 변환
- HUD 표시 형식: `화살표 + 숫자(mm)`, Canvas 좌측 상단 오버레이

#### 3.3.3 공간 최적화 알고리즘

**입력 데이터:**
- 설비 목록: 설비 ID, 크기(W×D), Maintenance 공간(기본 800mm, 개별 수정값 우선)
- 배치 가능 영역 (L2 Polygon 좌표)
- OHT 레일 위치 (L3)
- 고정 설비 (이동 불가 플래그 설정 설비)

**알고리즘 동작:**

```
Step 1: 배치 가능 영역을 600mm 그리드 셀로 분할
Step 2: 각 설비의 배치 가능 위치를 OHT 정렬 조건으로 필터링
Step 3: LP(선형 프로그래밍) 또는 Greedy 알고리즘으로 총 Dead Space 최소화
Step 4: 추천 배치 결과를 L7에 녹색 점선 사각형으로 표시
Step 5: 제약 위반(Maintenance 공간 부족, 영역 벗어남) 항목은 빨간 영역 + 경고 메시지
```

**출력:**
- 추천 배치 좌표 목록 (`설비 ID → x, y, 회전각`)
- 총 Dead Space 면적(m²) 및 면적 활용률(%) 계산 결과
- `[추천 적용]` 버튼 클릭 시 L5/L6 레이어에 설비 위치 일괄 반영
- 타임아웃: 30초 초과 시 부분 결과 반환 + 백그라운드 처리 안내

---

### 3.4 워크플로우 및 협업

#### 3.4.1 승인 상태 정의

| 상태 | 색상 | 트리거 | 설명 |
|------|------|--------|------|
| 🔘 **가안 (DRAFT)** | 회색 | 기획자 저장 | 작성 중인 초안 |
| 🔵 **검토 요청 (REVIEW_REQUESTED)** | 파랑 | 검토 요청 발송 | 유관 부서 검토 시작 |
| 🩵 **처리 중 (IN_PROGRESS)** | 하늘 | 1개 부서 이상 승인 | 일부 완료, 나머지 진행 중 |
| 🟢 **최종 승인 (APPROVED)** | 초록 | 모든 부서 승인 | 확정된 기획안 |
| 🔴 **반려 (REJECTED)** | 빨강 | 1개 부서 이상 반려 | 재수정 필요 |

#### 3.4.2 상태 전이 로직

| 현재 상태 | 트리거 이벤트 | 다음 상태 | 부가 동작 |
|-----------|--------------|-----------|-----------|
| 가안 | 검토 요청 발송 | 검토 요청 | 선택된 부서 담당자에게 이메일 + 시스템 알림 발송 |
| 검토 요청 | 1개 부서 승인 | 처리 중 | 요청자에게 진행 현황 알림, 진행 현황 바 업데이트 |
| 처리 중 | 모든 부서 승인 | **최종 승인** | 요청자에게 최종 승인 알림, 버전 이력에 확정본 스냅샷 저장 |
| 처리 중 | 1개 부서 반려 | **반려** | 요청자에게 반려 사유 포함 알림, 수정 후 재요청 가능 |
| 검토 요청 / 처리 중 | **요청자 수정/취소** | 가안 | ⚠️ 처리 중인 담당자 전원에게 실시간 알림 발송, 기존 검토 무효화 |

> **예외 처리:** 담당자가 `처리 중` 상태에서도 요청자는 수정/취소가 가능하며, 이 경우 담당자에게 실시간 알림 발송.

#### 3.4.3 알림 시스템

- **채널:** 시스템 내 알림 센터(벨 아이콘) + 이메일 (사용자 설정에 따라 선택)
- **실시간 알림:** SSE(Server-Sent Events) 기반
- **알림 유형:** 검토 요청, 승인/반려, 수정/취소, 멘션(@사용자), D-Day 리마인더
- **D-Day 리마인더:** 설비 반입 예정일 D-7, D-3, D-1 자동 알림
- **알림 발송 실패 시:** 시스템 내 알림 센터로 폴백, 재발송 큐에 등록 (최대 3회 재시도)

---

### 3.5 버전 관리

- **As-is 버전:** 사내 Datalake에서 최대 3년치 실도면 데이터 API 조회 (날짜별 스냅샷)
- **To-be 버전:** 투자 구분(신규/증설/대체/이설)별로 별도 기획안 저장
- **Overlay 비교:** As-is + To-be 동시 렌더링, 변경 설비 색상 코딩

| 변경 유형 | 표시 색상 | 아이콘 |
|-----------|-----------|--------|
| 신규 추가 (To-be 전용) | 🟢 녹색 | `+` |
| 위치 이동 | 🔵 파랑 + 화살표 | `→` |
| 제거 (As-is 전용) | 🔴 빨강 + 점선 | `✕` |
| 변경 없음 | ⬜ 회색 | `-` |

---

## 4. UI/UX 화면 설계

### 4.1 전체 화면 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────┐
│  GNB (Global Navigation Bar) - 대분류 메뉴 + 알림/프로필         │
│  높이: 60px 고정                                                 │
├──────────┬──────────────────────────────────────────────────────┤
│  LNB     │  메인 콘텐츠 영역 (12컬럼 그리드)                      │
│  240px   │  ┌──────┐ ┌──────┐ ┌──────┐                        │
│  (축소시  │  │위젯1 │ │위젯2 │ │위젯3 │                        │
│   64px)  │  └──────┘ └──────┘ └──────┘                        │
│          │  ┌─────────────────────┐ ┌────────┐                 │
│          │  │  레이아웃 위젯        │ │ 위젯4  │                 │
│          │  └─────────────────────┘ └────────┘                 │
└──────────┴──────────────────────────────────────────────────────┘
```

- 위젯 최소 크기: 2컬럼 × 2행 / 사용자 리사이즈 가능
- 컬럼당 최소 80px

### 4.2 주요 화면 설계

#### 4.2.1 메인 대시보드

```
[KPI 카드 행]  총 설비 수 | 반입 예정 D-30 이내 | Dead Space 면적 | 진행 중 기획안 수
[레이아웃 위젯 8컬럼]  현재 FAB Bay 도면 Viewer + 레이어 토글 패널
[사이드 4컬럼]  최근 활동 로그 + 알림 목록
[테이블 위젯]  반입/반출 예정 설비 목록 (30일 내)
```

#### 4.2.2 레이아웃 에디터

```
┌──────────────┬──────────────────────────────┬──────────────┐
│ 레이어 패널   │  Canvas (7레이어 렌더링)        │  속성 패널   │
│ ────────────│                               │ ──────────── │
│ ☑ L1 IMG    │                               │ [선택 설비]   │
│ ☑ L2 영역   │  → 드래그 앤 드롭              │  상세 정보   │
│ ☑ L3 OHT   │  → 거리 HUD (mm)              │             │
│ ☑ L4 Grid  │  → OHT 스냅 정렬              │ Maint. 공간  │
│ ☑ L5 설비   │                               │ [개별 설정]  │
│ ☑ L6 배치   │                               │             │
│ ☑ L7 검토   │  줌: ──●── (10%~400%)         │ [최적화 실행] │
│ ────────────│                               │             │
│ [설비 목록]  │                               │             │
└──────────────┴──────────────────────────────┴──────────────┘

상단 툴바: 선택/이동/도형/텍스트 도구 | 줌 컨트롤 | Ctrl+Z / Ctrl+Y
하단 상태바: 현재 줌 배율 | 마우스 좌표(mm) | 선택 설비 수
```

#### 4.2.3 데이터 관리 화면 (Origin_Table)

```
상단: [테이블 선택 ▼] [새 테이블 생성] [컬럼 관리] [데이터 가져오기(Ctrl+V/CSV)]
메인: 인라인 편집 가능 데이터 그리드 (고정 헤더, 가로 스크롤)
      └─ 셀 우클릭 컨텍스트 메뉴: 행 추가, 행 삭제, 값 복사, 이 값으로 필터
하단: 총 행 수 | 선택 행 수 | 마지막 수정 일시
```

#### 4.2.4 워크플로우 관리

```
[내가 요청한 기획안] [내가 검토할 항목]  ← 탭 전환

상태 필터 칩: 전체 | 가안 | 검토요청 | 처리중 | 최종승인 | 반려

목록 클릭 → 상세 슬라이드 패널:
  ├─ 기획안 요약
  ├─ 검토 부서 진행 현황 바 (기술팀 ✅ / 건설팀 ⏳ / 안전팀 ❌)
  ├─ 의견 스레드
  └─ [도면 보기] 버튼 → 레이아웃 에디터 Read-only 모드
```

### 4.3 위젯 공통 UX 규칙

| 규칙 | 상세 |
|------|------|
| Marking 연동 | 동일 Marking 그룹 위젯 간 클릭 선택 시 상호 필터링 (100ms 이내 반응) |
| 로딩 상태 | 스켈레톤 UI 표시 (빈 화면 대신) |
| Empty State | 데이터 없음 시 아이콘 + 안내 문구 + `[데이터 추가]` 버튼 |
| 에러 상태 | 에러 아이콘 + 메시지 + `[재시도]` 버튼 |
| 위젯 헤더 | 제목, 마지막 갱신 시각, 설정 아이콘(⋮) |

---

## 5. 데이터베이스 스키마 및 API 설계

### 5.1 핵심 테이블 스키마

#### `users` — 사용자

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     VARCHAR(20)  UNIQUE NOT NULL,     -- 사번
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(200) UNIQUE NOT NULL,
  department      VARCHAR(100),
  role            ENUM('ADMIN','PLANNER','REVIEWER','VIEWER') NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMP
);
```

#### `equipment` — 설비 마스터

```sql
CREATE TABLE equipment (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_no          VARCHAR(50)  UNIQUE NOT NULL,   -- 장비 번호
  name                  VARCHAR(200) NOT NULL,           -- 설비명
  model                 VARCHAR(200),
  width_mm              INTEGER NOT NULL,               -- 설비 폭 (mm)
  depth_mm              INTEGER NOT NULL,               -- 설비 깊이 (mm)
  height_mm             INTEGER,
  maintenance_space_mm  INTEGER NOT NULL DEFAULT 800,   -- Maintenance 공간
  status                ENUM('OPERATING','PLANNED_IN','PLANNED_OUT','REMOVED') NOT NULL,
  planned_in_date       DATE,                           -- 반입 예정일
  planned_out_date      DATE,                           -- 반출 예정일
  investment_type       ENUM('NEW','EXPANSION','REPLACEMENT','RELOCATION'),
  fab_bay_id            UUID REFERENCES fab_bays(id),
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `layout_plans` — 레이아웃 기획안

```sql
CREATE TABLE layout_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200) NOT NULL,
  fab_bay_id        UUID NOT NULL REFERENCES fab_bays(id),
  investment_type   ENUM('NEW','EXPANSION','REPLACEMENT','RELOCATION'),
  status            ENUM(
                      'DRAFT',
                      'REVIEW_REQUESTED',
                      'IN_PROGRESS',
                      'APPROVED',
                      'REJECTED'
                    ) NOT NULL DEFAULT 'DRAFT',
  canvas_snapshot   JSONB,           -- 레이아웃 캔버스 상태 전체 JSON
  created_by        UUID NOT NULL REFERENCES users(id),
  version           INTEGER NOT NULL DEFAULT 1,
  parent_version_id UUID REFERENCES layout_plans(id),  -- 이전 버전 참조
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `approval_requests` — 승인 요청

```sql
CREATE TABLE approval_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES layout_plans(id),
  reviewer_id  UUID NOT NULL REFERENCES users(id),
  department   VARCHAR(100),
  status       ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  comment      TEXT,
  reviewed_at  TIMESTAMP,
  notified_at  TIMESTAMP
);
```

#### `equipment_placements` — 설비 배치 좌표

```sql
CREATE TABLE equipment_placements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES layout_plans(id),
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  x            FLOAT NOT NULL,    -- Canvas X 좌표 (px)
  y            FLOAT NOT NULL,    -- Canvas Y 좌표 (px)
  rotation     FLOAT DEFAULT 0,   -- 회전각 (degree)
  layer        VARCHAR(10) NOT NULL DEFAULT 'L5',
  is_fixed     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `audit_log` — 감사 로그

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,   -- CREATE / UPDATE / DELETE / STATUS_CHANGE
  target_type VARCHAR(50)  NOT NULL,   -- equipment / layout_plan / approval_request
  target_id   UUID         NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

### 5.2 API 설계

#### 5.2.1 공통 규칙

```
Base URL:     /api/v1
인증:         Authorization: Bearer <access_token>
Content-Type: application/json

응답 형식:
{
  "success": boolean,
  "data": T | null,
  "error": { "code": string, "message": string } | null,
  "meta": { "total": number, "page": number, "limit": number } | null
}

페이지네이션: ?page=1&limit=20&sort=created_at&order=desc
```

#### 5.2.2 주요 엔드포인트

**설비 (Equipment)**

| Method | Endpoint | 설명 | 주요 파라미터 |
|--------|----------|------|--------------|
| `GET` | `/equipment` | 설비 목록 조회 | `?status, investment_type, fab_bay_id, search` |
| `POST` | `/equipment` | 설비 등록 | Body: equipment_no, name, width_mm, depth_mm 등 |
| `PATCH` | `/equipment/:id` | 설비 정보 수정 | Body: 수정할 필드만 (Partial Update) |
| `DELETE` | `/equipment/:id` | 설비 삭제 (소프트) | status → REMOVED |
| `POST` | `/equipment/bulk` | 엑셀 벌크 업로드 | Body: `rows[]` → 응답: `{ success_count, error_rows }` |

**레이아웃 기획안 (Layout Plans)**

| Method | Endpoint | 설명 | 주요 파라미터 |
|--------|----------|------|--------------|
| `GET` | `/layout-plans` | 기획안 목록 | `?status, fab_bay_id, created_by, date_range` |
| `POST` | `/layout-plans` | 기획안 생성 | Body: title, fab_bay_id, investment_type |
| `GET` | `/layout-plans/:id` | 기획안 상세 | canvas_snapshot 포함 |
| `PUT` | `/layout-plans/:id/canvas` | Canvas 상태 저장 | Body: `canvas_snapshot` JSON (전체 교체) |
| `POST` | `/layout-plans/:id/request-review` | 검토 요청 발송 | Body: `reviewer_ids[], departments[]` |
| `GET` | `/layout-plans/:id/versions` | 버전 이력 조회 | 버전번호, 생성일, 작성자 목록 |

**승인 처리 (Approvals)**

| Method | Endpoint | 설명 | 주요 파라미터 |
|--------|----------|------|--------------|
| `POST` | `/approval-requests/:id/approve` | 승인 처리 | Body: `{ comment }` |
| `POST` | `/approval-requests/:id/reject` | 반려 처리 | Body: `{ comment }` (필수) |

**레이아웃 최적화**

| Method | Endpoint | 설명 | 주요 파라미터 |
|--------|----------|------|--------------|
| `POST` | `/layout/optimize` | 최적 배치 알고리즘 실행 | Body: `fab_bay_id, equipment_ids[], constraints` |
| `GET` | `/datalake/as-is` | As-is 실도면 조회 | `?fab_bay_id, date` (스냅샷 일자) |

**알림**

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/notifications` | 알림 목록 (`?unread_only`) |
| `PATCH` | `/notifications/:id/read` | 읽음 처리 |
| `GET` | `/notifications/stream` | SSE 실시간 알림 스트림 |

---

### 5.3 데이터 레이어 추상화 (Mock ↔ Real API)

```typescript
// src/services/data/DataService.abstract.ts
abstract class DataService {
  abstract getEquipment(filters: EquipmentFilter): Promise<Equipment[]>
  abstract createEquipment(data: CreateEquipmentDto): Promise<Equipment>
  abstract bulkCreateEquipment(rows: any[]): Promise<BulkResult>
  abstract getLayoutPlans(filters: PlanFilter): Promise<LayoutPlan[]>
  abstract saveCanvasSnapshot(planId: string, snapshot: CanvasSnapshot): Promise<void>
  abstract requestReview(planId: string, reviewers: ReviewerDto[]): Promise<void>
  abstract approveRequest(requestId: string, comment: string): Promise<void>
  abstract getNotifications(): Promise<Notification[]>
  abstract streamNotifications(callback: (n: Notification) => void): () => void
}

// 환경변수로 런타임 전환
// .env.development  → VITE_DATA_MODE=mock
// .env.production   → VITE_DATA_MODE=real

const dataService: DataService =
  import.meta.env.VITE_DATA_MODE === 'mock'
    ? new MockDataService()          // JSON fixture + 200ms 지연 시뮬레이션
    : new RealDataService({
        baseURL: import.meta.env.VITE_API_BASE_URL,
        getToken: () => authStore.getAccessToken(),
        // 사내 Datalake: bigdataquery 라이브러리 + 인증 토큰
      })

export default dataService
```

---

## 6. 기술 스택 및 보안 제약사항

### 6.1 기술 스택

#### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.x | 컴포넌트 기반 UI |
| TypeScript | 5.x | 타입 안전성 |
| Vite | 5.x | 빌드 도구, 환경변수 기반 모드 전환 |
| Zustand | 4.x | 전역 상태 관리 (Marking 상태, 레이아웃 상태) |
| TanStack Query | 5.x | 서버 상태 관리, 캐싱, 리패칭 |
| Konva.js + react-konva | 최신 | 7레이어 Canvas 렌더링, 드래그 앤 드롭, HUD |
| Apache ECharts | 5.x | Bar / Pie / Line / KPI / CrossTable 차트 |
| AG Grid Community | 최신 | 고성능 테이블, 인라인 편집, 벌크 붙여넣기 |

#### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.x LTS | 런타임 |
| Fastify | 4.x | REST API 서버, SSE 알림 스트림 |
| TypeScript | 5.x | 타입 일관성 |
| Prisma | 5.x | 타입 안전 ORM, 마이그레이션 관리 |
| PostgreSQL | 15.x | 메인 DB (JSONB, 트랜잭션) |
| Redis | 7.x | 세션, 알림 큐, 빈번 조회 캐싱 |

#### 인프라 / 연동

| 기술 | 용도 |
|------|------|
| Docker + Docker Compose | 외부 개발 환경 표준화 및 사내망 이관 |
| JWT (access 1h + refresh 7d) | 인증 (사내 SSO 연동 가능 구조) |
| `bigdataquery` (사내 라이브러리) | Datalake As-is 도면 데이터 조회 |
| GitHub Actions → Jenkins | 외부 CI/CD → 사내 CI/CD 파이프라인 분리 |

---

### 6.2 보안 제약사항

#### RBAC 권한 매트릭스

| 기능 | ADMIN | PLANNER | REVIEWER | VIEWER |
|------|:-----:|:-------:|:--------:|:------:|
| 메뉴/위젯 구성 | ✅ | ❌ | ❌ | ❌ |
| Origin_Table 생성/수정 | ✅ | ✅ | ❌ | ❌ |
| 레이아웃 기획안 작성 | ✅ | ✅ | ❌ | ❌ |
| 검토 요청 발송 | ✅ | ✅ | ❌ | ❌ |
| 승인/반려 처리 | ✅ | ✅(담당 건) | ✅(담당 건) | ❌ |
| 데이터 조회 | ✅ | ✅ | ✅ | ✅ |
| 사용자 관리 | ✅ | ❌ | ❌ | ❌ |

#### 보안 구현 규칙

```
인증:       JWT Bearer Token + Refresh Token (HttpOnly Cookie, SameSite=Strict)
SQL 인젝션: Prisma ORM 파라미터 바인딩 — Raw Query 최소화
XSS:        React DOM 이스케이핑 + DOMPurify로 사용자 입력 정제
CSRF:       SameSite=Strict 쿠키 + CSRF 토큰 헤더
감사 로그:  설비 생성/수정/삭제, 기획안 상태 변경 전체 audit_log 기록
HTTPS:      사내망 내부도 TLS 적용 권고
```

#### 사내망 이관 체크리스트

```
☐ Docker 이미지 → 사내 Harbor(사설 Registry)로 이관
☐ npm 패키지 → Nexus 미러 또는 npm-offline-cache 구성
☐ 환경변수 → .env.external / .env.internal 분리, 민감정보 사내 KMS 관리
☐ API 엔드포인트 → VITE_API_BASE_URL로 외부(localhost) ↔ 사내 서버 전환
☐ bigdataquery → 외부 개발 시 Mock 인터페이스, 사내 이관 시 실제 라이브러리 교체
☐ SSO/LDAP → 사내 인증 시스템 연동 (JWT 발급 구조 사전 설계)
```

---

## 7. 예외 케이스 처리 및 개발 로드맵

### 7.1 예외 케이스 처리

#### 7.1.1 데이터 엔진 예외

| 예외 상황 | 발생 조건 | 처리 방안 |
|-----------|-----------|-----------|
| 벌크 붙여넣기 타입 불일치 | NUMBER 컬럼에 문자 데이터 | 해당 셀 빨간 테두리, 저장 버튼 비활성화, 오류 행 목록 모달 |
| JOIN 컬럼 키 없음 | 참조 테이블에 매핑 키 값이 없는 행 | NULL 처리 후 경고 배너, null_safe 설정 제공 |
| 수식 순환 참조 | 계산 컬럼이 서로를 참조 | 저장 시 순환 탐지 로직 실행, 오류 메시지와 함께 저장 차단 |
| Datalake API 연결 실패 | 사내 Datalake 응답 없음 | 캐시된 마지막 데이터 표시 + 연결 실패 배너 + 수동 재시도 버튼 |
| 대용량 벌크 입력 | 10,000행 초과 붙여넣기 | 5,000행 단위 분할 처리 안내 모달 + 진행률 표시 |

#### 7.1.2 레이아웃 시뮬레이터 예외

| 예외 상황 | 발생 조건 | 처리 방안 |
|-----------|-----------|-----------|
| 배치 가능 영역 벗어남 | L2 Polygon 외부로 설비 드롭 | 드롭 차단 + 빨간 테두리 + `배치 불가 영역` 툴팁 |
| Maintenance 공간 충돌 | 인접 설비와 800mm 미만 간격 | HUD 수치 빨간색 + L7 충돌 영역 표시 + 경고 토스트 (저장은 허용) |
| OHT 스냅 미정렬 | 레일 없는 위치에 배치 | 경고 표시하되 배치는 허용 (스냅 강제 아님) |
| 설비 크기 미등록 | width_mm / depth_mm 없는 설비 드래그 | 기본 크기 1000×1000 임시 적용 + `크기 미등록` 경고 |
| Canvas 저장 충돌 | 동시에 2인이 같은 기획안 편집 | Optimistic Locking (수정 시각 비교), 충돌 감지 시 병합 다이얼로그 |
| 최적화 알고리즘 타임아웃 | 설비 200개 초과 등 고부하 | 30초 타임아웃 후 부분 결과 반환 + 백그라운드 처리 안내 |

#### 7.1.3 워크플로우 예외

| 예외 상황 | 처리 방안 |
|-----------|-----------|
| 요청자 수정 중 담당자 처리 완료 (경합) | 요청자 수정이 최종 우선, 담당자에게 `기획안 변경` 알림 + 기존 검토 무효화 |
| 담당자 부재 (장기 휴가) | D+5 리마인더 → D+10 상위 관리자 에스컬레이션 알림 |
| 모든 부서 반려 | 모든 반려 의견 통합 표시, 수정 후 재요청 가능 |
| 알림 발송 실패 | 시스템 내 알림 센터로 폴백, 재발송 큐 등록 (최대 3회 재시도) |

---

### 7.2 단계별 개발 로드맵

#### Phase 1 — 핵심 데이터 + 기본 레이아웃 (M1~M4)

> **목표:** MVP — 데이터 통합 DB + 기본 Canvas 도면 조회

```
M1: 프로젝트 셋업 + 인프라
  ├─ React + TypeScript + Vite 프로젝트 초기화
  ├─ Node.js + Prisma + PostgreSQL 환경 구성
  ├─ Docker Compose 개발 환경 세팅
  ├─ 데이터 레이어 추상화 (Mock/Real) 설계 및 구현
  └─ 인증 시스템 (JWT) + RBAC 기본 구현

M2: Origin_Table + 기본 UI
  ├─ 대시보드 프레임워크 (GNB/LNB + 12컬럼 그리드)
  ├─ Origin_Table CRUD (엑셀 벌크 붙여넣기 포함)
  ├─ 기본 테이블 위젯 구현
  └─ 사용자 관리 화면

M3: 레이아웃 Viewer (L1~L5)
  ├─ Konva.js 캔버스 초기화 + 7레이어 구조
  ├─ L1(IMG) 도면 이미지 렌더링 + 축척 정보
  ├─ L2(영역) Polygon 정의 + L3(OHT) 레일 표시
  ├─ L4(Grid) 600mm 가이드 그리드
  └─ L5(설비) 설비 객체 데이터 연동 렌더링

M4: Phase 1 통합 테스트 + 버그 수정
  ├─ 단위 테스트 + 통합 테스트 작성
  ├─ Canvas 렌더링 성능 최적화 (60fps 목표)
  └─ 사내망 이관 리허설
```

#### Phase 2 — 시뮬레이터 + 워크플로우 (M5~M8)

> **목표:** 핵심 기능 완성 — 드래그 배치 + 협업 승인

```
M5: 레이아웃 에디터 인터랙션
  ├─ 드래그 앤 드롭 (설비 패널 → Canvas)
  ├─ OHT 레일 스냅 (전면부 자동 정렬)
  ├─ 실시간 거리 HUD (상하좌우 mm 표시)
  ├─ L6(배치) 사용자 마킹 레이어 (도형, 텍스트)
  └─ 실행취소/재실행 (50단계)

M6: 워크플로우 + 알림
  ├─ 기획안 상태 관리 (DRAFT → APPROVED 전체 흐름)
  ├─ 승인 요청/승인/반려 API + UI
  ├─ SSE 기반 실시간 알림
  ├─ 이메일 알림 연동
  └─ 워크플로우 관리 화면

M7: 공간 최적화 + 버전 관리
  ├─ L7(검토) 레이어 + 최적 배치 알고리즘
  ├─ Dead Space 계산 및 시각화
  ├─ 버전 이력 관리 (스냅샷 저장/조회)
  └─ As-is (Datalake) + To-be Overlay 비교

M8: Phase 2 통합 테스트
  ├─ E2E 테스트 (Playwright) 주요 시나리오 커버
  ├─ 부하 테스트 (설비 500개 Canvas 렌더링 성능)
  └─ 보안 점검 (OWASP Top 10)
```

#### Phase 3 — 분석 기능 + 사내망 이관 (M9~M12)

> **목표:** Web-Spotfire 분석 기능 + 사내망 완전 이관

```
M9: Web-Spotfire 차트 위젯
  ├─ ECharts 기반 Bar / Pie / Line / KPI 위젯
  ├─ CrossTable (피벗 테이블) 위젯
  ├─ Marking 연동 (차트 ↔ 차트 ↔ 레이아웃 상호 필터)
  └─ GUI 수식 빌더 (계산된 컬럼)

M10: DB_Table + 고급 데이터 엔진
  ├─ DB_Table GUI JOIN 빌더
  ├─ 스케줄 자동 갱신
  ├─ 내비게이션 빌더 (관리자 메뉴 구성 도구)
  └─ 위젯 설정 저장/불러오기

M11: 사내망 이관 + 성능 최적화
  ├─ 사내 Harbor에 Docker 이미지 배포
  ├─ bigdataquery 실제 연동 테스트
  ├─ 사내 SSO/LDAP 인증 연동
  ├─ Redis 캐싱 레이어 최적화
  └─ 장애 복구 시나리오 테스트

M12: 안정화 + 사용자 교육
  ├─ 파일럿 사용자 베타 테스트 (기획팀 5명)
  ├─ 피드백 기반 UI/UX 개선
  ├─ 사용자 매뉴얼 및 운영 가이드 작성
  └─ 전사 롤아웃 준비
```

---

### 7.3 성능 목표 (NFR)

| 항목 | 목표 지표 | 측정 방법 |
|------|-----------|-----------|
| 페이지 초기 로드 | LCP ≤ 2.5초 (P95) | Lighthouse |
| Canvas 렌더링 (설비 500개) | 60fps 유지 | Chrome DevTools Performance |
| API 응답 시간 (일반 조회) | ≤ 300ms (P95) | APM 모니터링 |
| API 응답 시간 (최적화 알고리즘) | ≤ 30초 | 비동기 처리 + 진행률 표시 |
| 동시 사용자 | 100명 동시 접속 | 부하 테스트 (k6) |
| 알림 지연 (SSE) | ≤ 1초 | 실시간 스트림 지연 측정 |
| Marking 연동 반응 시간 | ≤ 100ms | 상호작용 성능 테스트 |

---

## 8. 부록

### 8.1 용어 정의

| 용어 | 정의 |
|------|------|
| **FAB** | Fabrication Plant. 반도체 웨이퍼를 생산하는 공장 시설 |
| **FAB Bay** | FAB 내 특정 공정 구역 단위 |
| **OHT** | Overhead Hoist Transport. 천장 레일을 따라 이동하는 자동 물류 시스템 |
| **Dead Space** | 설비 유지보수 공간 등으로 인해 활용할 수 없는 빈 공간 |
| **As-is** | 현재 실제 FAB에 설치되어 있는 설비 배치 현황 |
| **To-be** | 기획 중인 미래 설비 배치 계획안 |
| **Marking** | 차트 또는 도면에서 특정 요소를 선택하여 연동 위젯을 동기 필터링하는 기능 |
| **Overlay** | As-is와 To-be 레이어를 동시에 겹쳐 표시하는 기능 |
| **Maintenance 공간** | 설비 점검·수리를 위해 설비 주변에 확보해야 하는 최소 이격 거리 (기본 800mm) |
| **투자 구분** | 신규 / 증설 / 대체 / 이설 등 설비 반입 목적 분류 |
| **bigdataquery** | 사내 Datalake 조회를 위한 사내 개발 라이브러리 |
| **RBAC** | Role-Based Access Control. 역할 기반 접근 제어 |
| **SSE** | Server-Sent Events. 서버에서 클라이언트로 단방향 실시간 데이터 전송 |

### 8.2 Claude Code 사용 가이드

이 문서는 Claude Code에서 다음과 같이 활용할 수 있습니다.

```bash
# 프로젝트 루트에 배치
cp SEMIPLUS_PRD.md /your-project/CLAUDE.md

# 또는 Claude Code 실행 시 참조
claude --context SEMIPLUS_PRD.md "Phase 1 M1 작업을 시작해줘"
```

**추천 작업 흐름:**

1. `CLAUDE.md`로 저장하여 프로젝트 루트에 배치 (Claude Code가 자동 참조)
2. Phase 별로 작업 지시: `"Phase 1 M2의 Origin_Table CRUD API를 구현해줘"`
3. 특정 기능 구현 시 섹션 참조: `"3.3.2 인터랙션 명세 기반으로 OHT 스냅 기능 구현해줘"`

### 8.3 변경 이력

| 버전 | 일자 | 내용 |
|------|------|------|
| v1.0.0 | 2025-07 | 최초 작성 (7개 섹션 전체) |

---

*Semi-PLUS PRD — Confidential / 사내 배포용*
