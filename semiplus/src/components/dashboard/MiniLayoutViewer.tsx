import React, { useState } from 'react'
import type { FabBay, Equipment, LayoutPlan } from '../../types'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  bays: FabBay[]
  equipment: Equipment[]
  plans: LayoutPlan[]
}

const statusColors: Record<string, string> = {
  OPERATING: '#3b82f6',
  PLANNED_IN: '#22c55e',
  PLANNED_OUT: '#f97316',
  REMOVED: '#94a3b8',
}

export const MiniLayoutViewer: React.FC<Props> = ({ bays, equipment, plans }) => {
  const [selectedBayId, setSelectedBayId] = useState(bays[0]?.id ?? '')
  const [showPlannedIn, setShowPlannedIn] = useState(true)
  const [showPlannedOut, setShowPlannedOut] = useState(true)
  const [showOperating, setShowOperating] = useState(true)

  const bay = bays.find(b => b.id === selectedBayId)
  const bayEquip = equipment.filter(e => e.fab_bay_id === selectedBayId)

  const plan = plans.find(p => p.fab_bay_id === selectedBayId && p.canvas_snapshot)
  const placements = plan?.canvas_snapshot?.placements ?? []

  // Canvas dimensions
  const W = 520
  const H = 300

  // Distribute equipment on a simple grid if no placement
  const getEquipPos = (idx: number, eq: Equipment) => {
    const col = idx % 5
    const row = Math.floor(idx / 5)
    const px = 20 + col * 100
    const py = 20 + row * 80
    const pw = Math.min(80, (eq.width_mm / 4000) * W * 0.5)
    const ph = Math.min(60, (eq.depth_mm / 4000) * H * 0.5)
    return { px, py, pw, ph }
  }

  const isVisible = (status: string) => {
    if (status === 'OPERATING') return showOperating
    if (status === 'PLANNED_IN') return showPlannedIn
    if (status === 'PLANNED_OUT') return showPlannedOut
    return false
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">FAB Bay 미니 뷰어</h3>
        <select
          value={selectedBayId}
          onChange={e => setSelectedBayId(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          {bays.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Layer Toggle */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { label: '운영중', key: 'operating', active: showOperating, toggle: () => setShowOperating(v => !v), color: '#3b82f6' },
          { label: '반입예정', key: 'planned_in', active: showPlannedIn, toggle: () => setShowPlannedIn(v => !v), color: '#22c55e' },
          { label: '반출예정', key: 'planned_out', active: showPlannedOut, toggle: () => setShowPlannedOut(v => !v), color: '#f97316' },
        ].map(item => (
          <button
            key={item.key}
            onClick={item.toggle}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              item.active ? 'border-transparent text-white' : 'bg-white border-gray-300 text-gray-500'
            }`}
            style={item.active ? { backgroundColor: item.color } : {}}
          >
            {item.active ? <Eye size={11} /> : <EyeOff size={11} />}
            {item.label}
          </button>
        ))}
      </div>

      {/* Mini Canvas */}
      <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * W / 10} y1={0} x2={i * W / 10} y2={H} stroke="#e5e7eb" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * H / 6} x2={W} y2={i * H / 6} stroke="#e5e7eb" strokeWidth={0.5} />
          ))}

          {/* OHT Rails */}
          {[60, 160, 260].map((y, i) => (
            <line key={`oht${i}`} x1={0} y1={y} x2={W} y2={y} stroke="#fb923c" strokeWidth={3} strokeDasharray="12,6" opacity={0.6} />
          ))}

          {/* Equipment */}
          {bayEquip.map((eq, idx) => {
            if (!isVisible(eq.status)) return null
            const placement = placements.find(p => p.equipment_id === eq.id)
            let px, py, pw, ph
            if (placement) {
              const scale = W / 6000
              px = placement.x * scale
              py = placement.y * scale
              pw = (eq.width_mm / 1000) * 30
              ph = (eq.depth_mm / 1000) * 24
            } else {
              const pos = getEquipPos(idx, eq)
              px = pos.px; py = pos.py; pw = pos.pw; ph = pos.ph
            }
            const color = statusColors[eq.status] ?? '#94a3b8'
            return (
              <g key={eq.id}>
                <rect
                  x={px} y={py} width={pw} height={ph}
                  fill={color} fillOpacity={0.8}
                  stroke={color} strokeWidth={1.5}
                  rx={3}
                />
                <text
                  x={px + pw / 2} y={py + ph / 2 + 3}
                  textAnchor="middle" fontSize={8}
                  fill="white" fontWeight="600"
                >
                  {eq.equipment_no.split('-')[0]}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        {bay && (
          <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-500 border border-gray-200">
            {bay.name} | {bay.area_sqm.toLocaleString()} m²
          </div>
        )}
      </div>
    </div>
  )
}
