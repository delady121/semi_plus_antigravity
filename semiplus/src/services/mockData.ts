import type {
  User, FabBay, Equipment, LayoutPlan, ApprovalRequest, Notification, AuditLog, Comment, CanvasSnapshot
} from '../types'

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'u1', employee_id: 'EMP001', name: '김관리', email: 'admin@fab.com', department: '시설기획팀', role: 'ADMIN', created_at: '2024-01-01T09:00:00Z', last_login_at: '2026-03-30T08:00:00Z' },
  { id: 'u2', employee_id: 'EMP002', name: '이계획', email: 'planner1@fab.com', department: '시설기획팀', role: 'PLANNER', created_at: '2024-02-01T09:00:00Z', last_login_at: '2026-03-29T17:30:00Z' },
  { id: 'u3', employee_id: 'EMP003', name: '박기획', email: 'planner2@fab.com', department: '시설기획팀', role: 'PLANNER', created_at: '2024-02-15T09:00:00Z', last_login_at: '2026-03-28T14:00:00Z' },
  { id: 'u4', employee_id: 'EMP004', name: '최설계', email: 'planner3@fab.com', department: '레이아웃팀', role: 'PLANNER', created_at: '2024-03-01T09:00:00Z', last_login_at: '2026-03-30T07:45:00Z' },
  { id: 'u5', employee_id: 'EMP005', name: '정검토', email: 'reviewer1@fab.com', department: '기술팀', role: 'REVIEWER', created_at: '2024-01-10T09:00:00Z', last_login_at: '2026-03-29T16:00:00Z' },
  { id: 'u6', employee_id: 'EMP006', name: '한건설', email: 'reviewer2@fab.com', department: '건설팀', role: 'REVIEWER', created_at: '2024-01-10T09:00:00Z', last_login_at: '2026-03-28T11:00:00Z' },
  { id: 'u7', employee_id: 'EMP007', name: '윤안전', email: 'reviewer3@fab.com', department: '안전팀', role: 'REVIEWER', created_at: '2024-01-15T09:00:00Z', last_login_at: '2026-03-27T09:00:00Z' },
  { id: 'u8', employee_id: 'EMP008', name: '장환경', email: 'reviewer4@fab.com', department: '환경팀', role: 'REVIEWER', created_at: '2024-02-01T09:00:00Z', last_login_at: '2026-03-26T15:30:00Z' },
  { id: 'u9', employee_id: 'EMP009', name: '신열람', email: 'viewer1@fab.com', department: '생산팀', role: 'VIEWER', created_at: '2024-03-01T09:00:00Z', last_login_at: '2026-03-25T10:00:00Z' },
  { id: 'u10', employee_id: 'EMP010', name: '오조회', email: 'viewer2@fab.com', department: '품질팀', role: 'VIEWER', created_at: '2024-03-15T09:00:00Z', last_login_at: '2026-03-24T14:00:00Z' },
]

// ──────────────────────────────────────────────
// FAB Bays
// ──────────────────────────────────────────────
export const mockFabBays: FabBay[] = [
  { id: 'bay1', name: 'A동 1층', floor: 1, area_sqm: 2400, scale_mm_per_px: 10 },
  { id: 'bay2', name: 'A동 2층', floor: 2, area_sqm: 2400, scale_mm_per_px: 10 },
  { id: 'bay3', name: 'B동 1층', floor: 1, area_sqm: 1800, scale_mm_per_px: 10 },
]

// ──────────────────────────────────────────────
// Equipment
// ──────────────────────────────────────────────
const today = new Date('2026-03-30')
const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r.toISOString().split('T')[0]
}

export const mockEquipment: Equipment[] = [
  { id: 'eq1', equipment_no: 'CVD-001', name: 'CVD 챔버 A', model: 'Lam Vector', width_mm: 1800, depth_mm: 2000, height_mm: 2200, maintenance_space_mm: 600, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 'eq2', equipment_no: 'CVD-002', name: 'CVD 챔버 B', model: 'Lam Vector', width_mm: 1800, depth_mm: 2000, height_mm: 2200, maintenance_space_mm: 600, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 'eq3', equipment_no: 'CVD-003', name: 'CVD 챔버 C', model: 'AMAT Centura', width_mm: 2100, depth_mm: 2200, height_mm: 2400, maintenance_space_mm: 700, status: 'PLANNED_IN', planned_in_date: addDays(today, 15), fab_bay_id: 'bay1', investment_type: 'EXPANSION', created_at: '2025-12-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 'eq4', equipment_no: 'CVD-004', name: 'CVD 챔버 D', model: 'AMAT Centura', width_mm: 2100, depth_mm: 2200, height_mm: 2400, maintenance_space_mm: 700, status: 'PLANNED_IN', planned_in_date: addDays(today, 7), fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { id: 'eq5', equipment_no: 'ETCH-001', name: '식각 설비 A', model: 'TEL Tactras', width_mm: 2400, depth_mm: 2000, height_mm: 2100, maintenance_space_mm: 800, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-01-15T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'eq6', equipment_no: 'ETCH-002', name: '식각 설비 B', model: 'TEL Tactras', width_mm: 2400, depth_mm: 2000, height_mm: 2100, maintenance_space_mm: 800, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-01-15T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'eq7', equipment_no: 'ETCH-003', name: '식각 설비 C', model: 'Lam 2300', width_mm: 2200, depth_mm: 1900, height_mm: 2000, maintenance_space_mm: 700, status: 'PLANNED_OUT', planned_out_date: addDays(today, 20), fab_bay_id: 'bay1', investment_type: 'REPLACEMENT', created_at: '2023-06-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { id: 'eq8', equipment_no: 'PHOTO-001', name: '노광기 A', model: 'ASML NXT1980', width_mm: 3000, depth_mm: 2500, height_mm: 2600, maintenance_space_mm: 1000, status: 'OPERATING', fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2024-03-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
  { id: 'eq9', equipment_no: 'PHOTO-002', name: '노광기 B', model: 'ASML NXT2000', width_mm: 3200, depth_mm: 2600, height_mm: 2700, maintenance_space_mm: 1000, status: 'PLANNED_IN', planned_in_date: addDays(today, 25), fab_bay_id: 'bay2', investment_type: 'EXPANSION', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { id: 'eq10', equipment_no: 'PHOTO-003', name: '코터/디벨로퍼', model: 'TEL CLEAN TRACK', width_mm: 4000, depth_mm: 2000, height_mm: 2200, maintenance_space_mm: 800, status: 'OPERATING', fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2024-03-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
  { id: 'eq11', equipment_no: 'CMP-001', name: 'CMP 설비 A', model: 'AMAT Reflexion', width_mm: 2800, depth_mm: 2400, height_mm: 2200, maintenance_space_mm: 900, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-02-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
  { id: 'eq12', equipment_no: 'CMP-002', name: 'CMP 설비 B', model: 'AMAT Reflexion', width_mm: 2800, depth_mm: 2400, height_mm: 2200, maintenance_space_mm: 900, status: 'PLANNED_IN', planned_in_date: addDays(today, 10), fab_bay_id: 'bay1', investment_type: 'EXPANSION', created_at: '2025-11-01T00:00:00Z', updated_at: '2026-02-15T00:00:00Z' },
  { id: 'eq13', equipment_no: 'DIFF-001', name: '확산로 A', model: 'Kokusai A400', width_mm: 1600, depth_mm: 3000, height_mm: 2800, maintenance_space_mm: 800, status: 'OPERATING', fab_bay_id: 'bay3', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z' },
  { id: 'eq14', equipment_no: 'DIFF-002', name: '확산로 B', model: 'Kokusai A400', width_mm: 1600, depth_mm: 3000, height_mm: 2800, maintenance_space_mm: 800, status: 'OPERATING', fab_bay_id: 'bay3', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z' },
  { id: 'eq15', equipment_no: 'IMP-001', name: '이온주입기 A', model: 'AMAT Varian', width_mm: 3500, depth_mm: 2800, height_mm: 2500, maintenance_space_mm: 1200, status: 'OPERATING', fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2024-04-01T00:00:00Z', updated_at: '2025-10-01T00:00:00Z' },
  { id: 'eq16', equipment_no: 'IMP-002', name: '이온주입기 B', model: 'Axcelis Purion', width_mm: 3200, depth_mm: 2600, height_mm: 2400, maintenance_space_mm: 1100, status: 'PLANNED_IN', planned_in_date: addDays(today, 5), fab_bay_id: 'bay2', investment_type: 'REPLACEMENT', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-03-10T00:00:00Z' },
  { id: 'eq17', equipment_no: 'CLEAN-001', name: '세정 설비 A', model: 'TEL Certas', width_mm: 2000, depth_mm: 1800, height_mm: 2000, maintenance_space_mm: 600, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 'eq18', equipment_no: 'CLEAN-002', name: '세정 설비 B', model: 'TEL Certas', width_mm: 2000, depth_mm: 1800, height_mm: 2000, maintenance_space_mm: 600, status: 'PLANNED_OUT', planned_out_date: addDays(today, 28), fab_bay_id: 'bay1', investment_type: 'RELOCATION', created_at: '2024-01-01T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  { id: 'eq19', equipment_no: 'MEAS-001', name: '계측 설비 A', model: 'KLA 2920', width_mm: 1200, depth_mm: 1400, height_mm: 1800, maintenance_space_mm: 500, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-02-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'eq20', equipment_no: 'MEAS-002', name: '계측 설비 B', model: 'KLA Surfscan', width_mm: 1400, depth_mm: 1600, height_mm: 1900, maintenance_space_mm: 500, status: 'OPERATING', fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2024-02-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 'eq21', equipment_no: 'ALD-001', name: 'ALD 설비 A', model: 'Jusung Eureka', width_mm: 1900, depth_mm: 2100, height_mm: 2200, maintenance_space_mm: 650, status: 'PLANNED_IN', planned_in_date: addDays(today, 18), fab_bay_id: 'bay3', investment_type: 'NEW', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
  { id: 'eq22', equipment_no: 'ALD-002', name: 'ALD 설비 B', model: 'Beneq TFS', width_mm: 1700, depth_mm: 1900, height_mm: 2100, maintenance_space_mm: 600, status: 'OPERATING', fab_bay_id: 'bay3', investment_type: 'EXPANSION', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z' },
  { id: 'eq23', equipment_no: 'SPUT-001', name: '스퍼터 설비 A', model: 'AMAT Endura', width_mm: 2600, depth_mm: 2200, height_mm: 2300, maintenance_space_mm: 750, status: 'OPERATING', fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2024-05-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
  { id: 'eq24', equipment_no: 'SPUT-002', name: '스퍼터 설비 B', model: 'Canon Anelva', width_mm: 2400, depth_mm: 2000, height_mm: 2200, maintenance_space_mm: 700, status: 'PLANNED_OUT', planned_out_date: addDays(today, 12), fab_bay_id: 'bay2', investment_type: 'REPLACEMENT', created_at: '2023-05-01T00:00:00Z', updated_at: '2026-03-25T00:00:00Z' },
  { id: 'eq25', equipment_no: 'OXI-001', name: '산화로 A', model: 'TEL Alpha-8S', width_mm: 1500, depth_mm: 2800, height_mm: 2600, maintenance_space_mm: 700, status: 'OPERATING', fab_bay_id: 'bay3', investment_type: 'NEW', created_at: '2024-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 'eq26', equipment_no: 'OXI-002', name: '산화로 B', model: 'TEL Alpha-8S', width_mm: 1500, depth_mm: 2800, height_mm: 2600, maintenance_space_mm: 700, status: 'REMOVED', fab_bay_id: undefined, investment_type: 'REPLACEMENT', created_at: '2023-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'eq27', equipment_no: 'EPI-001', name: '에피택시 설비', model: 'ASM Epsilon', width_mm: 3000, depth_mm: 2600, height_mm: 2400, maintenance_space_mm: 1000, status: 'OPERATING', fab_bay_id: 'bay3', investment_type: 'NEW', created_at: '2024-06-01T00:00:00Z', updated_at: '2025-10-01T00:00:00Z' },
  { id: 'eq28', equipment_no: 'ANNEAL-001', name: '어닐링 설비', model: 'Ultratech SteadyState', width_mm: 2200, depth_mm: 2000, height_mm: 2100, maintenance_space_mm: 700, status: 'PLANNED_IN', planned_in_date: addDays(today, 22), fab_bay_id: 'bay3', investment_type: 'EXPANSION', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-05T00:00:00Z' },
  { id: 'eq29', equipment_no: 'WI-001', name: '웨이퍼 인스펙터', model: 'Hitachi CG6300', width_mm: 1100, depth_mm: 1300, height_mm: 1700, maintenance_space_mm: 450, status: 'OPERATING', fab_bay_id: 'bay1', investment_type: 'NEW', created_at: '2024-03-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
  { id: 'eq30', equipment_no: 'WI-002', name: '결함 검사기', model: 'KLA Puma 9850', width_mm: 1800, depth_mm: 1600, height_mm: 2000, maintenance_space_mm: 600, status: 'PLANNED_IN', planned_in_date: addDays(today, 3), fab_bay_id: 'bay2', investment_type: 'NEW', created_at: '2026-02-15T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
]

// ──────────────────────────────────────────────
// Canvas Snapshot for plan1
// ──────────────────────────────────────────────
const defaultSnapshot: CanvasSnapshot = {
  scale: 1,
  offset: { x: 0, y: 0 },
  layers: [
    { code: 'L1', name: '배경', visible: true, locked: true },
    { code: 'L2', name: '배치영역', visible: true, locked: false },
    { code: 'L3', name: 'OHT레일', visible: true, locked: false },
    { code: 'L4', name: '격자', visible: true, locked: false },
    { code: 'L5', name: '설비', visible: true, locked: false },
    { code: 'L6', name: '마킹', visible: true, locked: false },
    { code: 'L7', name: '검토결과', visible: true, locked: false },
  ],
  placements: [
    { id: 'pl1', plan_id: 'plan1', equipment_id: 'eq1', x: 120, y: 80, rotation: 0, layer: 'L5', is_fixed: true },
    { id: 'pl2', plan_id: 'plan1', equipment_id: 'eq2', x: 320, y: 80, rotation: 0, layer: 'L5', is_fixed: true },
    { id: 'pl3', plan_id: 'plan1', equipment_id: 'eq5', x: 120, y: 250, rotation: 0, layer: 'L5', is_fixed: false },
    { id: 'pl4', plan_id: 'plan1', equipment_id: 'eq6', x: 360, y: 250, rotation: 0, layer: 'L5', is_fixed: false },
  ],
  custom_shapes: [],
}

// ──────────────────────────────────────────────
// Layout Plans
// ──────────────────────────────────────────────
export const mockLayoutPlans: LayoutPlan[] = [
  { id: 'plan1', title: 'A동 1층 CVD 증설 계획 v1', fab_bay_id: 'bay1', investment_type: 'EXPANSION', status: 'IN_PROGRESS', canvas_snapshot: defaultSnapshot, created_by: 'u2', version: 1, created_at: '2026-03-01T09:00:00Z', updated_at: '2026-03-25T15:30:00Z' },
  { id: 'plan2', title: 'A동 2층 노광기 신규 반입 계획', fab_bay_id: 'bay2', investment_type: 'NEW', status: 'REVIEW_REQUESTED', canvas_snapshot: defaultSnapshot, created_by: 'u3', version: 1, created_at: '2026-02-15T09:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'plan3', title: 'B동 이온주입기 교체 계획', fab_bay_id: 'bay3', investment_type: 'REPLACEMENT', status: 'DRAFT', created_by: 'u4', version: 1, created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-10T09:00:00Z' },
  { id: 'plan4', title: 'A동 1층 식각 설비 이전 계획', fab_bay_id: 'bay1', investment_type: 'RELOCATION', status: 'APPROVED', canvas_snapshot: defaultSnapshot, created_by: 'u2', version: 2, parent_version_id: 'plan4v1', created_at: '2026-01-01T09:00:00Z', updated_at: '2026-02-28T16:00:00Z' },
  { id: 'plan5', title: 'B동 ALD 신규 도입 계획', fab_bay_id: 'bay3', investment_type: 'NEW', status: 'REJECTED', created_by: 'u3', version: 1, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-20T11:00:00Z' },
]

// ──────────────────────────────────────────────
// Approval Requests
// ──────────────────────────────────────────────
export const mockApprovalRequests: ApprovalRequest[] = [
  { id: 'apr1', plan_id: 'plan1', reviewer_id: 'u5', reviewer_name: '정검토', department: '기술팀', status: 'APPROVED', comment: '기술적으로 문제없습니다.', reviewed_at: '2026-03-22T14:00:00Z', notified_at: '2026-03-20T09:00:00Z' },
  { id: 'apr2', plan_id: 'plan1', reviewer_id: 'u6', reviewer_name: '한건설', department: '건설팀', status: 'PENDING', notified_at: '2026-03-20T09:00:00Z' },
  { id: 'apr3', plan_id: 'plan1', reviewer_id: 'u7', reviewer_name: '윤안전', department: '안전팀', status: 'PENDING', notified_at: '2026-03-20T09:00:00Z' },
  { id: 'apr4', plan_id: 'plan2', reviewer_id: 'u5', reviewer_name: '정검토', department: '기술팀', status: 'PENDING', notified_at: '2026-03-18T09:00:00Z' },
  { id: 'apr5', plan_id: 'plan2', reviewer_id: 'u6', reviewer_name: '한건설', department: '건설팀', status: 'APPROVED', comment: '건설 일정 협의 완료.', reviewed_at: '2026-03-21T10:00:00Z', notified_at: '2026-03-18T09:00:00Z' },
  { id: 'apr6', plan_id: 'plan2', reviewer_id: 'u8', reviewer_name: '장환경', department: '환경팀', status: 'PENDING', notified_at: '2026-03-18T09:00:00Z' },
  { id: 'apr7', plan_id: 'plan4', reviewer_id: 'u5', reviewer_name: '정검토', department: '기술팀', status: 'APPROVED', comment: '승인합니다.', reviewed_at: '2026-02-25T14:00:00Z', notified_at: '2026-02-20T09:00:00Z' },
  { id: 'apr8', plan_id: 'plan4', reviewer_id: 'u6', reviewer_name: '한건설', department: '건설팀', status: 'APPROVED', comment: '건설 계획 적합.', reviewed_at: '2026-02-26T11:00:00Z', notified_at: '2026-02-20T09:00:00Z' },
  { id: 'apr9', plan_id: 'plan4', reviewer_id: 'u7', reviewer_name: '윤안전', department: '안전팀', status: 'APPROVED', comment: '안전 기준 충족.', reviewed_at: '2026-02-27T15:00:00Z', notified_at: '2026-02-20T09:00:00Z' },
  { id: 'apr10', plan_id: 'plan5', reviewer_id: 'u5', reviewer_name: '정검토', department: '기술팀', status: 'REJECTED', comment: '현재 베이 공간 부족으로 반려합니다.', reviewed_at: '2026-02-18T14:00:00Z', notified_at: '2026-02-15T09:00:00Z' },
]

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────
export const mockNotifications: Notification[] = [
  { id: 'noti1', user_id: 'u2', type: 'APPROVED', title: '기획안 승인', message: '"A동 1층 식각 설비 이전 계획"이 최종 승인되었습니다.', is_read: false, plan_id: 'plan4', created_at: '2026-02-28T16:00:00Z' },
  { id: 'noti2', user_id: 'u2', type: 'REVIEW_REQUEST', title: '검토 요청 발송 완료', message: '"A동 1층 CVD 증설 계획"의 검토가 요청되었습니다.', is_read: true, plan_id: 'plan1', created_at: '2026-03-20T09:00:00Z' },
  { id: 'noti3', user_id: 'u5', type: 'REVIEW_REQUEST', title: '검토 요청 수신', message: '"A동 1층 CVD 증설 계획"의 검토를 요청받았습니다.', is_read: false, plan_id: 'plan1', created_at: '2026-03-20T09:01:00Z' },
  { id: 'noti4', user_id: 'u3', type: 'REVIEW_REQUEST', title: '검토 요청 발송 완료', message: '"A동 2층 노광기 신규 반입 계획"의 검토가 요청되었습니다.', is_read: false, plan_id: 'plan2', created_at: '2026-03-18T09:00:00Z' },
  { id: 'noti5', user_id: 'u5', type: 'REVIEW_REQUEST', title: '검토 요청 수신', message: '"A동 2층 노광기 신규 반입 계획"의 검토를 요청받았습니다.', is_read: false, plan_id: 'plan2', created_at: '2026-03-18T09:01:00Z' },
  { id: 'noti6', user_id: 'u2', type: 'APPROVED', title: '부분 승인', message: '기술팀이 "A동 1층 CVD 증설 계획"을 승인했습니다.', is_read: false, plan_id: 'plan1', created_at: '2026-03-22T14:00:00Z' },
  { id: 'noti7', user_id: 'u3', type: 'REJECTED', title: '기획안 반려', message: '"B동 ALD 신규 도입 계획"이 반려되었습니다. 사유: 현재 베이 공간 부족', is_read: true, plan_id: 'plan5', created_at: '2026-02-18T14:00:00Z' },
  { id: 'noti8', user_id: 'u2', type: 'DDAY_REMINDER', title: 'D-day 알림', message: 'CVD-004 설비가 7일 후 반입 예정입니다.', is_read: false, plan_id: 'plan1', created_at: '2026-03-30T08:00:00Z' },
  { id: 'noti9', user_id: 'u4', type: 'PLAN_CHANGED', title: '기획안 변경', message: '"A동 1층 CVD 증설 계획"이 수정되었습니다.', is_read: true, plan_id: 'plan1', created_at: '2026-03-25T15:30:00Z' },
  { id: 'noti10', user_id: 'u2', type: 'DDAY_REMINDER', title: 'D-day 임박 알림', message: '결함 검사기(WI-002) 설비가 3일 후 반입 예정입니다!', is_read: false, plan_id: 'plan2', created_at: '2026-03-30T08:00:00Z' },
]

// ──────────────────────────────────────────────
// Audit Logs
// ──────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'log1', user_id: 'u2', user_name: '이계획', action: 'STATUS_CHANGE', target_type: 'LayoutPlan', target_id: 'plan1', created_at: '2026-03-25T15:30:00Z' },
  { id: 'log2', user_id: 'u5', user_name: '정검토', action: 'STATUS_CHANGE', target_type: 'ApprovalRequest', target_id: 'apr1', created_at: '2026-03-22T14:00:00Z' },
  { id: 'log3', user_id: 'u6', user_name: '한건설', action: 'STATUS_CHANGE', target_type: 'ApprovalRequest', target_id: 'apr5', created_at: '2026-03-21T10:00:00Z' },
  { id: 'log4', user_id: 'u3', user_name: '박기획', action: 'CREATE', target_type: 'LayoutPlan', target_id: 'plan2', created_at: '2026-03-18T09:00:00Z' },
  { id: 'log5', user_id: 'u2', user_name: '이계획', action: 'UPDATE', target_type: 'Equipment', target_id: 'eq3', created_at: '2026-03-15T11:00:00Z' },
  { id: 'log6', user_id: 'u4', user_name: '최설계', action: 'CREATE', target_type: 'LayoutPlan', target_id: 'plan3', created_at: '2026-03-10T09:00:00Z' },
  { id: 'log7', user_id: 'u1', user_name: '김관리', action: 'CREATE', target_type: 'User', target_id: 'u10', created_at: '2026-03-15T09:00:00Z' },
  { id: 'log8', user_id: 'u2', user_name: '이계획', action: 'STATUS_CHANGE', target_type: 'LayoutPlan', target_id: 'plan4', created_at: '2026-02-28T16:00:00Z' },
]

// ──────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────
export const mockComments: Comment[] = [
  { id: 'cmt1', plan_id: 'plan1', user_id: 'u5', user_name: '정검토', department: '기술팀', content: '기술적으로 CVD 챔버 간격이 유지보수 기준 600mm 이상이어야 합니다. 현재 배치 확인 필요합니다.', created_at: '2026-03-21T10:00:00Z' },
  { id: 'cmt2', plan_id: 'plan1', user_id: 'u2', user_name: '이계획', department: '시설기획팀', content: '말씀하신 부분 수정하였습니다. L5 레이어에서 간격 조정 완료했습니다.', created_at: '2026-03-22T09:00:00Z' },
  { id: 'cmt3', plan_id: 'plan1', user_id: 'u5', user_name: '정검토', department: '기술팀', content: '확인했습니다. 승인합니다.', created_at: '2026-03-22T14:00:00Z' },
  { id: 'cmt4', plan_id: 'plan2', user_id: 'u6', user_name: '한건설', department: '건설팀', content: '노광기 반입 경로 확인이 필요합니다. 화물 엘리베이터 크기 검토 요청드립니다.', created_at: '2026-03-19T11:00:00Z' },
  { id: 'cmt5', plan_id: 'plan2', user_id: 'u3', user_name: '박기획', department: '시설기획팀', content: '화물 엘리베이터 사양 확인 후 반입 루트 수정하겠습니다.', created_at: '2026-03-20T09:00:00Z' },
  { id: 'cmt6', plan_id: 'plan5', user_id: 'u5', user_name: '정검토', department: '기술팀', content: 'B동 현재 공간이 부족합니다. 기존 설비 반출 후 재검토가 필요합니다.', created_at: '2026-02-17T15:00:00Z' },
]

// ──────────────────────────────────────────────
// Layout Layer Tables (Mock — 사내망 이관 시 교체)
// [사내망 이관 시 교체] 실제 사내 Datalake 테이블 목록 API로 교체 필요
// ──────────────────────────────────────────────
export interface MockTableInfo {
  id: string
  name: string
  description: string
  columns: string[]
}

export const mockLayoutTables: MockTableInfo[] = [
  {
    id: 'EQP_LAYOUT_MASTER',
    name: 'EQP_LAYOUT_MASTER',
    description: '설비 좌표 마스터 테이블',
    columns: ['EQP_ID', 'EQP_NAME', 'X_MAX', 'X_MIN', 'Y_MAX', 'Y_MIN', 'FLOOR', 'BAY_ID', 'STATUS', 'INSTALL_DATE'],
  },
  {
    id: 'EQP_LAYOUT_PLAN',
    name: 'EQP_LAYOUT_PLAN',
    description: '설비 배치 계획 테이블',
    columns: ['PLAN_ID', 'EQP_ID', 'EQP_NO', 'X_MAX', 'X_MIN', 'Y_MAX', 'Y_MIN', 'PLAN_DATE', 'STATUS', 'REMARK'],
  },
  {
    id: 'FACILITY_MASTER',
    name: 'FACILITY_MASTER',
    description: '시설물(기둥/계단 등) 마스터 테이블',
    columns: ['FACILITY_ID', 'FACILITY_NAME', 'FACILITY_TYPE', 'X_MAX', 'X_MIN', 'Y_MAX', 'Y_MIN', 'FLOOR'],
  },
  {
    id: 'EQP_SPEC_TABLE',
    name: 'EQP_SPEC_TABLE',
    description: '설비 제원 테이블',
    columns: ['EQP_ID', 'EQP_NO', 'MODEL', 'WIDTH_MM', 'DEPTH_MM', 'HEIGHT_MM', 'WEIGHT_KG', 'PROCESS_TYPE'],
  },
  {
    id: 'FAB_ZONE_TABLE',
    name: 'FAB_ZONE_TABLE',
    description: 'FAB 구역 정보 테이블',
    columns: ['ZONE_ID', 'ZONE_NAME', 'ZONE_TYPE', 'X_MAX', 'X_MIN', 'Y_MAX', 'Y_MIN', 'CLEAN_CLASS', 'FLOOR'],
  },
]

// ──────────────────────────────────────────────
// Simulated async service (200ms delay)
// ──────────────────────────────────────────────
const delay = (ms = 200) => new Promise<void>(r => setTimeout(r, ms))

export const mockService = {
  getUsers: async () => { await delay(); return [...mockUsers] },
  getFabBays: async () => { await delay(); return [...mockFabBays] },
  getEquipment: async () => { await delay(); return [...mockEquipment] },
  getLayoutPlans: async () => { await delay(); return [...mockLayoutPlans] },
  getLayoutPlan: async (id: string) => { await delay(); return mockLayoutPlans.find(p => p.id === id) ?? null },
  getApprovalRequests: async (planId?: string) => {
    await delay()
    return planId ? mockApprovalRequests.filter(r => r.plan_id === planId) : [...mockApprovalRequests]
  },
  getNotifications: async (userId: string) => {
    await delay()
    return mockNotifications.filter(n => n.user_id === userId)
  },
  getAuditLogs: async () => { await delay(); return [...mockAuditLogs] },
  getComments: async (planId?: string) => {
    await delay()
    return planId ? mockComments.filter(c => c.plan_id === planId) : [...mockComments]
  },
  // [사내망 이관 시 교체] 사내 Datalake 테이블 목록 API로 교체 필요
  getLayoutTables: async () => { await delay(100); return [...mockLayoutTables] },
  // [사내망 이관 시 교체] 사내 Datalake 테이블 컬럼 조회 API로 교체 필요
  getTableColumns: async (tableId: string) => {
    await delay(100)
    return mockLayoutTables.find(t => t.id === tableId)?.columns ?? []
  },
}
