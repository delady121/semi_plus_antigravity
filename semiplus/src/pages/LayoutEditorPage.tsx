import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Eye, Settings2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../components/layout/PageLayout'
import { LayerPanel } from '../components/layout-editor/LayerPanel'
import { PropertiesPanel } from '../components/layout-editor/PropertiesPanel'
import { EditorCanvas } from '../components/layout-editor/EditorCanvas'
import { EditorToolbar } from '../components/layout-editor/EditorToolbar'
import { SetupWizard } from '../components/layout-editor/SetupWizard'
import { mockService } from '../services/mockData'
import { useLayoutEditorStore } from '../stores/layoutEditorStore'
import { useLayoutStore } from '../stores/layoutStore'
import type { Equipment } from '../types'

export const LayoutEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const [_dragEquipment, _setDragEquipment] = useState<Equipment | null>(null)

  const [showSetupWizard, setShowSetupWizard] = useState(false)

  const { setIsDirty } = useLayoutEditorStore()
  const { layouts, updateLayout } = useLayoutStore()

  const layout = id ? layouts.find(l => l.id === id) : null
  // 초기 미완료 또는 사용자가 재편집 요청 시 SetupWizard 표시
  const isSetupMode = layout && (!layout.isSetupComplete || showSetupWizard)

  const { data: equipment = [], isLoading: eqLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight - 40 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleSave = async () => {
    toast.loading('저장 중...', { id: 'save' })
    await new Promise(r => setTimeout(r, 500))
    setIsDirty(false)
    toast.success('저장되었습니다.', { id: 'save' })
  }

  const handleRequestReview = async () => {
    toast.loading('검토 요청 발송 중...', { id: 'review' })
    await new Promise(r => setTimeout(r, 800))
    toast.success('검토 요청이 발송되었습니다.', { id: 'review' })
  }

  // 11단계 설정 완료 처리
  const handleSetupComplete = () => {
    if (!id) return
    if (showSetupWizard) {
      // 재편집 완료 → 편집 모드 유지
      updateLayout(id, { isSetupComplete: true })
      setShowSetupWizard(false)
      toast.success('초기 설정이 수정되었습니다.')
    } else {
      // 최초 설정 완료 → 보기 화면으로 이동
      updateLayout(id, { isSetupComplete: true, setupStep: 11 })
      toast.success('초기 설정이 완료되었습니다!')
      navigate(`/layout/${id}`)
    }
  }

  if (eqLoading) {
    return (
      <PageLayout fullWidth>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout fullWidth>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Toolbar */}
        <div className="flex items-center border-b border-gray-200 bg-white">
          <EditorToolbar onSave={handleSave} onRequestReview={handleRequestReview} />
          {layout && (
            <div className="flex items-center gap-2 px-3 border-l border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{layout.name}</span>
              {layout.isSetupComplete && !showSetupWizard && (
                <>
                  <button
                    onClick={() => setShowSetupWizard(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 border border-amber-200 hover:bg-amber-50 transition-colors"
                  >
                    <Settings2 size={12} />
                    초기설정 수정
                  </button>
                  <button
                    onClick={() => navigate(`/layout/${id}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={12} />
                    보기로 전환
                  </button>
                </>
              )}
              {showSetupWizard && (
                <button
                  onClick={() => setShowSetupWizard(false)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <X size={12} />
                  설정 수정 취소
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3-Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* 초기 설정 모드: 왼쪽에 설정 위자드 */}
          {isSetupMode ? (
            <SetupWizard
              layout={layout}
              onUpdate={(updates) => id && updateLayout(id, updates)}
              onComplete={handleSetupComplete}
            />
          ) : (
            /* 일반 편집 모드: 레이어 패널 */
            <div style={{ width: 200, minWidth: 200 }} className="flex flex-col overflow-hidden border-r border-gray-200">
              <LayerPanel
                equipment={equipment}
                onDragEquipment={(eq) => _setDragEquipment(eq)}
              />
            </div>
          )}

          {/* Center: Canvas */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            <EditorCanvas
              equipment={equipment}
              containerWidth={canvasSize.w}
              containerHeight={canvasSize.h}
              layout={layout ?? undefined}
              onUpdateLayout={(updates) => id && updateLayout(id, updates)}
            />
          </div>

          {/* Right: Properties (일반 편집 모드에서만) */}
          {!isSetupMode && (
            <div style={{ width: 280, minWidth: 280 }} className="flex flex-col overflow-hidden border-l border-gray-200">
              <PropertiesPanel equipment={equipment} />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
