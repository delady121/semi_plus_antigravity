import React from 'react'
import {
  BarChart3, Activity, Layers, Building2, FileText, Users, Bell,
  Database, Map, Settings, GitBranch, List, PieChart,
  LayoutDashboard, ChevronRight, Cpu, Wrench, Table2, FolderOpen,
  Clipboard, LineChart, Grid3x3, Archive,
} from 'lucide-react'

export const ICON_OPTIONS: { type: string; label: string }[] = [
  { type: 'BarChart3',      label: '막대차트' },
  { type: 'LineChart',      label: '선차트' },
  { type: 'PieChart',       label: '파이차트' },
  { type: 'Activity',       label: '활동' },
  { type: 'Layers',         label: '레이어' },
  { type: 'LayoutDashboard',label: '대시보드' },
  { type: 'Building2',      label: '건물' },
  { type: 'FileText',       label: '문서' },
  { type: 'Clipboard',      label: '클립보드' },
  { type: 'Users',          label: '사용자' },
  { type: 'Bell',           label: '알림' },
  { type: 'Database',       label: 'DB' },
  { type: 'Table2',         label: '테이블' },
  { type: 'List',           label: '목록' },
  { type: 'FolderOpen',     label: '폴더' },
  { type: 'Archive',        label: '아카이브' },
  { type: 'Settings',       label: '설정' },
  { type: 'GitBranch',      label: '워크플로우' },
  { type: 'Map',            label: '지도' },
  { type: 'Cpu',            label: '설비' },
  { type: 'Wrench',         label: '도구' },
  { type: 'Grid3x3',        label: '그리드' },
  { type: 'ChevronRight',   label: '기본' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconComponents: Record<string, React.FC<any>> = {
  BarChart3, Activity, Layers, Building2, FileText, Users, Bell,
  Database, Map, Settings, GitBranch, List, PieChart,
  LayoutDashboard, ChevronRight, Cpu, Wrench, Table2, FolderOpen,
  Clipboard, LineChart, Grid3x3, Archive,
}

export function renderIcon(iconType: string, size: number = 15): React.ReactNode {
  const Icon = iconComponents[iconType] ?? ChevronRight
  return <Icon size={size} />
}
