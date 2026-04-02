import React from 'react'
import { X, BarChart3, Table2, Map, Activity, Gauge } from 'lucide-react'
import type { WidgetType, WidgetConfig } from '../../stores/dashboardStore'

interface Props {
  onAdd: (widget: Omit<WidgetConfig, 'x' | 'y'>) => void
  onClose: () => void
}

const WIDGET_OPTIONS: {
  type: WidgetType
  label: string
  desc: string
  icon: React.ReactNode
  defaultW: number
  defaultH: number
}[] = [
  { type: 'KPI',      label: 'KPI 현황',          desc: '핵심 지표 4개 카드 표시',     icon: <Gauge size={20} className="text-blue-500" />,    defaultW: 12, defaultH: 3 },
  { type: 'CHART',    label: '설비 현황 차트',     desc: '설비 상태 차트 (바/파이)',    icon: <BarChart3 size={20} className="text-violet-500" />, defaultW: 6,  defaultH: 5 },
  { type: 'TABLE',    label: '반출입 일정 테이블', desc: '설비 반출입 예정 일정 표',   icon: <Table2 size={20} className="text-emerald-500" />,  defaultW: 6,  defaultH: 5 },
  { type: 'LAYOUT',   label: '레이아웃 도면',      desc: 'FAB 도면 미리보기',          icon: <Map size={20} className="text-orange-500" />,     defaultW: 8,  defaultH: 6 },
  { type: 'ACTIVITY', label: '최근 활동',           desc: '활동 피드 및 알림 목록',     icon: <Activity size={20} className="text-rose-500" />,   defaultW: 4,  defaultH: 6 },
]

export const AddWidgetModal: React.FC<Props> = ({ onAdd, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: '#1E293B', width: 500 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <span className="text-sm font-semibold text-white">위젯 추가</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 gap-2">
          {WIDGET_OPTIONS.map(opt => (
            <button
              key={opt.type}
              onClick={() => {
                onAdd({
                  id: `w_${opt.type.toLowerCase()}_${Date.now()}`,
                  type: opt.type,
                  title: opt.label,
                  w: opt.defaultW,
                  h: opt.defaultH,
                })
                onClose()
              }}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] text-left transition-all group"
            >
              <div className="shrink-0">{opt.icon}</div>
              <div>
                <p className="text-[13px] font-semibold text-white group-hover:text-white">{opt.label}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{opt.desc}</p>
              </div>
              <div className="ml-auto text-[10px] text-white/25 font-mono shrink-0">
                {opt.defaultW}×{opt.defaultH}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
