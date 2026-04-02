import React, { useState, useEffect } from 'react'
import { Plus, Database, Layers, Link2, Trash2, Settings } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { useDataTableStore } from '../stores/dataTableStore'
import { buildSourceDataMap } from '../services/dataTableService'
import { CreateTableModal } from '../components/data/CreateTableModal'
import { OriginTableViewer } from '../components/data/OriginTableViewer'
import { ApiTableViewer } from '../components/data/ApiTableViewer'
import { CombinedTableViewer } from '../components/data/CombinedTableViewer'
import type { CustomTable, TableChangeRecord } from '../types'
import toast from 'react-hot-toast'

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ORIGIN:       { label: '직접 생성', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <Layers size={12} /> },
  API_CONNECTED:{ label: '사내 데이터', color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <Database size={12} /> },
  COMBINED:     { label: '조합 테이블', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Link2 size={12} /> },
}

export const DataManagementPage: React.FC = () => {
  const { tables, addTable, deleteTable, saveRows, updateTable } = useDataTableStore()
  const [selectedId, setSelectedId] = useState<string | null>(tables[0]?.id ?? null)
  const [showCreate, setShowCreate] = useState(false)
  const [sourceDataMap, setSourceDataMap] = useState<Record<string, Record<string, unknown>[]>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
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
    </PageLayout>
  )
}
