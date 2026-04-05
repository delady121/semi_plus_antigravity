import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Rect, Line, Text, Circle, Arrow, Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'
import type { Equipment, EquipmentPlacement } from '../../types'
import type { LayoutItem, PlacementZone, OhtRailSegment } from '../../stores/layoutStore'

interface Props {
  equipment: Equipment[]
  containerWidth: number
  containerHeight: number
  readonly?: boolean
  layout?: LayoutItem
  onUpdateLayout?: (updates: Partial<LayoutItem>) => void
}

const STATUS_COLORS: Record<string, string> = {
  OPERATING: '#3b82f6',
  PLANNED_IN: '#22c55e',
  PLANNED_OUT: '#f97316',
  REMOVED: '#94a3b8',
}

const DEFAULT_CANVAS_W = 3000
const DEFAULT_CANVAS_H = 2000

// 두 좌표 사이 각도를 45° 단위로 스냅한 끝점 반환
function snap45(x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
  const dist = Math.sqrt(dx * dx + dy * dy)
  return {
    x: x1 + Math.cos(snapped) * dist,
    y: y1 + Math.sin(snapped) * dist,
  }
}

export const EditorCanvas: React.FC<Props> = ({
  equipment, containerWidth, containerHeight, readonly = false, layout, onUpdateLayout,
}) => {
  const {
    layers, placements, customShapes,
    selectedEquipmentIds, toolMode, zoomLevel, canvasOffset,
    setSelectedEquipmentIds, addSelectedEquipmentId,
    updatePlacement, addPlacement, pushHistory,
    setZoomLevel, setCanvasOffset,
  } = useLayoutEditorStore()

  const stageRef = useRef<Konva.Stage>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [canvasNativeSize, setCanvasNativeSize] = useState({ w: DEFAULT_CANVAS_W, h: DEFAULT_CANVAS_H })

  // 배치영역 드래그 드로잉 상태
  const [zoneDrawStart, setZoneDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [zoneDrawCurrent, setZoneDrawCurrent] = useState<{ x: number; y: number } | null>(null)

  // OHT 레일 드로잉 상태
  const [ohtPoints, setOhtPoints] = useState<number[]>([])  // 확정된 꺾임점 목록
  const [ohtPreview, setOhtPreview] = useState<{ x: number; y: number } | null>(null)  // 마우스 위치 프리뷰

  const isLayerVisible = (code: string) => layers.find(l => l.code === code)?.visible ?? true
  const isLayerLocked = (code: string) => layers.find(l => l.code === code)?.locked ?? false

  // 배경 이미지 로드
  useEffect(() => {
    if (!layout?.backgroundImageData) {
      setBgImage(null)
      return
    }
    const img = new window.Image()
    img.onload = () => {
      setBgImage(img)
      setCanvasNativeSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = layout.backgroundImageData
  }, [layout?.backgroundImageData])

  // 격자 픽셀 크기 계산
  const gridPx = layout?.scaleMmPerPx
    ? layout.gridSizeMm / layout.scaleMmPerPx
    : 60  // 기본 60px

  const CW = canvasNativeSize.w
  const CH = canvasNativeSize.h

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

  // 스테이지 포인터 → 캔버스 월드 좌표 변환
  const getCanvasPos = useCallback((): { x: number; y: number } | null => {
    const pos = stageRef.current?.getRelativePointerPosition()
    return pos ? { x: pos.x, y: pos.y } : null
  }, [])

  // Stage click (deselect, 또는 OHT 점 추가)
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly) return
    const isStageTarget = e.target === stageRef.current || e.target.getClassName() === 'Stage'

    if (toolMode === 'oht') {
      // 더블클릭은 handleStageDblClick에서 처리하므로 단순 클릭만
      if (e.evt.detail > 1) return
      const pos = getCanvasPos()
      if (!pos) return
      if (ohtPoints.length >= 2) {
        const lastX = ohtPoints[ohtPoints.length - 2]
        const lastY = ohtPoints[ohtPoints.length - 1]
        const snapped = snap45(lastX, lastY, pos.x, pos.y)
        setOhtPoints(prev => [...prev, snapped.x, snapped.y])
      } else {
        setOhtPoints(prev => [...prev, pos.x, pos.y])
      }
      return
    }

    if (isStageTarget && toolMode === 'select') {
      setSelectedEquipmentIds([])
    }
  }

  // OHT 레일 완성 (더블클릭)
  const handleStageDblClick = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly || toolMode !== 'oht') return
    if (ohtPoints.length >= 4) {
      const newRail: OhtRailSegment = {
        id: `rail_${Date.now()}`,
        points: ohtPoints,
      }
      onUpdateLayout?.({
        ohtRails: [...(layout?.ohtRails ?? []), newRail],
      })
    }
    setOhtPoints([])
    setOhtPreview(null)
  }

  // Mouse down — 배치영역 드래그 시작
  const handleMouseDown = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly || toolMode !== 'zone') return
    const pos = getCanvasPos()
    if (!pos) return
    setZoneDrawStart(pos)
    setZoneDrawCurrent(pos)
  }

  // Mouse up — 배치영역 확정
  const handleMouseUp = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly || toolMode !== 'zone') return
    if (!zoneDrawStart || !zoneDrawCurrent) return
    const x = Math.min(zoneDrawStart.x, zoneDrawCurrent.x)
    const y = Math.min(zoneDrawStart.y, zoneDrawCurrent.y)
    const width = Math.abs(zoneDrawCurrent.x - zoneDrawStart.x)
    const height = Math.abs(zoneDrawCurrent.y - zoneDrawStart.y)
    if (width > 10 && height > 10) {
      const newZone: PlacementZone = {
        id: `zone_${Date.now()}`,
        x, y, width, height,
        label: `배치영역 ${(layout?.placementZones?.length ?? 0) + 1}`,
      }
      onUpdateLayout?.({
        placementZones: [...(layout?.placementZones ?? []), newZone],
      })
    }
    setZoneDrawStart(null)
    setZoneDrawCurrent(null)
  }

  // Mouse move (HUD + 드로잉 프리뷰)
  const handleMouseMove = (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const rawPos = stageRef.current?.getPointerPosition()
    if (rawPos) {
      setMousePos({
        x: Math.round((rawPos.x - canvasOffset.x) / zoomLevel * 10),
        y: Math.round((rawPos.y - canvasOffset.y) / zoomLevel * 10),
      })
    }
    const pos = getCanvasPos()
    if (!pos) return
    if (toolMode === 'zone' && zoneDrawStart) {
      setZoneDrawCurrent(pos)
    }
    if (toolMode === 'oht' && ohtPoints.length >= 2) {
      const lastX = ohtPoints[ohtPoints.length - 2]
      const lastY = ohtPoints[ohtPoints.length - 1]
      const snapped = snap45(lastX, lastY, pos.x, pos.y)
      setOhtPreview(snapped)
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

    const snapX = Math.round(x / gridPx) * gridPx
    const snapY = Math.round(y / gridPx) * gridPx

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
    const snapX = Math.round(e.target.x() / gridPx) * gridPx
    const snapY = Math.round(e.target.y() / gridPx) * gridPx
    updatePlacement(placement.id, { x: snapX, y: snapY })
  }

  // Escape — OHT 드로잉 취소
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOhtPoints([])
        setOhtPreview(null)
        setZoneDrawStart(null)
        setZoneDrawCurrent(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* L1: 배경 이미지 또는 기본 배경 */}
        {isLayerVisible('L1') && (
          <Layer>
            {bgImage ? (
              <KonvaImage
                image={bgImage}
                x={0} y={0}
                width={CW} height={CH}
              />
            ) : (
              <>
                <Rect x={0} y={0} width={CW} height={CH} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
                <Text x={10} y={10} text="배경 이미지를 업로드하세요" fontSize={14} fill="#94a3b8" />
              </>
            )}
          </Layer>
        )}

        {/* L4: 격자 (layout.gridEnabled 시 표시) */}
        {isLayerVisible('L4') && layout?.gridEnabled && (
          <Layer>
            {Array.from({ length: Math.ceil(CW / gridPx) + 1 }).map((_, i) => (
              <Line
                key={`v${i}`}
                points={[i * gridPx, 0, i * gridPx, CH]}
                stroke="#64748b"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ))}
            {Array.from({ length: Math.ceil(CH / gridPx) + 1 }).map((_, i) => (
              <Line
                key={`h${i}`}
                points={[0, i * gridPx, CW, i * gridPx]}
                stroke="#64748b"
                strokeWidth={0.5}
                opacity={0.4}
              />
            ))}
          </Layer>
        )}

        {/* L2: 설비 배치 영역 (layout.placementZones 기반) */}
        {isLayerVisible('L2') && layout?.placementZones && layout.placementZones.length > 0 && (
          <Layer>
            {layout.placementZones.map(zone => (
              <React.Fragment key={zone.id}>
                <Rect
                  x={zone.x} y={zone.y}
                  width={zone.width} height={zone.height}
                  fill="#eff6ff" stroke="#3b82f6" strokeWidth={1.5} opacity={0.5}
                />
                {zone.label && (
                  <Text
                    x={zone.x + 6} y={zone.y + 6}
                    text={zone.label}
                    fontSize={11} fill="#3b82f6"
                  />
                )}
              </React.Fragment>
            ))}
          </Layer>
        )}

        {/* L3: OHT 레일 (layout.ohtRails 기반) */}
        {isLayerVisible('L3') && layout?.ohtRails && layout.ohtRails.length > 0 && (
          <Layer>
            {layout.ohtRails.map((rail, i) => (
              <React.Fragment key={rail.id}>
                <Line
                  points={rail.points}
                  stroke="#f97316"
                  strokeWidth={4}
                  opacity={0.8}
                  lineCap="round"
                  lineJoin="round"
                />
                <Text
                  x={rail.points[0] + 4}
                  y={rail.points[1] - 14}
                  text={`OHT Rail ${i + 1}`}
                  fontSize={10}
                  fill="#f97316"
                />
              </React.Fragment>
            ))}
          </Layer>
        )}

        {/* L5: 설비 배치 (일반 편집 모드) */}
        {isLayerVisible('L5') && placements.length > 0 && (
          <Layer>
            {placements.map(placement => {
              const eq = equipment.find(e => e.id === placement.equipment_id)
              if (!eq) return null

              const scale = 1 / 14
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
                  <Rect
                    x={-maint} y={-maint}
                    width={w + maint * 2} height={h + maint * 2}
                    fill={color} opacity={0.1}
                    stroke={color} strokeWidth={0.5} strokeDashArray={[4, 4]}
                  />
                  <Rect
                    width={w} height={h}
                    fill={color} opacity={isSelected ? 1 : 0.85}
                    stroke={isSelected ? '#facc15' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    cornerRadius={3}
                    shadowColor={isSelected ? '#facc15' : 'transparent'}
                    shadowBlur={isSelected ? 8 : 0}
                  />
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

        {/* L6: 사용자 마킹 */}
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
        {/* 드로잉 프리뷰 레이어 (배치영역 / OHT 레일) */}
        {!readonly && (
          <Layer>
            {/* 배치영역 드래그 프리뷰 */}
            {toolMode === 'zone' && zoneDrawStart && zoneDrawCurrent && (
              <Rect
                x={Math.min(zoneDrawStart.x, zoneDrawCurrent.x)}
                y={Math.min(zoneDrawStart.y, zoneDrawCurrent.y)}
                width={Math.abs(zoneDrawCurrent.x - zoneDrawStart.x)}
                height={Math.abs(zoneDrawCurrent.y - zoneDrawStart.y)}
                fill="#eff6ff"
                stroke="#3b82f6"
                strokeWidth={1.5}
                opacity={0.6}
                dash={[6, 3]}
              />
            )}
            {/* OHT 레일 드로잉 중 확정 경로 */}
            {toolMode === 'oht' && ohtPoints.length >= 4 && (
              <Line
                points={ohtPoints}
                stroke="#f97316"
                strokeWidth={4}
                opacity={0.9}
                lineCap="round"
                lineJoin="round"
              />
            )}
            {/* OHT 레일 프리뷰 (마지막 점 → 현재 마우스) */}
            {toolMode === 'oht' && ohtPoints.length >= 2 && ohtPreview && (
              <Line
                points={[
                  ohtPoints[ohtPoints.length - 2],
                  ohtPoints[ohtPoints.length - 1],
                  ohtPreview.x,
                  ohtPreview.y,
                ]}
                stroke="#f97316"
                strokeWidth={2}
                opacity={0.5}
                dash={[8, 4]}
                lineCap="round"
              />
            )}
            {/* OHT 첫 점 마커 */}
            {toolMode === 'oht' && ohtPoints.length >= 2 && (
              <Circle
                x={ohtPoints[0]} y={ohtPoints[1]}
                radius={5}
                fill="#f97316"
                opacity={0.8}
              />
            )}
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
