import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomMenuItem {
  id: string
  label: string
  path: string
  iconType: string
}

interface MenuState {
  // [사내망 이관 시 교체] 현재 localStorage 기반 → 사내망 이관 시 사용자별 메뉴 설정 API로 교체 필요
  sections: Record<string, CustomMenuItem[]>
  setItems: (sectionKey: string, items: CustomMenuItem[]) => void
}

const defaultSections: Record<string, CustomMenuItem[]> = {
  dashboard: [
    { id: 'dashboard-overview', label: '전체 현황', path: '/dashboard', iconType: 'BarChart3' },
    { id: 'dashboard-equipment', label: '설비 현황', path: '/dashboard/equipment', iconType: 'Activity' },
  ],
  layout: [
    { id: 'layout-editor', label: '에디터', path: '/layout/editor', iconType: 'Layers' },
    { id: 'layout-bays', label: 'Bay 목록', path: '/layout/bays', iconType: 'Building2' },
  ],
  data: [
    { id: 'data-equipment', label: '설비 마스터', path: '/data', iconType: 'FileText' },
  ],
  workflow: [
    { id: 'workflow-plans', label: '기획안 목록', path: '/workflow', iconType: 'FileText' },
  ],
  settings: [
    { id: 'settings-users', label: '사용자 관리', path: '/settings/users', iconType: 'Users' },
    { id: 'settings-notifications', label: '알림 설정', path: '/settings/notifications', iconType: 'Bell' },
    { id: 'settings-bays', label: 'Bay 관리', path: '/settings/bays', iconType: 'Building2' },
  ],
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      sections: defaultSections,
      setItems: (sectionKey, items) =>
        set(state => ({
          sections: { ...state.sections, [sectionKey]: items },
        })),
    }),
    { name: 'semiplus-menu' }
  )
)
