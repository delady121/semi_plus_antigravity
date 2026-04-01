import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, Search } from 'lucide-react'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'
import type { Equipment } from '../../types'

interface Props {
  equipment: Equipment[]
  onDragEquipment: (eq: Equipment) => void
}

const layerColors: Record<string, string> = {
  L1: '#64748b', L2: '#3b82f6', L3: '#f97316', L4: '#94a3b8',
  L5: '#8b5cf6', L6: '#ec4899', L7: '#10b981',
}

const statusLabel: Record<string, string> = {
  OPERATING: '운영', PLANNED_IN: '반입', PLANNED_OUT: '반출', REMOVED: '반출완료'
}

const statusColor: Record<string, string> = {
  OPERATING: 'bg-blue-100 text-blue-700',
  PLANNED_IN: 'bg-green-100 text-green-700',
  PLANNED_OUT: 'bg-orange-100 text-orange-700',
  REMOVED: 'bg-gray-100 text-gray-500',
}

export const LayerPanel: React.FC<Props> = ({ equipment, onDragEquipment }) => {
  const { layers, toggleLayerVisibility, toggleLayerLock } = useLayoutEditorStore()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'layers' | 'equipment'>('layers')

  const filteredEquip = equipment.filter(e =>
    e.status !== 'REMOVED' &&
    (e.name.includes(search) || e.equipment_no.includes(search))
  )

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'layers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          레이어
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'equipment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          설비
        </button>
      </div>

      {activeTab === 'layers' ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {layers.map(layer => (
            <div
              key={layer.code}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: layerColors[layer.code] ?? '#94a3b8' }}
              />
              <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                {layer.code}: {layer.name}
              </span>
              <button
                onClick={() => toggleLayerVisibility(layer.code)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                title={layer.visible ? '숨기기' : '표시'}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <button
                onClick={() => toggleLayerLock(layer.code)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                title={layer.locked ? '잠금해제' : '잠금'}
              >
                {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="설비 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {filteredEquip.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">검색 결과 없음</p>
            )}
            {filteredEquip.map(eq => (
              <div
                key={eq.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('equipment_id', eq.id)
                  onDragEquipment(eq)
                }}
                className="p-2 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing transition-colors"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-800 truncate">{eq.equipment_no}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor[eq.status] ?? ''}`}>
                    {statusLabel[eq.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{eq.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {eq.width_mm}×{eq.depth_mm}mm
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
