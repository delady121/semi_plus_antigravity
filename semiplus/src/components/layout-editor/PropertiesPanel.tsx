import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'
import type { Equipment } from '../../types'

interface Props {
  equipment: Equipment[]
}

const statusLabel: Record<string, string> = {
  OPERATING: '운영중', PLANNED_IN: '반입예정', PLANNED_OUT: '반출예정', REMOVED: '반출완료'
}

const investLabel: Record<string, string> = {
  NEW: '신규', EXPANSION: '증설', REPLACEMENT: '교체', RELOCATION: '이전'
}

export const PropertiesPanel: React.FC<Props> = ({ equipment }) => {
  const { selectedEquipmentIds, placements } = useLayoutEditorStore()

  const selectedId = selectedEquipmentIds[0]
  const selectedEq = equipment.find(e => e.id === selectedId)
  const placement = placements.find(p => p.equipment_id === selectedId)

  // Rough dead space calc
  const placedEq = placements
    .map(p => equipment.find(e => e.id === p.equipment_id))
    .filter(Boolean) as Equipment[]
  const occupiedArea = placedEq.reduce((sum, e) =>
    sum + ((e.width_mm + e.maintenance_space_mm) * (e.depth_mm + e.maintenance_space_mm)) / 1_000_000, 0)

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Dead Space Info */}
      <div className="p-3 border-b border-gray-100 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <SquareDashedIcon />
          <span className="text-xs font-semibold text-gray-600">공간 분석</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-500">점유 면적</p>
            <p className="text-sm font-bold text-gray-800">{occupiedArea.toFixed(1)} m²</p>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-500">배치 설비</p>
            <p className="text-sm font-bold text-gray-800">{placements.length}대</p>
          </div>
        </div>
      </div>

      {/* Selected Equipment Properties */}
      {selectedEq ? (
        <div className="p-3 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-600">선택된 설비</span>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-400">설비번호</p>
              <p className="text-sm font-semibold text-gray-800">{selectedEq.equipment_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">설비명</p>
              <p className="text-sm text-gray-700">{selectedEq.name}</p>
            </div>
            {selectedEq.model && (
              <div>
                <p className="text-xs text-gray-400">모델</p>
                <p className="text-sm text-gray-700">{selectedEq.model}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400">상태</p>
                <p className="text-sm text-gray-700">{statusLabel[selectedEq.status]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">투자구분</p>
                <p className="text-sm text-gray-700">{selectedEq.investment_type ? investLabel[selectedEq.investment_type] : '-'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">치수 정보</p>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-gray-50 rounded p-1.5 text-center">
                  <p className="text-xs text-gray-400">폭</p>
                  <p className="text-xs font-bold text-gray-700">{selectedEq.width_mm}mm</p>
                </div>
                <div className="bg-gray-50 rounded p-1.5 text-center">
                  <p className="text-xs text-gray-400">깊이</p>
                  <p className="text-xs font-bold text-gray-700">{selectedEq.depth_mm}mm</p>
                </div>
                <div className="bg-gray-50 rounded p-1.5 text-center">
                  <p className="text-xs text-gray-400">유지보수</p>
                  <p className="text-xs font-bold text-gray-700">{selectedEq.maintenance_space_mm}mm</p>
                </div>
              </div>
            </div>

            {placement && (
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">배치 정보</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-xs text-gray-400">X 좌표</p>
                    <p className="text-xs font-bold text-gray-700">{Math.round(placement.x * 10)}mm</p>
                  </div>
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-xs text-gray-400">Y 좌표</p>
                    <p className="text-xs font-bold text-gray-700">{Math.round(placement.y * 10)}mm</p>
                  </div>
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-xs text-gray-400">회전</p>
                    <p className="text-xs font-bold text-gray-700">{placement.rotation}°</p>
                  </div>
                  <div className="bg-gray-50 rounded p-1.5">
                    <p className="text-xs text-gray-400">레이어</p>
                    <p className="text-xs font-bold text-gray-700">{placement.layer}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedEq.planned_in_date && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-700">
                  반입 예정: {new Date(selectedEq.planned_in_date).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Info size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">설비를 선택하면<br />속성이 표시됩니다</p>
          </div>
        </div>
      )}
    </div>
  )
}

const SquareDashedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
)
