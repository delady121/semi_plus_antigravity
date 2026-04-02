import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// [사내망 이관 시 교체] localStorage → 사내 대시보드 설정 저장 API로 교체 필요

export type WidgetType = 'KPI' | 'CHART' | 'TABLE' | 'ACTIVITY' | 'LAYOUT'

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  // react-grid-layout 위치/크기
  x: number
  y: number
  w: number
  h: number
  // 위젯별 추가 설정 (확장 가능)
  chartType?: 'bar' | 'pie' | 'line'
}

export interface DashboardConfig {
  id: string
  name: string
  widgets: WidgetConfig[]
  createdAt: string
  updatedAt: string
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w_kpi',      type: 'KPI',      title: 'KPI 현황',          x: 0, y: 0,  w: 12, h: 3 },
  { id: 'w_layout',   type: 'LAYOUT',   title: '레이아웃 미리보기', x: 0, y: 3,  w: 8,  h: 6 },
  { id: 'w_activity', type: 'ACTIVITY', title: '최근 활동',          x: 8, y: 3,  w: 4,  h: 6 },
  { id: 'w_chart',    type: 'CHART',    title: '설비 현황 차트',     x: 0, y: 9,  w: 6,  h: 5 },
  { id: 'w_table',    type: 'TABLE',    title: '반출입 일정',        x: 6, y: 9,  w: 6,  h: 5 },
]

const DEFAULT_DASHBOARD: DashboardConfig = {
  id: 'default',
  name: '전체 현황',
  widgets: DEFAULT_WIDGETS,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

interface DashboardState {
  dashboards: DashboardConfig[]
  addDashboard: (dashboard: DashboardConfig) => void
  updateDashboard: (id: string, updates: Partial<DashboardConfig>) => void
  deleteDashboard: (id: string) => void
  updateWidgets: (dashboardId: string, widgets: WidgetConfig[]) => void
  addWidget: (dashboardId: string, widget: WidgetConfig) => void
  removeWidget: (dashboardId: string, widgetId: string) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      dashboards: [DEFAULT_DASHBOARD],

      addDashboard: (dashboard) =>
        set(state => ({ dashboards: [...state.dashboards, dashboard] })),

      updateDashboard: (id, updates) =>
        set(state => ({
          dashboards: state.dashboards.map(d =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),

      deleteDashboard: (id) =>
        set(state => ({
          dashboards: state.dashboards.filter(d => d.id !== id || d.id === 'default'),
        })),

      updateWidgets: (dashboardId, widgets) =>
        set(state => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? { ...d, widgets, updatedAt: new Date().toISOString() }
              : d
          ),
        })),

      addWidget: (dashboardId, widget) =>
        set(state => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? { ...d, widgets: [...d.widgets, widget], updatedAt: new Date().toISOString() }
              : d
          ),
        })),

      removeWidget: (dashboardId, widgetId) =>
        set(state => ({
          dashboards: state.dashboards.map(d =>
            d.id === dashboardId
              ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId), updatedAt: new Date().toISOString() }
              : d
          ),
        })),
    }),
    { name: 'semiplus-dashboards' }
  )
)
