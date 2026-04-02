import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Pencil, Check, RefreshCw, LayoutDashboard, Trash2, X,
} from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { DashboardGrid } from '../components/dashboard/DashboardGrid'
import { AddWidgetModal } from '../components/dashboard/AddWidgetModal'
import { useDashboardStore } from '../stores/dashboardStore'
import { mockService } from '../services/mockData'
import { useNotificationStore } from '../stores/notificationStore'
import { useAuthStore } from '../stores/authStore'
import type { WidgetConfig } from '../stores/dashboardStore'

export const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [showCreateDash, setShowCreateDash] = useState(false)
  const [newDashName, setNewDashName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { currentUser } = useAuthStore()
  const { setNotifications, notifications } = useNotificationStore()
  const { dashboards, addDashboard, updateWidgets, addWidget, removeWidget, deleteDashboard } = useDashboardStore()

  // 현재 대시보드 결정 (URL id 또는 첫 번째)
  const currentDashboard = id
    ? dashboards.find(d => d.id === id) ?? dashboards[0]
    : dashboards[0]

  // 데이터 로드
  const { data: equipment = [], isLoading } = useQuery({
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

  // 컨테이너 너비 측정
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCreateDashboard = () => {
    if (!newDashName.trim()) return
    const newDash = {
      id: `dash_${Date.now()}`,
      name: newDashName.trim(),
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addDashboard(newDash)
    navigate(`/dashboard/${newDash.id}`)
    setNewDashName('')
    setShowCreateDash(false)
  }

  const handleAddWidget = (widget: Omit<WidgetConfig, 'x' | 'y'>) => {
    if (!currentDashboard) return
    // 빈 위치 찾기 (간단히 y=맨 아래)
    const maxY = currentDashboard.widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0)
    addWidget(currentDashboard.id, { ...widget, x: 0, y: maxY })
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col h-full">
        {/* 대시보드 헤더 */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white shrink-0">
          <LayoutDashboard size={16} className="text-brand-500" />
          <h1 className="text-base font-bold text-gray-900 flex-1">
            {currentDashboard?.name ?? '대시보드'}
          </h1>

          {/* 대시보드 탭 전환 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {dashboards.map(d => (
              <button
                key={d.id}
                onClick={() => { navigate(`/dashboard/${d.id}`); setIsEditing(false) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  currentDashboard?.id === d.id
                    ? 'bg-white shadow-sm text-gray-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d.name}
              </button>
            ))}
            <button
              onClick={() => setShowCreateDash(true)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
              title="새 대시보드"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* 편집/완료 + 위젯 추가 */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddWidget(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors"
              >
                <Plus size={14} />
                위젯 추가
              </button>
              {currentDashboard?.id !== 'default' && (
                <button
                  onClick={() => setConfirmDeleteId(currentDashboard?.id ?? null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              )}
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Check size={14} />
                편집 완료
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} />
              편집
            </button>
          )}
        </div>

        {/* 편집 모드 안내 */}
        {isEditing && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 shrink-0">
            <p className="text-[12px] text-amber-700 font-medium">
              ✎ 편집 모드 — 위젯을 드래그하여 이동하고 모서리를 드래그하여 크기를 조절하세요.
            </p>
          </div>
        )}

        {/* 그리드 영역 */}
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50 px-3">
          {currentDashboard && (
            currentDashboard.widgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <LayoutDashboard size={40} className="mb-4 opacity-30" />
                <p className="text-sm font-medium text-gray-500 mb-2">위젯이 없습니다</p>
                <p className="text-xs text-gray-400 mb-4">편집 모드에서 위젯을 추가하세요</p>
                <button
                  onClick={() => { setIsEditing(true); setShowAddWidget(true) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors"
                >
                  <Plus size={14} />
                  위젯 추가
                </button>
              </div>
            ) : (
              <DashboardGrid
                widgets={currentDashboard.widgets}
                isEditing={isEditing}
                containerWidth={containerWidth - 24}
                equipment={equipment}
                bays={bays}
                plans={plans}
                notifications={notifications}
                auditLogs={auditLogs}
                onLayoutChange={(widgets) => updateWidgets(currentDashboard.id, widgets)}
                onRemoveWidget={(wid) => removeWidget(currentDashboard.id, wid)}
              />
            )
          )}
        </div>
      </div>

      {/* 위젯 추가 모달 */}
      {showAddWidget && (
        <AddWidgetModal
          onAdd={handleAddWidget}
          onClose={() => setShowAddWidget(false)}
        />
      )}

      {/* 새 대시보드 생성 */}
      {showCreateDash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateDash(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 p-5 w-80 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">새 대시보드</h3>
              <button onClick={() => setShowCreateDash(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            <input
              type="text"
              placeholder="대시보드 이름"
              value={newDashName}
              onChange={e => setNewDashName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateDashboard() }}
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400 mb-3 transition-all"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreateDash(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">취소</button>
              <button
                onClick={handleCreateDashboard}
                disabled={!newDashName.trim()}
                className="px-4 py-1.5 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-400 disabled:opacity-40 transition-all"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 대시보드 삭제 확인 */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-80">
            <h3 className="text-base font-bold text-gray-900 mb-2">대시보드 삭제</h3>
            <p className="text-sm text-gray-600 mb-5">
              '{dashboards.find(d => d.id === confirmDeleteId)?.name}' 대시보드를 삭제합니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">취소</button>
              <button
                onClick={() => {
                  deleteDashboard(confirmDeleteId)
                  setConfirmDeleteId(null)
                  navigate('/dashboard')
                  setIsEditing(false)
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
