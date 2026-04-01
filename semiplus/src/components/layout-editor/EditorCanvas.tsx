import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Line, Text, Circle, Arrow, Group } from 'react-konva'
import type Konva from 'konva'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'
import type { Equipment, EquipmentPlacement } from '../../types'

interface Props {
  equipment: Equipment[]
  containerWidth: number
  containerHeight: number
}

const STATUS_COLORS: Record<string, string> = {
  OPERATING: '#3b82f6',
  PLANNED_IN: '#22c55e',
  PLANNED_OUT: '#f97316',
  REMOVED: '#94a3b8',
}

const GRID_SIZE = 60 // pixels representing 600mm

export const EditorCanvas: React.FC<Props> = ({ equipment, containerWidth, containerHeight }) => {
  const {
    layers, placements, customShapes,
    selectedEquipmentIds, toolMode, zoomLevel, canvasOffset,
    setSelectedEquipmentIds, addSelectedEquipmentId,
    updatePlacement, addPlacement, pushHistory,
    setZoomLevel, setCanvasOffset,
  } = useLayoutEditorStore()

  const stageRef = useRef<Konva.Stage>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const isLayerVisible = (code: string) => layers.find(l => l.code === code)?.visible ?? true
  const isLayerLocked = (code: string) => layers.find(l => l.code === code)?.locked ?? false

  // Mouse wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(zoomLevel + delta)
  }, [zoomLevel, setZoomLevel])

  // Stage drag (pan)
  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setCanvasOffset({ x: e.target.x(), y: e.target.y() })
    }
  }

  // Equipment click
  const handleEquipClick = (equipId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (e.evt.shiftKey) {
      addSelectedEquipmentId(equipId)
    } else {
      setSelectedEquipmentIds([equipId])
    }
  }

  // Stage click (deselect)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === stageRef.current || e.target.getClassName() === 'Stage') {
      setSelectedEquipmentIds([])
    }
  }

  // Mouse move (HUD)
  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = stageRef.current?.getPointerPosition()
    if (pos) {
      setMousePos({
        x: Math.round((pos.x - canvasOffset.x) / zoomLevel * 10),
        y: Math.round((pos.y - canvasOffset.y) / zoomLevel * 10),
      })
    }
  }

  // Drop from layer panel
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const equipId = e.dataTransfer.getData('equipment_id')
    if (!equipId) return
    const eq = equipment.find(e2 => e2.id === equipId)
    if (!eq) return

    const stageEl = stageRef.current?.container()
    if (!stageEl) return
    const rect = stageEl.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvasOffset.x) / zoomLevel
    const y = (e.clientY - rect.top - canvasOffset.y) / zoomLevel

    // Snap to grid
    const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE
    const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE

    // Check if already placed
    const existing = placements.find(p => p.equipment_id === equipId)
    if (existing) {
      pushHistory()
      updatePlacement(existing.id, { x: snapX, y: snapY })
    } else {
      const newPlacement: EquipmentPlacement = {
        id: `pl_${Date.now()}`,
        plan_id: 'current',
        equipment_id: equipId,
        x: snapX,
        y: snapY,
        rotation: 0,
        layer: 'L5',
        is_fixed: false,
      }
      addPlacement(newPlacement)
    }
    setSelectedEquipmentIds([equipId])
  }

  // Equipment drag
  const handleEquipDragEnd = (placement: EquipmentPlacement, e: Konva.KonvaEventObject<DragEvent>) => {
    const snapX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE
    const snapY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE
    updatePlacement(placement.id, { x: snapX, y: snapY })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        useLayoutEditorStore.getState().undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        useLayoutEditorStore.getState().redo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedEquipmentIds: ids, placements: pl } = useLayoutEditorStore.getState()
        ids.forEach(eid => {
          const p = pl.find(p2 => p2.equipment_id === eid)
          if (p) useLayoutEditorStore.getState().removePlacement(p.id)
        })
        useLayoutEditorStore.getState().setSelectedEquipmentIds([])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const W = containerWidth
  const H = containerHeight

  return (
    <div
      className="flex-1 overflow-hidden bg-gray-200 relative"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={W}
        height={H}
        scaleX={zoomLevel}
        scaleY={zoomLevel}
        x={canvasOffset.x}
        y={canvasOffset.y}
        draggable={toolMode === 'move'}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
      >
        {/* L1: Background */}
        {isLayerVisible('L1') && (
          <Layer>
            <Rect x={0} y={0} width={3000} height={2000} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
            {/* Room label */}
            <Text x={10} y={10} text="FAB Bay" fontSize={14} fill="#94a3b8" fontStyle="bold" />
          </Layer>
        )}

        {/* L4: 600mm Grid */}
        {isLayerVisible('L4') && (
          <Layer>
            {Array.from({ length: Math.ceil(3000 / GRID_SIZE) + 1 }).map((_, i) => (
              <Line
                key={`v${i}`}
                points={[i * GRID_SIZE, 0, i * GRID_SIZE, 2000]}
                stroke="#e2e8f0"
                strokeWidth={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(2000 / GRID_SIZE) + 1 }).map((_, i) => (
              <Line
                key={`h${i}`}
                points={[0, i * GRID_SIZE, 3000, i * GRID_SIZE]}
                stroke="#e2e8f0"
                strokeWidth={0.5}
              />
            ))}
          </Layer>
        )}

        {/* L2: Placement Area */}
        {isLayerVisible('L2') && (
          <Layer>
            <Rect
              x={60} y={60} width={2880} height={1880}
              fill="#eff6ff" stroke="#bfdbfe" strokeWidth={2} opacity={0.5}
            />
            <Text x={70} y={70} text="배치 가능 영역" fontSize={12} fill="#93c5fd" />
          </Layer>
        )}

        {/* L3: OHT Rails */}
        {isLayerVisible('L3') && (
          <Layer>
            {[360, 720, 1080, 1440].map((y, i) => (
              <React.Fragment key={`oht${i}`}>
                <Line points={[0, y, 3000, y]} stroke="#f97316" strokeWidth={6} opacity={0.7} />
                <Text x={10} y={y - 14} text={`OHT Rail ${i + 1}`} fontSize={10} fill="#f97316" />
              </React.Fragment>
            ))}
          </Layer>
        )}

        {/* L5: Equipment */}
        {isLayerVisible('L5') && (
          <Layer>
            {placements.map(placement => {
              const eq = equipment.find(e => e.id === placement.equipment_id)
              if (!eq) return null

              const scale = 1 / 14 // 1px = ~14mm roughly
              const w = Math.max(40, eq.width_mm * scale)
              const h = Math.max(30, eq.depth_mm * scale)
              const maint = eq.maintenance_space_mm * scale
              const color = STATUS_COLORS[eq.status] ?? '#94a3b8'
              const isSelected = selectedEquipmentIds.includes(eq.id)

              return (
                <Group
                  key={placement.id}
                  x={placement.x}
                  y={placement.y}
                  rotation={placement.rotation}
                  draggable={!isLayerLocked('L5')}
                  onClick={(e) => handleEquipClick(eq.id, e)}
                  onDragEnd={(e) => handleEquipDragEnd(placement, e)}
                >
                  {/* Maintenance space */}
                  <Rect
                    x={-maint} y={-maint}
                    width={w + maint * 2} height={h + maint * 2}
                    fill={color} opacity={0.1}
                    stroke={color} strokeWidth={0.5} strokeDashArray={[4, 4]}
                  />
                  {/* Equipment body */}
                  <Rect
                    width={w} height={h}
                    fill={color} opacity={isSelected ? 1 : 0.85}
                    stroke={isSelected ? '#facc15' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    cornerRadius={3}
                    shadowColor={isSelected ? '#facc15' : 'transparent'}
                    shadowBlur={isSelected ? 8 : 0}
                  />
                  {/* Equipment text */}
                  <Text
                    x={2} y={4}
                    width={w - 4}
                    text={eq.equipment_no}
                    fontSize={9}
                    fill="white"
                    fontStyle="bold"
                    align="center"
                  />
                  <Text
                    x={2} y={h / 2}
                    width={w - 4}
                    text={eq.name.length > 10 ? eq.name.slice(0, 10) + '…' : eq.name}
                    fontSize={8}
                    fill="rgba(255,255,255,0.85)"
                    align="center"
                  />
                </Group>
              )
            })}
          </Layer>
        )}

        {/* L6: User Markings */}
        {isLayerVisible('L6') && (
          <Layer>
            {customShapes.map(shape => {
              if (shape.type === 'rect') {
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x} y={shape.y}
                    width={shape.width ?? 100} height={shape.height ?? 60}
                    stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                    fill={shape.color ? shape.color + '20' : '#ec489920'}
                  />
                )
              }
              if (shape.type === 'circle') {
                return (
                  <Circle
                    key={shape.id}
                    x={shape.x} y={shape.y}
                    radius={(shape.width ?? 50) / 2}
                    stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                    fill={shape.color ? shape.color + '20' : '#ec489920'}
                  />
                )
              }
              if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    x={shape.x} y={shape.y}
                    text={shape.text ?? '텍스트'}
                    fontSize={14}
                    fill={shape.color ?? '#1e293b'}
                  />
                )
              }
              if (shape.type === 'arrow') {
                return (
                  <Arrow
                    key={shape.id}
                    points={[shape.x, shape.y, shape.x + (shape.width ?? 100), shape.y]}
                    stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                    fill={shape.color ?? '#ec4899'}
                  />
                )
              }
              return null
            })}
          </Layer>
        )}

        {/* L7: Review / Optimization Results */}
        {isLayerVisible('L7') && (
          <Layer>
            {/* Sample optimization suggestions */}
            <Rect
              x={200} y={800} width={120} height={90}
              stroke="#10b981" strokeWidth={2} strokeDashArray={[6, 3]}
              fill="#10b98120"
            />
            <Text x={205} y={805} text="추천 위치" fontSize={10} fill="#10b981" fontStyle="bold" />
            {/* Sample warning */}
            <Rect
              x={500} y={400} width={100} height={80}
              stroke="#ef4444" strokeWidth={2} strokeDashArray={[4, 3]}
              fill="#ef444420"
            />
            <Text x={505} y={405} text="⚠ 간격 부족" fontSize={10} fill="#ef4444" fontStyle="bold" />
          </Layer>
        )}
      </Stage>

      {/* HUD Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-800 bg-opacity-90 flex items-center px-3 gap-4 text-xs text-slate-300 pointer-events-none">
        <span>줌: {Math.round(zoomLevel * 100)}%</span>
        <span>|</span>
        <span>X: {mousePos.x}mm Y: {mousePos.y}mm</span>
        <span>|</span>
        <span>선택: {selectedEquipmentIds.length}개</span>
        <span>|</span>
        <span>배치: {placements.length}대</span>
        <span>|</span>
        <span className={useLayoutEditorStore.getState().isDirty ? 'text-yellow-400' : 'text-green-400'}>
          {useLayoutEditorStore.getState().isDirty ? '● 미저장' : '✓ 저장됨'}
        </span>
      </div>
    </div>
  )
}
