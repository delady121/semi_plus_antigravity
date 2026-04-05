import React, { useState, useEffect } from 'react'
import { Plus, Database, Layers, Link2, Trash2, Settings, X } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { useDataTableStore } from '../stores/dataTableStore'
import { buildSourceDataMap } from '../services/dataTableService'
import { CreateTableModal } from '../components/data/CreateTableModal'
import { OriginTableViewer } from '../components/data/OriginTableViewer'
import { ApiTableViewer } from '../components/data/ApiTableViewer'
import { CombinedTableViewer } from '../components/data/CombinedTableViewer'
import type { CustomTable, TableChangeRecord, CustomColumnDef, CustomColumnType } from '../types'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ORIGIN:       { label: '직접 생성', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <Layers size={12} /> },
  API_CONNECTED:{ label: '사내 데이터', color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <Database size={12} /> },
  COMBINED:     { label: '조합 테이블', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Link2 size={12} /> },
}

const COL_TYPE_OPTIONS: { type: CustomColumnType; label: string; desc: string }[] = [
  { type: 'USER_INPUT', label: '사용자 기입', desc: '사용자가 직접 값을 입력/편집' },
  { type: 'JOIN',       label: 'JOIN 컬럼',   desc: '다른 테이블과 JOIN하여 값을 가져옴' },
  { type: 'CALCULATED', label: '계산된 컬럼',  desc: 'Spotfire 방식의 수식 기반 자동 계산' },
]

export const DataManagementPage: React.FC = () => {
  const { tables, addTable, deleteTable, saveRows, updateTable } = useDataTableStore()
  const [selectedId, setSelectedId] = useState<string | null>(tables[0]?.id ?? null)
  const [showCreate, setShowCreate] = useState(false)
  const [sourceDataMap, setSourceDataMap] = useState<Record<string, Record<string, unknown>[]>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // 컬럼 편집 상태
  const [showColumnEditor, setShowColumnEditor] = useState(false)
  const [editingColumns, setEditingColumns] = useState<CustomColumnDef[]>([])

  const selectedTable = tables.find(t => t.id === selectedId) ?? null

  // JOIN 해석을 위해 모든 테이블 rows 로드
  useEffect(() => {
    buildSourceDataMap(tables).then(setSourceDataMap)
  }, [tables])

  // 테이블 추가 후 자동 선택
  const handleCreate = (table: CustomTable) => {
    addTable(table)
    setSelectedId(table.id)
    setShowCreate(false)
    toast.success(`'${table.name}' 테이블이 생성되었습니다.`)
  }

  const handleSaveRows = (tableId: string, rows: Record<string, unknown>[], record: TableChangeRecord) => {
    saveRows(tableId, rows, record)
  }

  const handleDelete = (id: string) => {
    const table = tables.find(t => t.id === id)
    if (!table) return
    if (table.isSystem) {
      toast.error('시스템 테이블은 삭제할 수 없습니다.')
      return
    }
    deleteTable(id)
    setSelectedId(tables.find(t => t.id !== id)?.id ?? null)
    setConfirmDelete(null)
    toast.success('테이블이 삭제되었습니다.')
  }

  // ── 컬럼 편집 ──────────────────────────────────────────────

  const handleOpenColumnEditor = () => {
    if (!selectedTable || selectedTable.tableType !== 'ORIGIN') return
    setEditingColumns(selectedTable.columns.map(c => ({ ...c })))
    setShowColumnEditor(true)
  }

  const addEditingColumn = () => {
    const newCol: CustomColumnDef = {
      id: `new_${Date.now()}`,
      field: `col_${Date.now()}`,
      headerName: `새 항목 ${editingColumns.length + 1}`,
      colType: 'USER_INPUT',
      width: 140,
    }
    setEditingColumns(prev => [...prev, newCol])
  }

  const updateEditingColumn = (idx: number, updates: Partial<CustomColumnDef>) => {
    setEditingColumns(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c))
  }

  const removeEditingColumn = (idx: number) => {
    if (editingColumns.length <= 1) return
    setEditingColumns(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSaveColumns = () => {
    if (!selectedTable) return
    updateTable(selectedTable.id, { columns: editingColumns })
    setShowColumnEditor(false)
    toast.success('컬럼 설정이 저장되었습니다.')
  }

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-112px)] gap-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
        {/* ── 왼쪽: 테이블 목록 ── */}
        <aside className="w-56 shrink-0 flex flex-col border-r border-gray-100">
          <div className="px-3 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">테이블 목록</p>
              <button
                onClick={() => setShowCreate(true)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="새 테이블"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {tables.map(table => {
              const meta = TYPE_META[table.tableType]
              const isActive = table.id === selectedId
              return (
                <div key={table.id} className="group relative">
                  <button
                    onClick={() => setSelectedId(table.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                        {meta.icon}
                      </span>
                      <span className="text-[13px] font-medium truncate">{table.name}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${meta.color}`}>
                      {meta.label}
                    </div>
                  </button>
                  {/* 삭제 버튼 (시스템 테이블 제외) */}
                  {!table.isSystem && (
                    <button
                      onClick={() => setConfirmDelete(table.id)}
                      className="absolute top-2 right-1 w-5 h-5 items-center justify-center rounded text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hidden group-hover:flex"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )
            })}

            {tables.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">
                테이블이 없습니다
              </div>
            )}
          </nav>

          <div className="border-t border-gray-100 px-3 py-3">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} />
              새 테이블
            </button>
          </div>
        </aside>

        {/* ── 오른쪽: 테이블 콘텐츠 ── */}
        <main className="flex-1 flex flex-col min-w-0">
          {selectedTable ? (
            <>
              {/* 테이블 헤더 */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${TYPE_META[selectedTable.tableType].color}`}>
                    {TYPE_META[selectedTable.tableType].icon}
                    {TYPE_META[selectedTable.tableType].label}
                  </span>
                  <h2 className="text-base font-bold text-gray-900 truncate">{selectedTable.name}</h2>
                  {selectedTable.isSystem && (
                    <span className="text-[11px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-full">시스템</span>
                  )}
                </div>
                {selectedTable.tableType === 'ORIGIN' && !selectedTable.isSystem && (
                  <button
                    onClick={handleOpenColumnEditor}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={13} />
                    컬럼 편집
                  </button>
                )}
              </div>

              {/* 테이블 뷰어 */}
              <div className="flex-1 min-h-0">
                {selectedTable.tableType === 'ORIGIN' && (
                  <OriginTableViewer
                    table={selectedTable}
                    sourceDataMap={sourceDataMap}
                    onSaveRows={(rows, record) => handleSaveRows(selectedTable.id, rows, record)}
                  />
                )}
                {selectedTable.tableType === 'API_CONNECTED' && (
                  <ApiTableViewer table={selectedTable} />
                )}
                {selectedTable.tableType === 'COMBINED' && (
                  <CombinedTableViewer table={selectedTable} allTables={tables} />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Database size={40} className="mb-4 opacity-30" />
              <p className="text-sm font-medium text-gray-500 mb-1">테이블을 선택하세요</p>
              <p className="text-xs text-gray-400 mb-4">또는 새 테이블을 생성하세요</p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} />
                새 테이블 생성
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 테이블 생성 모달 */}
      {showCreate && (
        <CreateTableModal
          existingTables={tables}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* 삭제 확인 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-80">
            <h3 className="text-base font-bold text-gray-900 mb-2">테이블 삭제</h3>
            <p className="text-sm text-gray-600 mb-5">
              '{tables.find(t => t.id === confirmDelete)?.name}' 테이블을 삭제합니다.
              <br />데이터는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 컬럼 편집 모달 */}
      {showColumnEditor && selectedTable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowColumnEditor(false)} />
          <div
            className="relative flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
            style={{ background: '#1E293B', width: 560, maxHeight: '88vh' }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div>
                <p className="text-sm font-semibold text-white">컬럼 편집</p>
                <p className="text-[11px] text-white/30 mt-0.5">{selectedTable.name} — 컬럼 추가/수정/삭제</p>
              </div>
              <button
                onClick={() => setShowColumnEditor(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">컬럼 정의</p>

              {editingColumns.map((col, idx) => (
                <div key={col.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="컬럼 이름"
                      value={col.headerName}
                      onChange={e => updateEditingColumn(idx, { headerName: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/40 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="field_key"
                      value={col.field}
                      onChange={e => updateEditingColumn(idx, { field: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
                      className="w-32 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white/70 placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition-colors font-mono"
                    />
                    <button
                      onClick={() => removeEditingColumn(idx)}
                      disabled={editingColumns.length <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* 컬럼 유형 선택 */}
                  <div className="flex gap-1.5">
                    {COL_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.type}
                        onClick={() => updateEditingColumn(idx, { colType: opt.type })}
                        title={opt.desc}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          col.colType === opt.type
                            ? 'bg-brand-500/25 text-brand-300 border border-brand-500/40'
                            : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* JOIN 설정 */}
                  {col.colType === 'JOIN' && (
                    <div className="space-y-1.5 pt-1">
                      <select
                        value={col.joinTableId ?? ''}
                        onChange={e => updateEditingColumn(idx, { joinTableId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white focus:outline-none appearance-none"
                      >
                        <option value="">소스 테이블 선택...</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="JOIN 키 필드 (현재 테이블)"
                          value={col.joinOnField ?? ''}
                          onChange={e => updateEditingColumn(idx, { joinOnField: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                        />
                        <input
                          type="text"
                          placeholder="가져올 값 필드"
                          value={col.joinValueField ?? ''}
                          onChange={e => updateEditingColumn(idx, { joinValueField: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* CALCULATED 설정 */}
                  {col.colType === 'CALCULATED' && (
                    <input
                      type="text"
                      placeholder="수식 (예: {width_mm} * {depth_mm})"
                      value={col.formula ?? ''}
                      onChange={e => updateEditingColumn(idx, { formula: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                    />
                  )}
                </div>
              ))}

              <button
                onClick={addEditingColumn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80 transition-all w-full justify-center"
              >
                <Plus size={14} />
                컬럼 추가
              </button>

              <p className="text-[11px] text-white/25 leading-relaxed pt-1">
                ※ 사용자 기입 컬럼만 셀에서 직접 편집 가능합니다. 저장 후 기존 행 데이터의 해당 필드는 유지됩니다.
              </p>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.08]">
              <button
                onClick={() => setShowColumnEditor(false)}
                className="px-4 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSaveColumns}
                disabled={editingColumns.length === 0}
                className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
