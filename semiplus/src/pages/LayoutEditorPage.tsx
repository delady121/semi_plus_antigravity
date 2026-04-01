import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../components/layout/PageLayout'
import { LayerPanel } from '../components/layout-editor/LayerPanel'
import { PropertiesPanel } from '../components/layout-editor/PropertiesPanel'
import { EditorCanvas } from '../components/layout-editor/EditorCanvas'
import { EditorToolbar } from '../components/layout-editor/EditorToolbar'
import { mockService } from '../services/mockData'
import { useLayoutEditorStore } from '../stores/layoutEditorStore'
import type { Equipment } from '../types'

export const LayoutEditorPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const [_dragEquipment, _setDragEquipment] = useState<Equipment | null>(null)

  const { setPlacements, setCurrentBay, setIsDirty } = useLayoutEditorStore()

  const { data: equipment = [], isLoading: eqLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  const { data: bays = [] } = useQuery({
    queryKey: ['fabBays'],
    queryFn: mockService.getFabBays,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['layoutPlans'],
    queryFn: mockService.getLayoutPlans,
  })

  // Load initial placements from a plan
  useEffect(() => {
    if (plans.length > 0 && bays.length > 0) {
      const plan = plans.find(p => p.canvas_snapshot)
      if (plan?.canvas_snapshot) {
        setPlacements(plan.canvas_snapshot.placements)
      }
      setCurrentBay(bays[0])
    }
  }, [plans, bays])

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setCanvasSize({
        w: el.clientWidth,
        h: el.clientHeight - 40, // subtract status bar
      })
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
    <div className="fixed inset-0 flex flex-col" style={{ paddingTop: 60, paddingLeft: 240 }}>
      {/* Toolbar */}
      <EditorToolbar onSave={handleSave} onRequestReview={handleRequestReview} />

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Layer Panel */}
        <div style={{ width: 200, minWidth: 200 }} className="flex flex-col overflow-hidden border-r border-gray-200">
          <LayerPanel
            equipment={equipment}
            onDragEquipment={(eq) => _setDragEquipment(eq)}
          />
        </div>

        {/* Center: Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden relative">
          <EditorCanvas
            equipment={equipment}
            containerWidth={canvasSize.w}
            containerHeight={canvasSize.h}
          />
        </div>

        {/* Right: Properties Panel */}
        <div style={{ width: 280, minWidth: 280 }} className="flex flex-col overflow-hidden border-l border-gray-200">
          <PropertiesPanel equipment={equipment} />
        </div>
      </div>
    </div>
  )
}
