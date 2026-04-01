import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cpu, Calendar, SquareDashed, GitBranch, RefreshCw } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { KpiCard } from '../components/dashboard/KpiCard'
import { EquipmentStatusChart } from '../components/dashboard/EquipmentStatusChart'
import { ScheduledEquipmentTable } from '../components/dashboard/ScheduledEquipmentTable'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { MiniLayoutViewer } from '../components/dashboard/MiniLayoutViewer'
import { mockService } from '../services/mockData'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuthStore } from '../stores/authStore'

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const { setNotifications, notifications } = useNotificationStore()

  const { data: equipment = [], isLoading: eqLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['layoutPlans'],
    queryFn: mockService.getLayoutPlans,
  })

  const { data: bays = [] } = useQuery({
    queryKey: ['fabBays'],
    queryFn: mockService.getFabBays,
  })

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: mockService.getAuditLogs,
  })

  useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: () => currentUser ? mockService.getNotifications(currentUser.id) : Promise.resolve([]),
    enabled: !!currentUser,
    onSuccess: (data: import('../types').Notification[]) => setNotifications(data),
  } as Parameters<typeof useQuery>[0])

  // KPI calculations
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

  // Dead space estimation (total bay area - occupied equipment area)
  const totalBayArea = bays.reduce((sum, b) => sum + b.area_sqm, 0)
  const occupiedArea = equipment
    .filter(e => e.status === 'OPERATING' && e.fab_bay_id)
    .reduce((sum, e) => sum + (e.width_mm / 1000 + e.maintenance_space_mm / 1000) * (e.depth_mm / 1000 + e.maintenance_space_mm / 1000), 0)
  const deadSpace = Math.max(0, totalBayArea - occupiedArea)

  const activePlans = plans.filter(p => p.status === 'REVIEW_REQUESTED' || p.status === 'IN_PROGRESS').length

  if (eqLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="space-y-5">
        {/* Page Title */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Overview</p>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">대시보드</h1>
            <p className="text-[13px] text-slate-400 mt-1">
              {today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준 현황
            </p>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            title="총 설비 수"
            value={equipment.filter(e => e.status !== 'REMOVED').length}
            subtitle={`운영중 ${operatingCount}대 / 전체`}
            icon={<Cpu size={20} className="text-blue-600" />}
            iconBg="bg-blue-50"
            accentColor="bg-blue-500"
          />
          <KpiCard
            title="반입 예정 (D-30)"
            value={plannedIn30.length}
            subtitle={urgentCount > 0 ? `${urgentCount}건 D-7 이내 임박` : '임박 설비 없음'}
            icon={<Calendar size={20} className="text-orange-600" />}
            iconBg="bg-orange-50"
            accentColor="bg-orange-400"
            alert={urgentCount > 0}
          />
          <KpiCard
            title="Dead Space 면적"
            value={`${deadSpace.toFixed(0)} m²`}
            subtitle="전체 Bay 합산 추정"
            icon={<SquareDashed size={20} className="text-violet-600" />}
            iconBg="bg-violet-50"
            accentColor="bg-violet-500"
            trend={{ value: '전월 대비 -2.3%', positive: true }}
          />
          <KpiCard
            title="진행 중 기획안"
            value={activePlans}
            subtitle="검토요청 + 처리중"
            icon={<GitBranch size={20} className="text-brand-600" />}
            iconBg="bg-brand-50"
            accentColor="bg-brand-500"
          />
        </div>

        {/* Middle Row: Mini Viewer + Activity Feed */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8" style={{ minHeight: 340 }}>
            <MiniLayoutViewer bays={bays} equipment={equipment} plans={plans} />
          </div>
          <div className="col-span-4" style={{ minHeight: 340 }}>
            <ActivityFeed auditLogs={auditLogs} notifications={notifications} />
          </div>
        </div>

        {/* Bottom Row: Chart + Table */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <EquipmentStatusChart equipment={equipment} />
          </div>
          <div className="col-span-6">
            <ScheduledEquipmentTable equipment={equipment} />
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
