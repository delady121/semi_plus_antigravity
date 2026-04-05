import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Stage, Layer, Rect, Line, Text, Circle, Arrow, Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'
import { useDataTableStore } from '../../stores/dataTableStore'
import type { Equipment, EquipmentPlacement } from '../../types'
import type { LayoutItem, PlacementZone, OhtRailSegment } from '../../stores/layoutStore'

// OhtRailSegment 확장 타입 (label 필드 추가 — layoutStore 인터페이스 비변경)
type OhtRailWithLabel = OhtRailSegment & { label?: string }

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
    layers, placements, customShapes, generatedEquipments, generatedFacilities,
    selectedEquipmentIds, toolMode, zoomLevel, canvasOffset,
    highlightedZoneId, highlightedRailId, snapEnabled, clickableLayer,
    setSelectedEquipmentIds, addSelectedEquipmentId,
    updatePlacement, addPlacement, pushHistory,
    updateGeneratedEquipment,
    setZoomLevel, setCanvasOffset,
  } = useLayoutEditorStore()

  // 보기 모드(readonly)에서는 항상 select 모드로 동작
  const effectiveToolMode = readonly ? 'select' : toolMode

  const stageRef = useRef<Konva.Stage>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [canvasNativeSize, setCanvasNativeSize] = useState({ w: DEFAULT_CANVAS_W, h: DEFAULT_CANVAS_H })

  // 배치영역 드로잉 상태 (클릭 기반: 좌클릭 시작, 우클릭 완료)
  const [zoneDrawStart, setZoneDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [zoneDrawCurrent, setZoneDrawCurrent] = useState<{ x: number; y: number } | null>(null)

  // OHT 레일 드로잉 상태 (좌클릭으로 꼭지점, 우클릭으로 완료)
  const [ohtPoints, setOhtPoints] = useState<number[]>([])
  const [ohtPreview, setOhtPreview] = useState<{ x: number; y: number } | null>(null)

  // 배치영역 / OHT 레일 선택 상태
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedRailId, setSelectedRailId] = useState<string | null>(null)

  // 클립보드 (Ctrl+C/V)
  const [copiedZone, setCopiedZone] = useState<PlacementZone | null>(null)
  const [copiedRail, setCopiedRail] = useState<OhtRailSegment | null>(null)

  // 정보 입력 팝업 (그리기 완료 후 표시)
  const [infoPopup, setInfoPopup] = useState<{
    type: 'zone' | 'rail'
    pending: PlacementZone | OhtRailSegment
    label: string
  } | null>(null)

  // 배치영역 인라인 명칭 편집
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [editingZoneLabel, setEditingZoneLabel] = useState('')

  // OHT 레일 인라인 명칭 편집
  const [editingRailId, setEditingRailId] = useState<string | null>(null)
  const [editingRailLabel, setEditingRailLabel] = useState('')

  // 배치영역/OHT 변경 이력 (Ctrl+Z용 — 설비 이력과 별도 관리)
  const zoneRailHistoryRef = useRef<Array<{
    placementZones: PlacementZone[]
    ohtRails: OhtRailSegment[]
  }>>([])

  // 스냅 활성 좌표 (OHT 레일 그리기 중 강조 표시용)
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number } | null>(null)

  // 범위 선택 (rubber band)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)
  const selectionRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // 시설물 선택 상태
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)

  // 우클릭 패닝
  const isPanningRef = useRef(false)
  const panClientStartRef = useRef<{ x: number; y: number } | null>(null)
  const panOffsetStartRef = useRef<{ x: number; y: number } | null>(null)

  const isLayerVisible = (code: string) => layers.find(l => l.code === code)?.visible ?? true
  const isLayerLocked = (code: string) => layers.find(l => l.code === code)?.locked ?? false

  // 범위 선택 완료 처리
  const completeRubberBand = useCallback(() => {
    const rect = selectionRectRef.current
    selectionStartRef.current = null
    selectionRectRef.current = null
    setSelectionRect(null)
    if (!rect || rect.w < 6 || rect.h < 6) return
    const { x, y, w: rw, h: rh } = rect
    const inRect = (cx: number, cy: number) => cx >= x && cx <= x + rw && cy >= y && cy <= y + rh
    if (clickableLayer === 'equipment') {
      const placementIds = placements.filter(p => inRect(p.x, p.y)).map(p => p.equipment_id)
      const genIds = generatedEquipments.filter(eq => inRect(eq.x + eq.width / 2, eq.y + eq.height / 2)).map(eq => eq.id)
      setSelectedEquipmentIds([...placementIds, ...genIds])
      setSelectedZoneId(null)
      setSelectedRailId(null)
      setSelectedFacilityId(null)
    } else if (clickableLayer === 'zone') {
      const hit = (layout?.placementZones ?? []).find(z => inRect(z.x + z.width / 2, z.y + z.height / 2))
      setSelectedZoneId(hit?.id ?? null)
      setSelectedEquipmentIds([])
      setSelectedRailId(null)
      setSelectedFacilityId(null)
    } else if (clickableLayer === 'rail') {
      const hit = (layout?.ohtRails ?? []).find(r => {
        for (let i = 0; i < r.points.length; i += 2) {
          if (inRect(r.points[i], r.points[i + 1])) return true
        }
        return false
      })
      setSelectedRailId(hit?.id ?? null)
      setSelectedEquipmentIds([])
      setSelectedZoneId(null)
      setSelectedFacilityId(null)
    } else if (clickableLayer === 'facility') {
      const hit = generatedFacilities.find(f => inRect(f.x + f.width / 2, f.y + f.height / 2))
      setSelectedFacilityId(hit?.id ?? null)
      setSelectedEquipmentIds([])
      setSelectedZoneId(null)
      setSelectedRailId(null)
    }
  }, [clickableLayer, placements, generatedEquipments, layout, generatedFacilities, setSelectedEquipmentIds])

  // OHT 그리기 중 스냅 대상 좌표 목록
  const snapTargets = useMemo(() => {
    if (!snapEnabled) return []
    const pts: { x: number; y: number }[] = []
    ;(layout?.placementZones ?? []).forEach(zone => {
      pts.push({ x: zone.x, y: zone.y })
      pts.push({ x: zone.x + zone.width, y: zone.y })
      pts.push({ x: zone.x, y: zone.y + zone.height })
      pts.push({ x: zone.x + zone.width, y: zone.y + zone.height })
    })
    ;(layout?.ohtRails ?? []).forEach(rail => {
      for (let i = 0; i < rail.points.length; i += 2) {
        pts.push({ x: rail.points[i], y: rail.points[i + 1] })
      }
    })
    return pts
  }, [snapEnabled, layout?.placementZones, layout?.ohtRails])

  const SNAP_DIST_PX = 18 // 화면 픽셀 기준

  const applySnap = useCallback((pos: { x: number; y: number }): { x: number; y: number } => {
    if (!snapEnabled || snapTargets.length === 0) return pos
    const distInCanvas = SNAP_DIST_PX / zoomLevel
    for (const t of snapTargets) {
      const dx = pos.x - t.x
      const dy = pos.y - t.y
      if (Math.sqrt(dx * dx + dy * dy) <= distInCanvas) return t
    }
    return pos
  }, [snapEnabled, snapTargets, zoomLevel])

  // 배경 이미지 로드
  useEffect(() => {
    if (!layout?.backgroundImageData) { setBgImage(null); return }
    const img = new window.Image()
    img.onload = () => {
      setBgImage(img)
      setCanvasNativeSize({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.src = layout.backgroundImageData
  }, [layout?.backgroundImageData])

  const gridPx = layout?.scaleMmPerPx ? layout.gridSizeMm / layout.scaleMmPerPx : 60
  const CW = canvasNativeSize.w
  const CH = canvasNativeSize.h

  // ── 배치영역/OHT 이력 관리 ──────────────────────────────────

  const pushZoneRailHistory = useCallback(() => {
    zoneRailHistoryRef.current.push({
      placementZones: [...(layout?.placementZones ?? [])],
      ohtRails: [...(layout?.ohtRails ?? [])],
    })
    if (zoneRailHistoryRef.current.length > 50) zoneRailHistoryRef.current.shift()
  }, [layout?.placementZones, layout?.ohtRails])

  // ── 드로잉 완료 처리 ────────────────────────────────────────

  const completeZone = useCallback(() => {
    if (!zoneDrawStart || !zoneDrawCurrent) return
    const x = Math.min(zoneDrawStart.x, zoneDrawCurrent.x)
    const y = Math.min(zoneDrawStart.y, zoneDrawCurrent.y)
    const width = Math.abs(zoneDrawCurrent.x - zoneDrawStart.x)
    const height = Math.abs(zoneDrawCurrent.y - zoneDrawStart.y)
    if (width < 10 || height < 10) {
      setZoneDrawStart(null)
      setZoneDrawCurrent(null)
      return
    }
    const pending: PlacementZone = {
      id: `zone_${Date.now()}`,
      x, y, width, height,
      label: `배치영역 ${(layout?.placementZones?.length ?? 0) + 1}`,
    }
    setInfoPopup({ type: 'zone', pending, label: pending.label ?? '' })
    setZoneDrawStart(null)
    setZoneDrawCurrent(null)
  }, [zoneDrawStart, zoneDrawCurrent, layout?.placementZones?.length])

  const completeOhtRail = useCallback(() => {
    if (ohtPoints.length < 4) {
      setOhtPoints([])
      setOhtPreview(null)
      return
    }
    const pending: OhtRailSegment = {
      id: `rail_${Date.now()}`,
      points: [...ohtPoints],
    }
    setInfoPopup({
      type: 'rail',
      pending,
      label: `OHT 레일 ${(layout?.ohtRails?.length ?? 0) + 1}`,
    })
    setOhtPoints([])
    setOhtPreview(null)
  }, [ohtPoints, layout?.ohtRails?.length])

  // ── 팝업 처리 ───────────────────────────────────────────────

  const handleInfoConfirm = () => {
    if (!infoPopup) return
    pushZoneRailHistory()
    if (infoPopup.type === 'zone') {
      const zone = { ...(infoPopup.pending as PlacementZone), label: infoPopup.label || undefined }
      onUpdateLayout?.({ placementZones: [...(layout?.placementZones ?? []), zone] })
    } else {
      const rail = { ...(infoPopup.pending as OhtRailWithLabel), label: infoPopup.label || undefined }
      onUpdateLayout?.({ ohtRails: [...(layout?.ohtRails ?? []), rail as OhtRailSegment] })
    }
    setInfoPopup(null)
  }

  const handleInfoCancel = () => setInfoPopup(null)

  const handleZoneDblClick = (zone: PlacementZone, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly) return
    e.cancelBubble = true
    setEditingZoneId(zone.id)
    setEditingZoneLabel(zone.label ?? '')
    setSelectedZoneId(zone.id)
  }

  const commitZoneLabel = () => {
    if (!editingZoneId) return
    const updated = (layout?.placementZones ?? []).map(z =>
      z.id === editingZoneId ? { ...z, label: editingZoneLabel } : z
    )
    onUpdateLayout?.({ placementZones: updated })
    setEditingZoneId(null)
  }

  const handleRailDblClick = (rail: OhtRailSegment, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (readonly) return
    e.cancelBubble = true
    setEditingRailId(rail.id)
    setEditingRailLabel((rail as OhtRailWithLabel).label ?? '')
    setSelectedRailId(rail.id)
  }

  const commitRailLabel = () => {
    if (!editingRailId) return
    const updated = (layout?.ohtRails ?? []).map(r =>
      r.id === editingRailId ? ({ ...r, label: editingRailLabel } as OhtRailSegment) : r
    )
    onUpdateLayout?.({ ohtRails: updated })
    setEditingRailId(null)
  }

  // ── 마우스/키보드 이벤트 ────────────────────────────────────

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const delta = e.evt.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(zoomLevel + delta)
  }, [zoomLevel, setZoomLevel])

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setCanvasOffset({ x: e.target.x(), y: e.target.y() })
    }
  }

  const handleEquipClick = (equipId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (clickableLayer !== 'equipment') return
    if (e.evt.shiftKey) addSelectedEquipmentId(equipId)
    else setSelectedEquipmentIds([equipId])
    setSelectedZoneId(null)
    setSelectedRailId(null)
    setSelectedFacilityId(null)
  }

  const getCanvasPos = useCallback((): { x: number; y: number } | null => {
    const pos = stageRef.current?.getRelativePointerPosition()
    return pos ? { x: pos.x, y: pos.y } : null
  }, [])

  // 우클릭 — 드로잉 완료 또는 패닝 종료
  const handleContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault()
    // 패닝 중이었으면 패닝 종료 (드로잉 완료는 스킵)
    if (isPanningRef.current) {
      isPanningRef.current = false
      panClientStartRef.current = null
      const container = stageRef.current?.container()
      if (container) container.style.cursor = 'default'
      return
    }
    if (readonly) return
    if (toolMode === 'zone') completeZone()
    else if (toolMode === 'oht') completeOhtRail()
  }, [readonly, toolMode, completeZone, completeOhtRail])

  // 스테이지 클릭 — OHT 점 추가 / 배치영역 시작점 / 선택 해제
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const isStageTarget = e.target === stageRef.current || e.target.getClassName() === 'Stage'

    if (!readonly) {
      if (toolMode === 'oht') {
        if (e.evt.detail > 1) return
        const pos = getCanvasPos()
        if (!pos) return
        const vertexSnapped = applySnap(pos)
        if (ohtPoints.length >= 2) {
          const lastX = ohtPoints[ohtPoints.length - 2]
          const lastY = ohtPoints[ohtPoints.length - 1]
          // 꼭지점 스냅이 적용된 경우 45도 스냅은 스킵
          const finalPos = (vertexSnapped.x !== pos.x || vertexSnapped.y !== pos.y)
            ? vertexSnapped
            : snap45(lastX, lastY, pos.x, pos.y)
          setOhtPoints(prev => [...prev, finalPos.x, finalPos.y])
        } else {
          setOhtPoints(prev => [...prev, vertexSnapped.x, vertexSnapped.y])
        }
        setSnapIndicator(null)
        return
      }

      // 배치영역: 첫 좌클릭으로 시작점 지정
      if (toolMode === 'zone') {
        if (e.evt.detail > 1) return
        const pos = getCanvasPos()
        if (!pos) return
        if (!zoneDrawStart) {
          setZoneDrawStart(pos)
          setZoneDrawCurrent(pos)
        }
        return
      }
    }

    if (isStageTarget && effectiveToolMode === 'select') {
      setSelectedEquipmentIds([])
      setSelectedZoneId(null)
      setSelectedRailId(null)
    }
  }

  // 더블클릭 (OHT 완료는 이제 우클릭으로 처리)
  const handleStageDblClick = (_e: Konva.KonvaEventObject<MouseEvent>) => {}

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 우클릭: 드로잉 모드가 아닌 경우 패닝 시작
    if (e.evt.button === 2) {
      const isDrawingMode = !readonly && (toolMode === 'zone' || toolMode === 'oht')
      if (!isDrawingMode) {
        isPanningRef.current = true
        panClientStartRef.current = { x: e.evt.clientX, y: e.evt.clientY }
        panOffsetStartRef.current = { ...canvasOffset }
        const container = stageRef.current?.container()
        if (container) container.style.cursor = 'grab'
      }
      return
    }
    // 좌클릭: select 모드 + 빈 영역 → 범위 선택 시작
    if (e.evt.button === 0 && effectiveToolMode === 'select') {
      const isEmptyArea = e.target === stageRef.current || e.target.getType?.() === 'Stage'
      if (isEmptyArea) {
        const pos = getCanvasPos()
        if (pos) {
          selectionStartRef.current = pos
          selectionRectRef.current = { x: pos.x, y: pos.y, w: 0, h: 0 }
          setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
        }
      }
    }
  }

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0 && selectionStartRef.current) {
      completeRubberBand()
    }
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // 우클릭 패닝
    if (isPanningRef.current && panClientStartRef.current && panOffsetStartRef.current) {
      const dx = e.evt.clientX - panClientStartRef.current.x
      const dy = e.evt.clientY - panClientStartRef.current.y
      const container = stageRef.current?.container()
      if (container) container.style.cursor = 'grabbing'
      setCanvasOffset({ x: panOffsetStartRef.current.x + dx, y: panOffsetStartRef.current.y + dy })
      return
    }

    const rawPos = stageRef.current?.getPointerPosition()
    if (rawPos) {
      setMousePos({
        x: Math.round((rawPos.x - canvasOffset.x) / zoomLevel * 10),
        y: Math.round((rawPos.y - canvasOffset.y) / zoomLevel * 10),
      })
    }
    const pos = getCanvasPos()
    if (!pos) return

    // 범위 선택 업데이트
    if (selectionStartRef.current) {
      const { x: sx, y: sy } = selectionStartRef.current
      const rect = {
        x: Math.min(sx, pos.x),
        y: Math.min(sy, pos.y),
        w: Math.abs(pos.x - sx),
        h: Math.abs(pos.y - sy),
      }
      selectionRectRef.current = rect
      setSelectionRect(rect)
    }

    if (toolMode === 'zone' && zoneDrawStart) {
      setZoneDrawCurrent(pos)
    }
    if (toolMode === 'oht') {
      const vertexSnapped = applySnap(pos)
      const isVertexSnapping = vertexSnapped.x !== pos.x || vertexSnapped.y !== pos.y
      setSnapIndicator(isVertexSnapping ? vertexSnapped : null)
      if (ohtPoints.length >= 2) {
        const lastX = ohtPoints[ohtPoints.length - 2]
        const lastY = ohtPoints[ohtPoints.length - 1]
        const preview = isVertexSnapping ? vertexSnapped : snap45(lastX, lastY, pos.x, pos.y)
        setOhtPreview(preview)
      }
    } else {
      setSnapIndicator(null)
    }
  }

  // ── 배치영역 상호작용 ────────────────────────────────────────

  const handleZoneClick = (zoneId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (effectiveToolMode !== 'select') return
    e.cancelBubble = true
    if (clickableLayer !== 'zone') return
    setSelectedZoneId(prev => prev === zoneId ? null : zoneId)
    setSelectedRailId(null)
    setSelectedEquipmentIds([])
    setSelectedFacilityId(null)
  }

  // 배치영역 드래그로 이동
  const handleZoneDragEnd = (zone: PlacementZone, e: Konva.KonvaEventObject<DragEvent>) => {
    pushZoneRailHistory()
    const newX = e.target.x()
    const newY = e.target.y()
    const updated = (layout?.placementZones ?? []).map(z =>
      z.id === zone.id ? { ...z, x: newX, y: newY } : z
    )
    onUpdateLayout?.({ placementZones: updated })
  }

  // 꼭지점 드래그로 크기 조정 (드래그 시작 시 이력 저장)
  const handleZoneVertexDragStart = () => pushZoneRailHistory()

  const handleZoneVertexDragEnd = (
    zone: PlacementZone,
    corner: 'tl' | 'tr' | 'bl' | 'br',
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    const cx = e.target.x()
    const cy = e.target.y()
    let newX = zone.x, newY = zone.y, newW = zone.width, newH = zone.height
    if (corner === 'tl') {
      newW = zone.x + zone.width - cx; newH = zone.y + zone.height - cy
      newX = cx; newY = cy
    } else if (corner === 'tr') {
      newW = cx - zone.x; newH = zone.y + zone.height - cy; newY = cy
    } else if (corner === 'bl') {
      newW = zone.x + zone.width - cx; newH = cy - zone.y; newX = cx
    } else {
      newW = cx - zone.x; newH = cy - zone.y
    }
    if (newW < 20 || newH < 20) return
    const updated = (layout?.placementZones ?? []).map(z =>
      z.id === zone.id ? { ...z, x: newX, y: newY, width: newW, height: newH } : z
    )
    onUpdateLayout?.({ placementZones: updated })
  }

  // ── OHT 레일 상호작용 ────────────────────────────────────────

  const handleRailClick = (railId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    if (effectiveToolMode !== 'select') return
    e.cancelBubble = true
    if (clickableLayer !== 'rail') return
    setSelectedRailId(prev => prev === railId ? null : railId)
    setSelectedZoneId(null)
    setSelectedEquipmentIds([])
    setSelectedFacilityId(null)
  }

  // OHT 레일 꼭지점 드래그 (드래그 시작 시 이력 저장)
  const handleRailVertexDragStart = () => pushZoneRailHistory()

  const handleRailVertexDragEnd = (
    rail: OhtRailSegment,
    ptIdx: number,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    const newPoints = [...rail.points]
    newPoints[ptIdx * 2] = e.target.x()
    newPoints[ptIdx * 2 + 1] = e.target.y()
    const updated = (layout?.ohtRails ?? []).map(r =>
      r.id === rail.id ? { ...r, points: newPoints } : r
    )
    onUpdateLayout?.({ ohtRails: updated })
  }

  // OHT 레일 전체 이동 (드래그)
  const handleRailDragEnd = (rail: OhtRailSegment, e: Konva.KonvaEventObject<DragEvent>) => {
    pushZoneRailHistory()
    const dx = e.target.x()
    const dy = e.target.y()
    e.target.x(0)
    e.target.y(0)
    const newPoints = rail.points.map((p, i) => i % 2 === 0 ? p + dx : p + dy)
    const updated = (layout?.ohtRails ?? []).map(r =>
      r.id === rail.id ? { ...r, points: newPoints } : r
    )
    onUpdateLayout?.({ ohtRails: updated })
  }

  // ── 시설물 클릭 ─────────────────────────────────────────────

  const handleFacilityClick = (facId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (clickableLayer !== 'facility') return
    setSelectedFacilityId(prev => prev === facId ? null : facId)
    setSelectedEquipmentIds([])
    setSelectedZoneId(null)
    setSelectedRailId(null)
  }

  // ── 설비 드롭/드래그 ─────────────────────────────────────────

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
        x: snapX, y: snapY,
        rotation: 0,
        layer: 'L5',
        is_fixed: false,
      }
      addPlacement(newPlacement)
    }
    setSelectedEquipmentIds([equipId])
  }

  const handleEquipDragEnd = (placement: EquipmentPlacement, e: Konva.KonvaEventObject<DragEvent>) => {
    const effectiveGrid = (gridPx > 0 && isFinite(gridPx)) ? gridPx : 1
    const snapX = Math.round(e.target.x() / effectiveGrid) * effectiveGrid
    const snapY = Math.round(e.target.y() / effectiveGrid) * effectiveGrid
    updatePlacement(placement.id, { x: snapX, y: snapY })
  }

  // 데이터 기반 생성 설비 드래그 이동 완료 — store 및 데이터 테이블 좌표 업데이트
  const handleGenEquipDragEnd = (eq: { id: string; label: string; x: number; y: number; width: number; height: number }, e: Konva.KonvaEventObject<DragEvent>) => {
    const effectiveGrid = (gridPx > 0 && isFinite(gridPx)) ? gridPx : 1
    const newX = Math.round(e.target.x() / effectiveGrid) * effectiveGrid
    const newY = Math.round(e.target.y() / effectiveGrid) * effectiveGrid
    if (!isFinite(newX) || !isFinite(newY)) return
    updateGeneratedEquipment(eq.id, { x: newX, y: newY })
    // [사내망 이관 시 교체] 설비 좌표 업데이트 실제 API로 교체 필요
    const cfg = layout?.equipmentLayerConfig
    if (cfg?.tableId) {
      const { tables, updateTable } = useDataTableStore.getState()
      const table = tables.find(t => t.id === cfg.tableId)
      if (table) {
        const updatedRows = (table.rows ?? []).map(row => {
          const rowLabel = cfg.eqpIdField ? String(row[cfg.eqpIdField] ?? '') : null
          if (rowLabel !== eq.label) return row
          return {
            ...row,
            [cfg.xminField]: newX,
            [cfg.xmaxField]: newX + eq.width,
            [cfg.yminField]: newY,
            [cfg.ymaxField]: newY + eq.height,
          }
        })
        updateTable(cfg.tableId, { rows: updatedRows })
      }
    }
  }

  // ── 키보드 단축키 (ref 패턴으로 항상 최신 상태 참조) ────────

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (infoPopup) return // 팝업 열려 있으면 단축키 무시
    if (editingZoneId || editingRailId) return // 인라인 편집 중이면 단축키 무시

    // Ctrl+Z: 실행 취소
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      if (zoneRailHistoryRef.current.length > 0) {
        const prev = zoneRailHistoryRef.current.pop()!
        onUpdateLayout?.({ placementZones: prev.placementZones, ohtRails: prev.ohtRails })
      } else {
        useLayoutEditorStore.getState().undo()
      }
      return
    }

    // Ctrl+Y / Ctrl+Shift+Z: 다시 실행 (설비만)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      useLayoutEditorStore.getState().redo()
      return
    }

    // Escape: 드로잉 취소 + 선택 해제
    if (e.key === 'Escape') {
      setOhtPoints([])
      setOhtPreview(null)
      setZoneDrawStart(null)
      setZoneDrawCurrent(null)
      setSelectedZoneId(null)
      setSelectedRailId(null)
      return
    }

    // Delete / Backspace: 선택된 항목 삭제
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const state = useLayoutEditorStore.getState()
      if (state.selectedEquipmentIds.length > 0) {
        state.selectedEquipmentIds.forEach(eid => {
          const p = state.placements.find(p2 => p2.equipment_id === eid)
          if (p) state.removePlacement(p.id)
        })
        state.setSelectedEquipmentIds([])
        return
      }
      if (selectedZoneId) {
        pushZoneRailHistory()
        onUpdateLayout?.({ placementZones: (layout?.placementZones ?? []).filter(z => z.id !== selectedZoneId) })
        setSelectedZoneId(null)
        return
      }
      if (selectedRailId) {
        pushZoneRailHistory()
        onUpdateLayout?.({ ohtRails: (layout?.ohtRails ?? []).filter(r => r.id !== selectedRailId) })
        setSelectedRailId(null)
        return
      }
    }

    // Ctrl+C: 복사
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (selectedZoneId) {
        const zone = layout?.placementZones?.find(z => z.id === selectedZoneId)
        if (zone) { setCopiedZone(zone); setCopiedRail(null) }
      } else if (selectedRailId) {
        const rail = layout?.ohtRails?.find(r => r.id === selectedRailId)
        if (rail) { setCopiedRail(rail); setCopiedZone(null) }
      }
    }

    // Ctrl+V: 붙여넣기 (20px 오프셋)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (copiedZone) {
        pushZoneRailHistory()
        const pasted: PlacementZone = {
          ...copiedZone,
          id: `zone_${Date.now()}`,
          x: copiedZone.x + 20,
          y: copiedZone.y + 20,
          label: copiedZone.label ? `${copiedZone.label} (복사)` : undefined,
        }
        onUpdateLayout?.({ placementZones: [...(layout?.placementZones ?? []), pasted] })
        setSelectedZoneId(pasted.id)
        setCopiedZone(pasted)
      } else if (copiedRail) {
        pushZoneRailHistory()
        const pasted: OhtRailSegment = {
          ...copiedRail,
          id: `rail_${Date.now()}`,
          points: copiedRail.points.map(p => p + 20),
        }
        onUpdateLayout?.({ ohtRails: [...(layout?.ohtRails ?? []), pasted] })
        setSelectedRailId(pasted.id)
        setCopiedRail(pasted)
      }
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 캔버스 외부에서 마우스 버튼 놓을 때 패닝/범위선택 정리
  useEffect(() => {
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && isPanningRef.current) {
        isPanningRef.current = false
        panClientStartRef.current = null
        const container = stageRef.current?.container()
        if (container) container.style.cursor = 'default'
      }
      if (e.button === 0 && selectionStartRef.current) {
        completeRubberBand()
      }
    }
    window.addEventListener('mouseup', handleWindowMouseUp)
    return () => window.removeEventListener('mouseup', handleWindowMouseUp)
  }, [completeRubberBand])

  // ── 렌더링 ──────────────────────────────────────────────────

  const W = containerWidth
  const H = containerHeight

  const canEdit = !readonly && toolMode === 'select'

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
        draggable={effectiveToolMode === 'move'}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
      >
        {/* L1: 배경 이미지 또는 기본 배경 */}
        {isLayerVisible('L1') && (
          <Layer listening={false}>
            {bgImage ? (
              <KonvaImage image={bgImage} x={0} y={0} width={CW} height={CH} />
            ) : (
              <>
                <Rect x={0} y={0} width={CW} height={CH} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={2} />
                <Text x={10} y={10} text="배경 이미지를 업로드하세요" fontSize={14} fill="#94a3b8" />
              </>
            )}
          </Layer>
        )}

        {/* L4: 격자 */}
        {isLayerVisible('L4') && layout?.gridEnabled && (
          <Layer listening={false}>
            {Array.from({ length: Math.ceil(CW / gridPx) + 1 }).map((_, i) => (
              <Line key={`v${i}`} points={[i * gridPx, 0, i * gridPx, CH]} stroke="#64748b" strokeWidth={0.5} opacity={0.4} />
            ))}
            {Array.from({ length: Math.ceil(CH / gridPx) + 1 }).map((_, i) => (
              <Line key={`h${i}`} points={[0, i * gridPx, CW, i * gridPx]} stroke="#64748b" strokeWidth={0.5} opacity={0.4} />
            ))}
          </Layer>
        )}

        {/* L2: 설비 배치 영역 */}
        {isLayerVisible('L2') && (
          <Layer>
            {(layout?.placementZones ?? []).map(zone => {
              const isSelected = selectedZoneId === zone.id
              const isHighlighted = highlightedZoneId === zone.id
              return (
                <React.Fragment key={zone.id}>
                  <Rect
                    x={zone.x} y={zone.y}
                    width={zone.width} height={zone.height}
                    fill={isHighlighted ? '#fef08a' : isSelected ? '#dbeafe' : '#eff6ff'}
                    stroke={isHighlighted ? '#eab308' : isSelected ? '#2563eb' : '#3b82f6'}
                    strokeWidth={isHighlighted ? 3 : isSelected ? 2.5 : 1.5}
                    opacity={isHighlighted ? 0.8 : 0.6}
                    draggable={canEdit && isSelected}
                    onClick={e => handleZoneClick(zone.id, e)}
                    onDblClick={e => handleZoneDblClick(zone, e)}
                    onDragEnd={e => handleZoneDragEnd(zone, e)}
                    shadowColor={isSelected ? '#2563eb' : 'transparent'}
                    shadowBlur={isSelected ? 8 : 0}
                    onMouseEnter={e => {
                      if (canEdit && isSelected) e.target.getStage()!.container().style.cursor = 'move'
                    }}
                    onMouseLeave={e => {
                      e.target.getStage()!.container().style.cursor = 'default'
                    }}
                  />
                  {zone.label && (
                    <Text
                      x={zone.x + 6} y={zone.y + 6}
                      text={zone.label}
                      fontSize={11}
                      fill={isSelected ? '#1d4ed8' : '#3b82f6'}
                    />
                  )}
                  {/* 선택 시 꼭지점 핸들 (크기 조정) */}
                  {isSelected && canEdit && (
                    <>
                      {(['tl', 'tr', 'bl', 'br'] as const).map(corner => {
                        const hx = corner === 'tl' || corner === 'bl' ? zone.x : zone.x + zone.width
                        const hy = corner === 'tl' || corner === 'tr' ? zone.y : zone.y + zone.height
                        return (
                          <Circle
                            key={corner}
                            x={hx} y={hy}
                            radius={6}
                            fill="white"
                            stroke="#2563eb"
                            strokeWidth={2}
                            draggable
                            onDragStart={handleZoneVertexDragStart}
                            onDragEnd={e => handleZoneVertexDragEnd(zone, corner, e)}
                            onMouseEnter={e => { e.target.getStage()!.container().style.cursor = 'nwse-resize' }}
                            onMouseLeave={e => { e.target.getStage()!.container().style.cursor = 'default' }}
                          />
                        )
                      })}
                    </>
                  )}
                </React.Fragment>
              )
            })}
          </Layer>
        )}

        {/* L3: OHT 레일 */}
        {isLayerVisible('L3') && (
          <Layer>
            {(layout?.ohtRails ?? []).map((rail, i) => {
              const isSelected = selectedRailId === rail.id
              const isHighlighted = highlightedRailId === rail.id
              const ptCount = rail.points.length / 2
              return (
                <React.Fragment key={rail.id}>
                  {/* 레일 본체 (선택 시 드래그 이동 가능) */}
                  <Line
                    points={rail.points}
                    stroke={isHighlighted ? '#eab308' : isSelected ? '#ea580c' : '#f97316'}
                    strokeWidth={isHighlighted ? 7 : isSelected ? 5 : 4}
                    opacity={isHighlighted ? 1 : 0.85}
                    lineCap="round"
                    lineJoin="round"
                    hitStrokeWidth={14}
                    draggable={canEdit && isSelected}
                    onClick={e => handleRailClick(rail.id, e)}
                    onDblClick={e => handleRailDblClick(rail, e)}
                    onDragEnd={e => handleRailDragEnd(rail, e)}
                    shadowColor={isSelected ? '#ea580c' : 'transparent'}
                    shadowBlur={isSelected ? 8 : 0}
                    onMouseEnter={e => {
                      if (canEdit && isSelected) e.target.getStage()!.container().style.cursor = 'move'
                    }}
                    onMouseLeave={e => { e.target.getStage()!.container().style.cursor = 'default' }}
                  />
                  <Text
                    x={rail.points[0] + 4}
                    y={rail.points[1] - 14}
                    text={(rail as OhtRailWithLabel).label ?? `OHT Rail ${i + 1}`}
                    fontSize={10}
                    fill="#f97316"
                  />
                  {/* 선택 시 꼭지점 핸들 (개별 점 이동) */}
                  {isSelected && canEdit && (
                    <>
                      {Array.from({ length: ptCount }).map((_, ptIdx) => (
                        <Circle
                          key={ptIdx}
                          x={rail.points[ptIdx * 2]}
                          y={rail.points[ptIdx * 2 + 1]}
                          radius={5}
                          fill="white"
                          stroke="#ea580c"
                          strokeWidth={2}
                          draggable
                          onDragStart={handleRailVertexDragStart}
                          onDragEnd={e => handleRailVertexDragEnd(rail, ptIdx, e)}
                          onMouseEnter={e => { e.target.getStage()!.container().style.cursor = 'crosshair' }}
                          onMouseLeave={e => { e.target.getStage()!.container().style.cursor = 'default' }}
                        />
                      ))}
                    </>
                  )}
                </React.Fragment>
              )
            })}
          </Layer>
        )}

        {/* L5: 설비 배치 */}
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
                  x={placement.x} y={placement.y}
                  rotation={placement.rotation}
                  draggable={!readonly && !isLayerLocked('L5')}
                  onClick={e => handleEquipClick(eq.id, e)}
                  onDragEnd={e => handleEquipDragEnd(placement, e)}
                >
                  <Rect
                    x={-maint} y={-maint}
                    width={w + maint * 2} height={h + maint * 2}
                    fill={color} opacity={0.1}
                    stroke={color} strokeWidth={0.5} strokeDashArray={[4, 4]}
                  />
                  <Rect
                    width={w} height={h}
                    fill={color}
                    stroke={isSelected ? '#facc15' : color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    cornerRadius={3}
                    shadowColor={isSelected ? '#facc15' : 'transparent'}
                    shadowBlur={isSelected ? 8 : 0}
                  />
                  <Text
                    x={2} y={4} width={w - 4}
                    text={eq.equipment_no}
                    fontSize={9} fill="white" fontStyle="bold" align="center"
                  />
                  <Text
                    x={2} y={h / 2} width={w - 4}
                    text={eq.name.length > 10 ? eq.name.slice(0, 10) + '…' : eq.name}
                    fontSize={8} fill="rgba(255,255,255,0.85)" align="center"
                  />
                </Group>
              )
            })}
          </Layer>
        )}

        {/* L5-FAC: 시설물 레이어 데이터 기반 생성 시설물 */}
        {isLayerVisible('L5') && generatedFacilities.length > 0 && (
          <Layer>
            {generatedFacilities.map(fac => {
              const isFacSelected = selectedFacilityId === fac.id
              return (
                <React.Fragment key={fac.id}>
                  <Rect
                    x={fac.x} y={fac.y}
                    width={fac.width} height={fac.height}
                    fill={isFacSelected ? '#94a3b840' : '#64748b30'}
                    stroke={isFacSelected ? '#475569' : '#64748b'}
                    strokeWidth={isFacSelected ? 2.5 : 1.5}
                    dash={isFacSelected ? undefined : [4, 3]}
                    cornerRadius={1}
                    onClick={e => handleFacilityClick(fac.id, e)}
                    shadowColor={isFacSelected ? '#475569' : 'transparent'}
                    shadowBlur={isFacSelected ? 6 : 0}
                  />
                  <Text
                    x={fac.x + 3} y={fac.y + 3}
                    width={fac.width - 6}
                    text={fac.label}
                    fontSize={9}
                    fill={isFacSelected ? '#1e293b' : '#475569'}
                    ellipsis
                  />
                </React.Fragment>
              )
            })}
          </Layer>
        )}

        {/* L5-GEN: 설비 레이어 데이터 기반 생성 설비 */}
        {isLayerVisible('L5') && generatedEquipments.length > 0 && (
          <Layer>
            {generatedEquipments.map(eq => {
              const isGenSelected = selectedEquipmentIds.includes(eq.id)
              return (
                <Group
                  key={eq.id}
                  x={eq.x} y={eq.y}
                  draggable={!readonly && !isLayerLocked('L5')}
                  onDragEnd={e => handleGenEquipDragEnd(eq, e)}
                  onClick={e => {
                    e.cancelBubble = true
                    if (clickableLayer !== 'equipment') return
                    if (e.evt.shiftKey) addSelectedEquipmentId(eq.id)
                    else setSelectedEquipmentIds([eq.id])
                    setSelectedZoneId(null)
                    setSelectedRailId(null)
                    setSelectedFacilityId(null)
                  }}
                >
                  <Rect
                    width={eq.width} height={eq.height}
                    fill="#3b82f6"
                    stroke={isGenSelected ? '#facc15' : '#3b82f6'}
                    strokeWidth={isGenSelected ? 2.5 : 1.5}
                    cornerRadius={2}
                    shadowColor={isGenSelected ? '#facc15' : 'transparent'}
                    shadowBlur={isGenSelected ? 8 : 0}
                  />
                  <Text
                    x={4} y={4}
                    width={eq.width - 8}
                    text={eq.label}
                    fontSize={10}
                    fill="white"
                    ellipsis
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
              if (shape.type === 'rect') return (
                <Rect
                  key={shape.id} x={shape.x} y={shape.y}
                  width={shape.width ?? 100} height={shape.height ?? 60}
                  stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                  fill={shape.color ? shape.color + '20' : '#ec489920'}
                />
              )
              if (shape.type === 'circle') return (
                <Circle
                  key={shape.id} x={shape.x} y={shape.y}
                  radius={(shape.width ?? 50) / 2}
                  stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                  fill={shape.color ? shape.color + '20' : '#ec489920'}
                />
              )
              if (shape.type === 'text') return (
                <Text
                  key={shape.id} x={shape.x} y={shape.y}
                  text={shape.text ?? '텍스트'} fontSize={14}
                  fill={shape.color ?? '#1e293b'}
                />
              )
              if (shape.type === 'arrow') return (
                <Arrow
                  key={shape.id}
                  points={[shape.x, shape.y, shape.x + (shape.width ?? 100), shape.y]}
                  stroke={shape.color ?? '#ec4899'} strokeWidth={2}
                  fill={shape.color ?? '#ec4899'}
                />
              )
              return null
            })}
          </Layer>
        )}

        {/* 드로잉 프리뷰 레이어 */}
        {!readonly && (
          <Layer>
            {/* 배치영역 프리뷰 */}
            {toolMode === 'zone' && zoneDrawStart && zoneDrawCurrent && (
              <Rect
                x={Math.min(zoneDrawStart.x, zoneDrawCurrent.x)}
                y={Math.min(zoneDrawStart.y, zoneDrawCurrent.y)}
                width={Math.abs(zoneDrawCurrent.x - zoneDrawStart.x)}
                height={Math.abs(zoneDrawCurrent.y - zoneDrawStart.y)}
                fill="#eff6ff" stroke="#3b82f6" strokeWidth={1.5}
                opacity={0.6} dash={[6, 3]}
              />
            )}
            {/* 범위 선택 사각형 자리 — 공통 Layer로 이동됨 */}
            {/* 배치영역 시작점 마커 */}
            {toolMode === 'zone' && zoneDrawStart && (
              <Circle x={zoneDrawStart.x} y={zoneDrawStart.y} radius={4} fill="#3b82f6" opacity={0.9} />
            )}
            {/* OHT 확정 경로 */}
            {toolMode === 'oht' && ohtPoints.length >= 4 && (
              <Line
                points={ohtPoints}
                stroke="#f97316" strokeWidth={4} opacity={0.9}
                lineCap="round" lineJoin="round"
              />
            )}
            {/* OHT 프리뷰 (마우스 → 다음 점) */}
            {toolMode === 'oht' && ohtPoints.length >= 2 && ohtPreview && (
              <Line
                points={[ohtPoints[ohtPoints.length - 2], ohtPoints[ohtPoints.length - 1], ohtPreview.x, ohtPreview.y]}
                stroke="#f97316" strokeWidth={2} opacity={0.5}
                dash={[8, 4]} lineCap="round"
              />
            )}
            {/* OHT 시작점 마커 */}
            {toolMode === 'oht' && ohtPoints.length >= 2 && (
              <Circle x={ohtPoints[0]} y={ohtPoints[1]} radius={5} fill="#f97316" opacity={0.8} />
            )}
            {/* 스냅 인디케이터 */}
            {snapIndicator && (
              <>
                <Circle x={snapIndicator.x} y={snapIndicator.y} radius={8} stroke="#eab308" strokeWidth={2} fill="transparent" />
                <Circle x={snapIndicator.x} y={snapIndicator.y} radius={2} fill="#eab308" />
              </>
            )}
          </Layer>
        )}
        {/* 범위 선택 사각형 (보기/편집 공통) */}
        {selectionRect && selectionRect.w > 2 && selectionRect.h > 2 && (
          <Layer listening={false}>
            <Rect
              x={selectionRect.x} y={selectionRect.y}
              width={selectionRect.w} height={selectionRect.h}
              fill="#3b82f610"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 3]}
            />
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
        {!readonly && toolMode === 'zone' && (
          <>
            <span>|</span>
            <span className="text-amber-300">
              {zoneDrawStart ? '우클릭으로 완료 | ESC 취소' : '좌클릭으로 시작점 지정'}
            </span>
          </>
        )}
        {!readonly && toolMode === 'oht' && (
          <>
            <span>|</span>
            <span className="text-amber-300">
              {ohtPoints.length >= 2
                ? `꼭지점 ${ohtPoints.length / 2}개 | 우클릭으로 완료 | ESC 취소`
                : '좌클릭으로 레일 시작'}
            </span>
          </>
        )}
      </div>

      {/* 배치영역 인라인 명칭 편집 오버레이 */}
      {editingZoneId && (() => {
        const zone = layout?.placementZones?.find(z => z.id === editingZoneId)
        if (!zone) return null
        const sx = zone.x * zoomLevel + canvasOffset.x
        const sy = zone.y * zoomLevel + canvasOffset.y
        const sw = Math.max(120, zone.width * zoomLevel)
        return (
          <div style={{ position: 'absolute', left: sx, top: sy, width: sw, zIndex: 60 }}>
            <input
              autoFocus
              type="text"
              value={editingZoneLabel}
              onChange={e => setEditingZoneLabel(e.target.value)}
              onBlur={commitZoneLabel}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') commitZoneLabel()
                if (e.key === 'Escape') setEditingZoneId(null)
              }}
              className="w-full px-1.5 py-0.5 text-xs font-medium bg-white border-2 border-blue-500 rounded shadow-lg focus:outline-none"
            />
          </div>
        )
      })()}

      {/* OHT 레일 인라인 명칭 편집 오버레이 */}
      {editingRailId && (() => {
        const rail = layout?.ohtRails?.find(r => r.id === editingRailId)
        if (!rail || rail.points.length < 2) return null
        const sx = rail.points[0] * zoomLevel + canvasOffset.x
        const sy = (rail.points[1] - 18) * zoomLevel + canvasOffset.y
        return (
          <div style={{ position: 'absolute', left: sx, top: sy, width: 160, zIndex: 60 }}>
            <input
              autoFocus
              type="text"
              value={editingRailLabel}
              onChange={e => setEditingRailLabel(e.target.value)}
              onBlur={commitRailLabel}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === 'Enter') commitRailLabel()
                if (e.key === 'Escape') setEditingRailId(null)
              }}
              className="w-full px-1.5 py-0.5 text-xs font-medium bg-white border-2 border-orange-400 rounded shadow-lg focus:outline-none"
            />
          </div>
        )
      })()}

      {/* 정보 입력 팝업 (그리기 완료 후) */}
      {infoPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              {infoPopup.type === 'zone' ? '배치 영역 정보 입력' : 'OHT 레일 정보 입력'}
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
              {infoPopup.type === 'zone'
                ? '생성된 배치 영역의 이름을 입력하세요.'
                : `레일 꼭지점 ${infoPopup.type === 'rail' ? (infoPopup.pending as OhtRailSegment).points.length / 2 : 0}개로 구성된 OHT 레일이 생성됩니다.`}
            </p>
            <div className="mb-3">
              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-1">이름</label>
              <input
                autoFocus
                type="text"
                value={infoPopup.label}
                onChange={e => setInfoPopup(prev => prev ? { ...prev, label: e.target.value } : null)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleInfoConfirm()
                  if (e.key === 'Escape') handleInfoCancel()
                }}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
                placeholder="이름 입력..."
              />
            </div>
            {infoPopup.type === 'zone' && (
              <p className="text-[10px] text-gray-400 mb-3">
                ※ 추가 정보는 데이터 관리 메뉴에서 컬럼으로 설정할 수 있습니다.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleInfoCancel}
                className="flex-1 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleInfoConfirm}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
