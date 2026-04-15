import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Eye, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../components/layout/PageLayout'
import { EditorCanvas } from '../components/layout-editor/EditorCanvas'
import { EditorToolbar } from '../components/layout-editor/EditorToolbar'
import { SetupWizard } from '../components/layout-editor/SetupWizard'
import { mockService } from '../services/mockData'
import { useLayoutEditorStore } from '../stores/layoutEditorStore'
import { useLayoutStore } from '../stores/layoutStore'
import { useDataTableStore } from '../stores/dataTableStore'
import type { CustomColumnDef } from '../types'
import type { LayoutItem, OhtRailSegment } from '../stores/layoutStore'

type OhtRailWithLabel = OhtRailSegment & { label?: string }

export const LayoutEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const [showProperties, setShowProperties] = useState(false)
  const [editingItems, setEditingItems] = useState<{ id: string; label: string }[]>([])

  // 취소 시 복원을 위한 레이아웃 스냅샷 (편집 진입 시 저장)
  const layoutSnapshotRef = useRef<LayoutItem | null>(null)

  const { setIsDirty, setHighlightedZoneId, setHighlightedRailId } = useLayoutEditorStore()
  const { layouts, updateLayout } = useLayoutStore()
  const { tables: dataTables, addTable, updateTable } = useDataTableStore()

  const layout = id ? layouts.find(l => l.id === id) : null

  const { data: equipment = [], isLoading: eqLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // 초기 크기 즉시 설정 (첫 렌더링 시 0으로 fit 차단 → 실제 크기 확정 후 fit 실행)
    setCanvasSize({ w: el.clientWidth, h: el.clientHeight - 40 })
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight - 40 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 편집 화면 진입 시 스냅샷 저장 (취소 시 복원용)
  useEffect(() => {
    if (layout && !layoutSnapshotRef.current) {
      layoutSnapshotRef.current = JSON.parse(JSON.stringify(layout)) as LayoutItem
    }
  // layout.id 변경 시 스냅샷 초기화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.id])

  // 편집 화면 진입 시 기존 배치영역/OHT레일 데이터를 데이터 관리에 동기화
  // [사내망 이관 시 교체] 데이터 관리 테이블 저장 실제 API로 교체 필요
  useEffect(() => {
    if (!layout) return
    if ((layout.placementZones ?? []).length > 0) {
      syncZoneTable(layout.name, layout.placementZones ?? [])
    }
    if ((layout.ohtRails ?? []).length > 0) {
      syncRailTable(layout.name, layout.ohtRails as OhtRailWithLabel[] ?? [])
    }
  // syncZoneTable/syncRailTable은 layout.id 변경 시에만 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.id])

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

  // 데이터 관리 테이블 동기화 헬퍼
  // [사내망 이관 시 교체] 데이터 관리 테이블 저장 실제 API로 교체 필요
  const syncZoneTable = (layoutName: string, zones: { id: string; label?: string; x: number; y: number; width: number; height: number }[]) => {
    const tableName = `${layoutName}_배치영역`
    // getState()로 항상 최신 store 상태를 읽어 stale closure로 인한 중복 생성 방지
    const existing = useDataTableStore.getState().tables.find(t => t.name === tableName)
    const columns: CustomColumnDef[] = [
      { id: 'col_zone_id', field: 'id', headerName: 'ID', colType: 'USER_INPUT' },
      { id: 'col_zone_label', field: 'label', headerName: '명칭', colType: 'USER_INPUT' },
      { id: 'col_zone_x', field: 'x', headerName: 'X', colType: 'USER_INPUT' },
      { id: 'col_zone_y', field: 'y', headerName: 'Y', colType: 'USER_INPUT' },
      { id: 'col_zone_w', field: 'width', headerName: '폭', colType: 'USER_INPUT' },
      { id: 'col_zone_h', field: 'height', headerName: '높이', colType: 'USER_INPUT' },
    ]
    const rows = zones.map(z => ({ id: z.id, label: z.label ?? '', x: z.x, y: z.y, width: z.width, height: z.height }))
    if (existing) {
      updateTable(existing.id, { columns, rows })
    } else {
      addTable({
        id: `tbl_zone_${Date.now()}`,
        name: tableName,
        tableType: 'ORIGIN',
        columns,
        rows,
        changeHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: 'system',
        createdByName: 'System',
      })
    }
  }

  const syncRailTable = (layoutName: string, rails: (OhtRailSegment & { label?: string })[]) => {
    const tableName = `${layoutName}_OHT레일`
    // getState()로 항상 최신 store 상태를 읽어 stale closure로 인한 중복 생성 방지
    const existing = useDataTableStore.getState().tables.find(t => t.name === tableName)
    const columns: CustomColumnDef[] = [
      { id: 'col_rail_id', field: 'id', headerName: 'ID', colType: 'USER_INPUT' },
      { id: 'col_rail_label', field: 'label', headerName: '명칭', colType: 'USER_INPUT' },
      { id: 'col_rail_pts', field: 'points', headerName: '좌표(JSON)', colType: 'USER_INPUT' },
    ]
    const rows = rails.map((r, i) => ({ id: r.id, label: r.label ?? `OHT Rail ${i + 1}`, points: JSON.stringify(r.points) }))
    if (existing) {
      updateTable(existing.id, { columns, rows })
    } else {
      addTable({
        id: `tbl_rail_${Date.now()}`,
        name: tableName,
        tableType: 'ORIGIN',
        columns,
        rows,
        changeHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: 'system',
        createdByName: 'System',
      })
    }
  }

  // 편집 완료 처리 → 항상 보기 화면으로 이동
  const handleSetupComplete = () => {
    if (!id) return
    updateLayout(id, { isSetupComplete: true, setupStep: 11 })
    layoutSnapshotRef.current = null
    setIsDirty(false)
    toast.success('편집이 완료되었습니다.')
    navigate(`/layout/${id}`)
  }

  // 보기로 전환 (이미 설정 완료된 레이아웃에서 편집 취소)
  // 스냅샷이 있으면 스냅샷으로 복원 후 이동
  const handleCancelEdit = useCallback(() => {
    if (id && layoutSnapshotRef.current) {
      updateLayout(id, layoutSnapshotRef.current)
      layoutSnapshotRef.current = null
    }
    setIsDirty(false)
    navigate(`/layout/${id}`)
  }, [id, navigate, updateLayout, setIsDirty])

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
          <EditorToolbar
            onSave={handleSave}
            onRequestReview={handleRequestReview}
            onProperties={() => {
              const step = layout?.setupStep ?? 0
              if (step === 7) {
                setEditingItems((layout?.ohtRails ?? []).map((r, i) => ({ id: r.id, label: (r as OhtRailWithLabel).label ?? `OHT Rail ${i + 1}` })))
              } else {
                setEditingItems((layout?.placementZones ?? []).map(z => ({ id: z.id, label: z.label ?? '' })))
              }
              setShowProperties(true)
            }}
          />
          {layout && (
            <div className="flex items-center gap-2 px-3 border-l border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{layout.name}</span>
              {layout.isSetupComplete && (
                <>
                  {/* 변경사항 취소: 스냅샷으로 복원 후 보기 화면으로 이동 */}
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    <X size={12} />
                    변경사항 취소
                  </button>
                  {/* 보기로 전환: 변경사항 유지하며 보기 화면으로 이동 */}
                  <button
                    onClick={() => navigate(`/layout/${id}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={12} />
                    보기로 전환
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 2-Panel Layout: 편집(SetupWizard) + Canvas */}
        <div className="flex flex-1 overflow-hidden">
          {/* 편집 모드: 항상 설정 위자드 표시 */}
          {layout && (
            <SetupWizard
              layout={layout}
              onUpdate={(updates) => {
                if (id) {
                  updateLayout(id, updates)
                  setIsDirty(true)
                }
              }}
              onComplete={handleSetupComplete}
            />
          )}

          {/* Center: Canvas */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            <EditorCanvas
              equipment={equipment}
              containerWidth={canvasSize.w}
              containerHeight={canvasSize.h}
              layout={layout ?? undefined}
              onUpdateLayout={(updates) => {
                if (!id || !layout) return
                updateLayout(id, updates)
                // [사내망 이관 시 교체] 데이터 관리 테이블 저장 실제 API로 교체 필요
                if (updates.placementZones !== undefined) {
                  syncZoneTable(layout.name, updates.placementZones)
                }
                if (updates.ohtRails !== undefined) {
                  syncRailTable(layout.name, updates.ohtRails as OhtRailWithLabel[])
                }
              }}
            />
          </div>
        </div>
      </div>
      {/* 속성 모달 — 단계별 목록 및 명칭 일괄 편집 */}
      {showProperties && (() => {
        const step = layout?.setupStep ?? 0
        const isRailMode = step === 7
        const title = isRailMode ? `OHT 레일 목록 (${editingItems.length}개)` : `배치 영역 목록 (${editingItems.length}개)`
        const emptyMsg = isRailMode ? '생성된 OHT 레일이 없습니다.' : '생성된 배치 영역이 없습니다.'

        const handleSave = () => {
          if (!id || !layout) return
          // [사내망 이관 시 교체] 데이터 관리 테이블 저장 실제 API로 교체 필요
          if (isRailMode) {
            const updated = (layout.ohtRails ?? []).map(r => {
              const edit = editingItems.find(e => e.id === r.id)
              return edit ? ({ ...r, label: edit.label } as OhtRailSegment) : r
            })
            updateLayout(id, { ohtRails: updated })
            syncRailTable(layout.name, updated)
          } else {
            const updated = (layout.placementZones ?? []).map(z => {
              const edit = editingItems.find(e => e.id === z.id)
              return edit ? { ...z, label: edit.label } : z
            })
            updateLayout(id, { placementZones: updated })
            syncZoneTable(layout.name, updated)
          }
          setHighlightedZoneId(null)
          setHighlightedRailId(null)
          setShowProperties(false)
          toast.success(`${isRailMode ? 'OHT 레일' : '배치 영역'} 명칭이 저장되었습니다.`)
        }

        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="rounded-2xl shadow-2xl w-[480px] max-h-[70vh] flex flex-col" style={{ background: '#1E293B', border: '1px solid #334155' }}>
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#334155' }}>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">속성</p>
                  <p className="text-sm font-bold text-white mt-0.5">{title}</p>
                </div>
                <button
                  onClick={() => {
                    setHighlightedZoneId(null)
                    setHighlightedRailId(null)
                    setShowProperties(false)
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {/* 테이블 */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {editingItems.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">{emptyMsg}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b" style={{ borderColor: '#334155' }}>
                        <th className="pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">#</th>
                        <th className="pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">명칭</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingItems.map((item, i) => (
                        <tr key={item.id} className="border-b" style={{ borderColor: '#1e3a5f20' }}>
                          <td
                            className="py-2 pr-3 text-center cursor-pointer select-none rounded"
                            title="클릭하면 캔버스에서 강조 표시"
                            onClick={() => {
                              if (isRailMode) {
                                setHighlightedRailId(item.id)
                                setHighlightedZoneId(null)
                              } else {
                                setHighlightedZoneId(item.id)
                                setHighlightedRailId(null)
                              }
                            }}
                            style={{ color: '#60a5fa', fontWeight: 600, fontSize: 12 }}
                          >
                            {i + 1}
                          </td>
                          <td className="py-1.5">
                            <input
                              type="text"
                              value={item.label}
                              onChange={e => setEditingItems(prev => prev.map(it => it.id === item.id ? { ...it, label: e.target.value } : it))}
                              className="w-full px-2.5 py-1.5 rounded-lg text-sm text-white focus:outline-none"
                              style={{ background: '#0F172A', border: '1px solid #334155' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* 푸터 */}
              <div className="flex gap-2 px-5 py-4 border-t" style={{ borderColor: '#334155' }}>
                <button
                  onClick={() => {
                    setHighlightedZoneId(null)
                    setHighlightedRailId(null)
                    setShowProperties(false)
                  }}
                  className="flex-1 py-2 rounded-lg text-sm text-slate-300 transition-colors hover:bg-slate-700"
                  style={{ border: '1px solid #334155' }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ background: '#2563EB' }}
                >
                  <Check size={14} />
                  저장
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </PageLayout>
  )
}
