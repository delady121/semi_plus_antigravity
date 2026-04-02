# CLAUDE.md — Semi-PLUS 개발 참조 문서

> Claude Code가 항상 참조하는 개발 규칙 및 현재 상태 문서  
> PRD 전체 내용은 `/prd/SEMIPLUS_PRD.md` 참조

---

## 1. 프로젝트 현황

```
시스템명:     Semi-PLUS (반도체 FAB 레이아웃 및 협업 통합 시스템)
개발 환경:    외부(로컬) 개발 → 추후 사내망 이관 예정
현재 상태:    초기 개발본 존재 (ANTIGRVITY 디자인 적용 완료)
데이터 모드:  Mock 데이터 사용 중 (사내망 이관 전까지 유지)
```

---

## 2. 프로젝트 구조

```
클로드코드_업무시스템/
├── .claude/
│   └── settings.local.json
├── prd/
│   └── SEMIPLUS_PRD.md          ← 전체 기획 PRD (참조용)
└── semiplus/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── dashboard/       ← 대시보드 위젯 컴포넌트
    │   │   │   ├── ActivityFeed.tsx
    │   │   │   ├── EquipmentStatusChart.tsx
    │   │   │   ├── KpiCard.tsx
    │   │   │   ├── MiniLayoutViewer.tsx
    │   │   │   └── ScheduledEquipmentTable.tsx
    │   │   ├── equipment/
    │   │   ├── layout/          ← 공통 레이아웃 (GNB/LNB)
    │   │   │   ├── GNB.tsx
    │   │   │   ├── LNB.tsx
    │   │   │   └── PageLayout.tsx
    │   │   ├── layout-editor/   ← 레이아웃 에디터 컴포넌트
    │   │   │   ├── EditorCanvas.tsx
    │   │   │   ├── EditorToolbar.tsx
    │   │   │   ├── LayerPanel.tsx
    │   │   │   └── PropertiesPanel.tsx
    │   │   └── workflow/
    │   │       └── PlanCard.tsx
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── DashboardPage.tsx
    │   │   ├── DataManagementPage.tsx
    │   │   ├── LayoutEditorPage.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── SettingsPage.tsx
    │   │   └── WorkflowPage.tsx
    │   ├── services/
    │   │   └── mockData.ts      ← Mock 데이터 (사내망 이관 시 교체 대상)
    │   ├── stores/
    │   │   ├── authStore.ts
    │   │   ├── layoutEditorStore.ts
    │   │   ├── notificationStore.ts
    │   │   └── workflowStore.ts
    │   └── types/
    │       └── index.ts
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## 3. 사내망 이관 대비 설계 원칙 ⚠️ 필수 준수

> 모든 기능 구현 시 아래 원칙을 반드시 따를 것

### 3.1 데이터 레이어 추상화

```
외부 개발 환경          사내망 이관 후
─────────────────       ─────────────────────────
Mock 데이터         →   사내 DB / API 연결
로컬 인증           →   사내 SSO / LDAP
로컬 API            →   사내 Datalake (bigdataquery)
```

- 모든 데이터 호출은 `src/services/` 를 통해서만 이루어져야 함
- 컴포넌트에서 직접 데이터를 하드코딩하지 말 것
- 환경변수 `VITE_DATA_MODE=mock | real` 로 전환 가능하도록 구현

### 3.2 환경변수 관리

```
.env.development   →   VITE_DATA_MODE=mock (현재)
.env.production    →   VITE_DATA_MODE=real (사내망 이관 시)
VITE_API_BASE_URL  →   사내망 이관 시 사내 서버 주소로 교체
```

### 3.3 사내망 이관 시 교체 대상 파일

```
src/services/mockData.ts      → 실제 API 서비스로 교체
src/stores/authStore.ts       → 사내 SSO/LDAP 연동으로 교체
.env.development              → .env.production 으로 전환
```

---

## 4. 수정 및 구현 요구사항

### 4.1 네비게이션 바 (GNB/LNB)

**관련 파일:** `src/components/layout/GNB.tsx`, `src/components/layout/LNB.tsx`

**현재 문제:**
- 대분류 메뉴(대시보드, 레이아웃, 데이터관리) 클릭 시 하부 세부 메뉴 편집 불가

**구현 요구사항:**
- 각 대분류 메뉴마다 **메뉴 편집 기능** 추가
- 편집 기능을 통해 대분류 하부에 속할 세부 메뉴 항목을 사용자가 직접 구성 가능
- 세부 메뉴 항목 클릭 시 해당 기능 화면으로 이동

---

### 4.2 데이터 관리 기능

**관련 파일:** `src/pages/DataManagementPage.tsx`

#### 4.2.1 테이블 유형 3가지

사용자가 신규 테이블 생성 시 아래 3가지 유형 중 선택:

**① Origin 테이블 (사용자 직접 생성)**
- 사용자가 컬럼 제목과 타입을 직접 정의
- 컬럼 유형 3가지:
  - `사용자 기입`: 사용자가 직접 셀 값 입력/편집 가능
  - `JOIN 컬럼`: 업무 시스템 내 다른 테이블과 JOIN하여 생성
  - `계산된 컬럼`: Spotfire 방식의 수식 기반 자동 계산 컬럼
- 테이블 생성 후 편집 기능:
  - 사용자 기입 유형 셀만 편집 가능
  - 엑셀 복사 붙여넣기(Ctrl+V) 지원
  - 저장 시 **변경 사유 입력 팝업** 표시
  - 변경 이력(History) 기록: 누가 / 언제 / 어떤 사유로 변경했는지 저장

**② 사내 데이터 연결 테이블 (API 연동)**
- 테이블 편집 기능에서 유형을 `사내 data`로 선택
- 연결된 API 중 불러올 테이블 선택
- SQL 쿼리로 컬럼 및 조건 직접 작성하여 데이터 조회
- 업무 시스템 내 기존 테이블과 JOIN으로 컬럼 추가 가능
- ⚠️ 사내망 이관 전: Mock API로 구현, 이관 후 실제 사내 API로 교체

**③ 기존 테이블 조합 테이블**
- BASE 테이블 선택 후 표시할 컬럼 선택
- 특정 컬럼 기준으로 다른 테이블의 컬럼 JOIN으로 추가
- 계산된 컬럼 추가 가능
- 전체 Read-only (직접 편집 불가)

---

### 4.3 레이아웃 기능

**관련 파일:**
- `src/pages/LayoutEditorPage.tsx`
- `src/components/layout-editor/EditorCanvas.tsx`
- `src/components/layout-editor/EditorToolbar.tsx`
- `src/components/layout-editor/LayerPanel.tsx`
- `src/components/layout-editor/PropertiesPanel.tsx`
- `src/stores/layoutEditorStore.ts`

#### 4.3.1 레이아웃 메뉴 구조 변경

**현재 문제:**
- 레이아웃 메뉴 클릭 시 바로 편집 화면으로 진입
- 레이아웃 편집 시 GNB/LNB 등 주변 UI가 모두 사라짐

**구현 요구사항:**
- 레이아웃 메뉴 클릭 → **레이아웃 목록 화면** 표시
- 레이아웃 관리 버튼으로 신규 레이아웃 생성 및 제목 설정
- 생성된 레이아웃이 하부 세부 메뉴로 표시 (예: 1라인, 2라인, 3라인)
- 레이아웃 편집 중에도 GNB/LNB 유지 (전체 화면 모드 제거)

#### 4.3.2 레이아웃 초기 편집 프로세스 (순서 준수)

```
Step 1. 레이아웃 관리에서 신규 레이아웃 생성 및 제목 설정
Step 2. 생성된 레이아웃 항목 선택 → 편집 기능 진입
Step 3. 배경 이미지 파일 업로드 (PNG/SVG)
Step 4. 축척 설정
        - 이미지 위 두 지점을 클릭하여 선택
        - 두 지점 사이의 실제 거리(mm) 입력
        - 정확도를 위해 위 과정을 3회 반복 실행
        - 3회 입력값의 평균으로 최종 축척비(mm/px) 계산
Step 5. 600mm 기준 격자 Grid 자동 생성 (축척비 적용)
Step 6. 설비 배치 영역 지정
        - 사용자가 드래그로 사각형 영역 생성
        - 설비 배치 가능 구역으로 표기
Step 7. OHT 레일 그리기
        - 사용자가 직접 선을 그려서 OHT 레일 경로 지정
        - 선 그리기 시 45도 단위 스냅핑 적용
Step 8. 설비 레이어 설정 (데이터 연동)
        - 업무 시스템 내 테이블 선택
        - 필수 컬럼 5가지 지정:
            · Xmax 컬럼
            · Xmin 컬럼
            · Ymax 컬럼
            · Ymin 컬럼
            · EQP_ID 컬럼
        - 추가 컬럼 지정 (도면 위 표기용, 선택사항)
Step 9. 시설물 레이어 설정 (데이터 연동)
        - 기둥, 계단실, 기타 시설물 레이어
        - 테이블 선택 후 컬럼 지정:
            · Xmax / Xmin / Ymax / Ymin 컬럼
            · 명칭 컬럼 (시설물 이름 표기)
Step 10. 사용자 정의 레이어 추가 (선택사항)
         - + 버튼으로 레이어 추가
         - 레이어 이름 사용자 직접 지정
Step 11. 저장 후 레이아웃 일반 보기 화면으로 전환
```

#### 4.3.3 반입 가능/불가 영역 지정 레이어

> ⚠️ 초기 편집 과정에서 생성되는 레이어가 아님  
> 편집 완료 후 **관리 상황**에서 별도로 설정하는 레이어

- 드래그로 영역 지정 후 반입 가능/불가 속성 설정
- 설정 요소는 사용자가 **+ 버튼**으로 직접 추가:
  - + 버튼 클릭 → 업무 시스템 내 테이블 선택 → 컬럼 선택
  - 선택한 컬럼의 고유값(중복 제거)이 선택 항목으로 자동 설정
- 각 요소 선택 시 **드롭박스 + 검색어 필터링** 방식:
  - 예시: ROOM 항목에서 `C` 입력 시 → CLN, CVD, CMP만 표시
- 기본 제공 요소 예시 (사용자 추가 가능):
  - ROOM: CLN, CVD, CMP, ETCH, DIFF, METAL, PHOTO, METRO, IMP
  - PRC, MODEL, Chemical, S-Gas, 배기, 폐수 등
- 이 레이어 데이터는 **최적화 배치 검토 기능**과 연동

#### 4.3.4 레이아웃 일반 보기 화면 (우측 기능 패널)

편집 완료 후 일반 사용자가 보는 화면. 도면 우측에 기능 패널 배치.

**기능 유형 구분:**

| 유형 | 설명 |
|------|------|
| 기본 기능 | 별도 편집 없이 기본 작동 |
| 사용자 정의 기능 | 편집 화면에서 기능을 직접 정의 |

**기본 기능 목록:**

① **설비 검색**
- 설비명 또는 EQP_ID로 검색
- 검색 결과 해당 설비 위치로 자동 Zoom In

② **설비 구분 표기**
- 설비 리스트 입력 (엑셀 단일 컬럼 다중 행 붙여넣기 지원)
- 선택한 색상으로 해당 설비 표기 (테두리 또는 색칠 선택 가능)
- 최대 5개 색 구분 그룹 생성
- 드래그 앤 드롭으로 그룹 순서 변경
- 여러 그룹에 중복된 설비는 순서 우선순위로 색상 결정

③ **날짜 선택 (연월 슬라이드바)**
- 연/월 슬라이드바로 날짜 선택
- 선택 날짜 기준 설비 반출입 계획 시각화:

  | 상태 | 표시 방식 |
  |------|-----------|
  | 반입 전 | 초록색 테두리 + 설비명 + 반입 예정일 |
  | 반출 이후 | 회색 반투명 박스 + 설비명 + 반출 일정 |
  | 반출입 정보 없음 / 반입 후 반출 전 (정상) | 진한 하늘색 테두리 + 하늘색 채색 + 설비명 + 반입일 + 반출일 |

④ **최적화 배치 검토** (추후 상세 설명 예정)

**사용자 정의 기능:**
- 도면 위 개체 선택 시 연동 데이터 표기 (테이블 또는 그래프)
- 도면 위 개체 그룹화 표기
- 편집 화면에서 기능 직접 정의

---

### 4.4 대시보드 기능

**관련 파일:** `src/pages/DashboardPage.tsx`, `src/components/dashboard/`

#### 4.4.1 대시보드 메뉴 구조

- 대시보드 메뉴에서 **관리 기능**으로 대시보드 생성
- 생성된 대시보드가 대시보드 메뉴 하부 세부 항목으로 표시
- 각 대시보드는 독립적인 위젯 구성을 가짐

#### 4.4.2 위젯 종류

| 위젯 유형 | 설명 |
|-----------|------|
| 그래프 | 업무 시스템 데이터 기반 각종 차트 |
| 테이블 | 업무 시스템 데이터 기반 테이블 |
| 레이아웃 도면 | 사용자 정의 사이즈의 레이아웃 도면 |
| 최근 활동 | 현재 개발된 ActivityFeed 컴포넌트 활용 |
| 업무 현황 | 현재 개발된 EquipmentStatusChart 등 활용 |

#### 4.4.3 위젯 배치 방식
- 위젯 형식으로 보여주고 싶은 정보를 자유 배치
- 그리드 기반 드래그 앤 드롭으로 위젯 위치 및 사이즈 조정

---

## 5. 개발 규칙 및 금지 사항

### 절대 변경 금지
- `src/services/mockData.ts` 의 인터페이스 구조 (데이터 내용은 추가 가능)
- 환경변수 `VITE_DATA_MODE` 분기 처리 구조
- ANTIGRVITY 디자인 시스템 (스타일 변경 시 반드시 확인 요청)

### 컴포넌트 작성 규칙
- 모든 데이터 호출은 반드시 `src/services/` 경유
- 컴포넌트 내 하드코딩 데이터 금지
- 사내망 이관 시 교체가 필요한 부분은 아래 주석 필수 표기:
```typescript
// [사내망 이관 시 교체] 실제 API 엔드포인트로 교체 필요
```

### 신규 파일 생성 위치
```
새 페이지           →  src/pages/
새 공통 컴포넌트    →  src/components/
새 위젯 컴포넌트    →  src/components/dashboard/
새 레이아웃 관련    →  src/components/layout-editor/
새 데이터 타입      →  src/types/index.ts
새 상태 관리        →  src/stores/
새 서비스/API       →  src/services/
```

---

## 6. 현재 개발 단계 및 다음 작업

```
현재:  초기 개발본 + ANTIGRVITY 디자인 적용 완료
다음:  CLAUDE.md 기반으로 아래 순서로 구현 진행

우선순위:
  1. 네비게이션 바 메뉴 편집 기능
  2. 데이터 관리 — 테이블 유형 3가지 구현
  3. 레이아웃 메뉴 구조 변경 및 편집 프로세스
  4. 대시보드 위젯 시스템
```

---

## 7. 추후 구현 예정 (미정의)

- 최적화 배치 검토 기능 (상세 요구사항 추후 추가 예정)
- 사용자 정의 기능 상세 명세 (추후 추가 예정)
- 워크플로우 승인 프로세스 연동

---

*마지막 업데이트: 초기 작성 | 다음 업데이트: 세부 구현 완료 후*
