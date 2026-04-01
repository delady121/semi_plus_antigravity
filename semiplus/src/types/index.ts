export type UserRole = 'ADMIN' | 'PLANNER' | 'REVIEWER' | 'VIEWER'
export type EquipmentStatus = 'OPERATING' | 'PLANNED_IN' | 'PLANNED_OUT' | 'REMOVED'
export type InvestmentType = 'NEW' | 'EXPANSION' | 'REPLACEMENT' | 'RELOCATION'
export type PlanStatus = 'DRAFT' | 'REVIEW_REQUESTED' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface User {
  id: string
  employee_id: string
  name: string
  email: string
  department: string
  role: UserRole
  created_at: string
  last_login_at?: string
}

export interface FabBay {
  id: string
  name: string
  floor: number
  area_sqm: number
  image_url?: string
  scale_mm_per_px: number
}

export interface Equipment {
  id: string
  equipment_no: string
  name: string
  model?: string
  width_mm: number
  depth_mm: number
  height_mm?: number
  maintenance_space_mm: number
  status: EquipmentStatus
  planned_in_date?: string
  planned_out_date?: string
  investment_type?: InvestmentType
  fab_bay_id?: string
  created_at: string
  updated_at: string
}

export interface LayoutPlan {
  id: string
  title: string
  fab_bay_id: string
  investment_type?: InvestmentType
  status: PlanStatus
  canvas_snapshot?: CanvasSnapshot
  created_by: string
  version: number
  parent_version_id?: string
  created_at: string
  updated_at: string
}

export interface CanvasSnapshot {
  scale: number
  offset: { x: number; y: number }
  layers: LayerData[]
  placements: EquipmentPlacement[]
  custom_shapes: CustomShape[]
}

export interface EquipmentPlacement {
  id: string
  plan_id: string
  equipment_id: string
  x: number
  y: number
  rotation: number
  layer: string
  is_fixed: boolean
}

export interface CustomShape {
  id: string
  type: 'rect' | 'circle' | 'text' | 'arrow'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color?: string
  layer: string
}

export interface LayerData {
  code: string
  name: string
  visible: boolean
  locked: boolean
}

export interface ApprovalRequest {
  id: string
  plan_id: string
  reviewer_id: string
  reviewer_name: string
  department: string
  status: ApprovalStatus
  comment?: string
  reviewed_at?: string
  notified_at?: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'REVIEW_REQUEST' | 'APPROVED' | 'REJECTED' | 'MENTION' | 'DDAY_REMINDER' | 'PLAN_CHANGED'
  title: string
  message: string
  is_read: boolean
  plan_id?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  user_name: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  target_type: string
  target_id: string
  created_at: string
}

export interface Comment {
  id: string
  plan_id: string
  user_id: string
  user_name: string
  department: string
  content: string
  created_at: string
}
