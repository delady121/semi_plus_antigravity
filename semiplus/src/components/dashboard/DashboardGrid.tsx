import React, { useState, useMemo } from 'react'
import GridLayout, { type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { X, GripVertical, BarChart3, Table2, Map, Activity, Gauge } from 'lucide-react'
import type { WidgetConfig, WidgetType } from '../../stores/dashboardStore'
import { KpiCard } from './KpiCard'
import { EquipmentStatusChart } from './EquipmentStatusChart'
import { ScheduledEquipmentTable } from './ScheduledEquipmentTable'
import { ActivityFeed } from './ActivityFeed'
import { MiniLayoutViewer } from './MiniLayoutViewer'
import type { Equipment, FabBay, LayoutPlan, Notification, AuditLog } from '../../types'
import { Cpu, Calendar, SquareDashed, GitBranch } from 'lucide-react'

interface Props {
  widgets: WidgetConfig[]
  isEditing: boolean
  containerWidth: number
  // 데이터 props
  equipment: Equipment[]
  bays: FabBay[]
  plans: LayoutPlan[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  onLayoutChange: (widgets: WidgetConfig[]) => void
  onRemoveWidget: (id: string) => void
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  KPI:      <Gauge size={13} />,
  CHART:    <BarChart3 size={13} />,
  TABLE:    <Table2 size={13} />,
  LAYOUT:   <Map size={13} />,
  ACTIVITY: <Activity size={13} />,
}

const ROW_HEIGHT = 80
const COLS = 12

export const DashboardGrid: React.FC<Props> = ({
  widgets,
  isEditing,
  containerWidth,
  equipment,
  bays,
  plans,
  notifications,
  auditLogs,
  onLayoutChange,
  onRemoveWidget,
}) => {
  const today = new Date('2026-03-30')
  const d30 = new Date(today)
  d30.setDate(d30.getDate() + 30)

  const operatingCount = equipment.filter(e => e.status === 'OPERATING').length
  const plannedIn30 = equipment.filter(e => {
    if (e.status !== 'PLANNED_IN' || !e.planned_in_date) return false
    const d = new Date(e.planned_in_date)
    return d >= today && d <= d30
  })
  const urgentCount = plannedIn30.filter(e => {
    const d = new Date(e.planned_in_date!)
    return Math.ceil((d.getTime() - today.getTime()) / 86400000) <= 7
  }).length
  const totalBayArea = bays.reduce((sum, b) => sum + b.area_sqm, 0)
  const occupiedArea = equipment
    .filter(e => e.status === 'OPERATING' && e.fab_bay_id)
    .reduce((sum, e) => sum + (e.width_mm / 1000 + e.maintenance_space_mm / 1000) * (e.depth_mm / 1000 + e.maintenance_space_mm / 1000), 0)
  const deadSpace = Math.max(0, totalBayArea - occupiedArea)
  const activePlans = plans.filter(p => p.status === 'REVIEW_REQUESTED' || p.status === 'IN_PROGRESS').length

  const layouts: Layout[] = useMemo(
    () => widgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h, minW: 3, minH: 2 })),
    [widgets]
  )

  const handleLayoutChange = (newLayout: Layout[]) => {
    const updated = widgets.map(w => {
      const l = newLayout.find(nl => nl.i === w.id)
      if (!l) return w
      return { ...w, x: l.x, y: l.y, w: l.w, h: l.h }
    })
    onLayoutChange(updated)
  }

  const renderWidgetContent = (widget: WidgetConfig, heightPx: number) => {
    switch (widget.type) {
      case 'KPI':
        return (
          <div className="grid grid-cols-4 gap-3 h-full content-start pt-1 px-1">
            <KpiCard
              title="총 설비 수"
              value={equipment.filter(e => e.status !== 'REMOVED').length}
              subtitle={`운영중 ${operatingCount}대`}
              icon={<Cpu size={18} className="text-blue-600" />}
              iconBg="bg-blue-50"
              accentColor="bg-blue-500"
            />
            <KpiCard
              title="반입 예정 (D-30)"
              value={plannedIn30.length}
              subtitle={urgentCount > 0 ? `${urgentCount}건 임박` : '임박 없음'}
              icon={<Calendar size={18} className="text-orange-600" />}
              iconBg="bg-orange-50"
              accentColor="bg-orange-400"
              alert={urgentCount > 0}
            />
            <KpiCard
              title="Dead Space"
              value={`${deadSpace.toFixed(0)} m²`}
              subtitle="전체 Bay 합산"
              icon={<SquareDashed size={18} className="text-violet-600" />}
              iconBg="bg-violet-50"
              accentColor="bg-violet-500"
            />
            <KpiCard
              title="진행 중 기획안"
              value={activePlans}
              subtitle="검토요청 + 처리중"
              icon={<GitBranch size={18} className="text-brand-600" />}
              iconBg="bg-brand-50"
              accentColor="bg-brand-500"
            />
          </div>
        )
      case 'CHART':
        return <EquipmentStatusChart equipment={equipment} />
      case 'TABLE':
        return <ScheduledEquipmentTable equipment={equipment} />
      case 'ACTIVITY':
        return <ActivityFeed auditLogs={auditLogs} notifications={notifications} />
      case 'LAYOUT':
        return <MiniLayoutViewer bays={bays} equipment={equipment} plans={plans} />
      default:
        return null
    }
  }

  return (
    <GridLayout
      className="layout"
      layout={layouts}
      cols={COLS}
      rowHeight={ROW_HEIGHT}
      width={containerWidth || 1200}
      onLayoutChange={handleLayoutChange}
      isDraggable={isEditing}
      isResizable={isEditing}
      draggableHandle=".drag-handle"
      margin={[12, 12]}
    >
      {widgets.map(widget => {
        const heightPx = widget.h * ROW_HEIGHT + (widget.h - 1) * 12
        return (
          <div key={widget.id} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {/* 위젯 헤더 */}
            <div className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 shrink-0 ${isEditing ? 'bg-gray-50' : 'bg-white'}`}>
              {isEditing && (
                <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                  <GripVertical size={14} />
                </div>
              )}
              <span className="text-gray-400">{WIDGET_ICONS[widget.type]}</span>
              <span className="text-[12px] font-semibold text-gray-600 flex-1 truncate">{widget.title}</span>
              {isEditing && (
                <button
                  onClick={() => onRemoveWidget(widget.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            {/* 위젯 콘텐츠 */}
            <div className="flex-1 overflow-hidden p-2">
              {renderWidgetContent(widget, heightPx)}
            </div>
          </div>
        )
      })}
    </GridLayout>
  )
}
