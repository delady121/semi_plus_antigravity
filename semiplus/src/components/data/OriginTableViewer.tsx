import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, GridApi, CellValueChangedEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Plus, Save, History, RefreshCw } from 'lucide-react'
import type { CustomTable, TableChangeRecord } from '../../types'
import { evaluateFormula, resolveJoinValue } from '../../services/dataTableService'
import { ChangeReasonModal } from './ChangeReasonModal'
import { HistoryPanel } from './HistoryPanel'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  table: CustomTable
  sourceDataMap: Record<string, Record<string, unknown>[]>
  onSaveRows: (rows: Record<string, unknown>[], record: TableChangeRecord) => void
}

export const OriginTableViewer: React.FC<Props> = ({ table, sourceDataMap, onSaveRows }) => {
  const { currentUser } = useAuthStore()
  const [rowData, setRowData] = useState<Record<string, unknown>[]>([...table.rows])
  const [isDirty, setIsDirty] = useState(false)
  const [changedRowCount, setChangedRowCount] = useState(0)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const gridApiRef = useRef<GridApi | null>(null)

  // 테이블 변경 시 rowData 동기화
  useEffect(() => {
    setRowData([...table.rows])
    setIsDirty(false)
    setChangedRowCount(0)
  }, [table.id])

  // 계산된 컬럼 값 반영
  const applyCalculated = useCallback((rows: Record<string, unknown>[]) => {
    return rows.map(row => {
      const updated = { ...row }
      for (const col of table.columns) {
        if (col.colType === 'CALCULATED' && col.formula) {
          updated[col.field] = evaluateFormula(col.formula, row)
        }
        if (col.colType === 'JOIN' && col.joinTableId && col.joinOnField && col.joinValueField) {
          const srcRows = sourceDataMap[col.joinTableId] ?? []
          updated[col.field] = resolveJoinValue(row, col.joinOnField, col.joinValueField, srcRows)
        }
      }
      return updated
    })
  }, [table.columns, sourceDataMap])

  const colDefs = useMemo<ColDef[]>(() => {
    return table.columns.map(col => {
      const isEditable = col.colType === 'USER_INPUT'
      return {
        field: col.field,
        headerName: col.colType === 'JOIN'
          ? `🔗 ${col.headerName}`
          : col.colType === 'CALCULATED'
            ? `ƒ ${col.headerName}`
            : col.headerName,
        width: col.width ?? 140,
        editable: isEditable,
        cellStyle: isEditable
          ? undefined
          : { color: '#64748b', fontStyle: 'italic', background: '#f8fafc' },
        headerTooltip: col.colType === 'CALCULATED'
          ? `수식: ${col.formula}`
          : col.colType === 'JOIN'
            ? `JOIN: ${col.joinTableId} → ${col.joinValueField}`
            : undefined,
      }
    })
  }, [table.columns])

  const handleCellValueChanged = useCallback((_e: CellValueChangedEvent) => {
    setIsDirty(true)
    setChangedRowCount(prev => Math.max(prev, 1))
  }, [])

  const handleAddRow = () => {
    const newRow: Record<string, unknown> = { _id: `row_${Date.now()}` }
    for (const col of table.columns) {
      if (col.colType === 'USER_INPUT') newRow[col.field] = ''
    }
    const withCalc = applyCalculated([...rowData, newRow])
    setRowData(withCalc)
    setIsDirty(true)
    setChangedRowCount(prev => prev + 1)
  }

  const handleSaveClick = () => {
    setShowReasonModal(true)
  }

  const handleReasonConfirm = (reason: string) => {
    if (!gridApiRef.current) return

    // gridApi에서 최신 rowData 추출
    const currentRows: Record<string, unknown>[] = []
    gridApiRef.current.forEachNode(node => {
      if (node.data) currentRows.push(node.data)
    })

    const finalRows = applyCalculated(currentRows)

    const record: TableChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id ?? 'unknown',
      userName: currentUser?.name ?? '사용자',
      reason,
      rowCount: changedRowCount || finalRows.length,
    }

    onSaveRows(finalRows, record)
    setRowData(finalRows)
    setIsDirty(false)
    setChangedRowCount(0)
    setShowReasonModal(false)
    toast.success('저장되었습니다.')
  }

  const handleDiscard = () => {
    setRowData([...table.rows])
    setIsDirty(false)
    setChangedRowCount(0)
    toast('변경 사항이 취소되었습니다.', { icon: 'ℹ️' })
  }

  // Ctrl+V 시뮬레이션 안내
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        toast.success('Ctrl+V: 엑셀 데이터를 선택된 셀 위치에 붙여넣기합니다.', { duration: 2000 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const displayRows = useMemo(() => applyCalculated(rowData), [rowData, applyCalculated])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          행 추가
        </button>

        {isDirty && (
          <>
            <button
              onClick={handleSaveClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Save size={14} />
              저장
            </button>
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              되돌리기
            </button>
            <span className="text-[12px] text-amber-600 font-medium">● 미저장 변경사항 있음</span>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setShowHistory(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
            showHistory
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <History size={14} />
          이력 ({table.changeHistory.length})
        </button>

        <span className="text-xs text-gray-400">총 {rowData.length}행 · Ctrl+V 붙여넣기 지원</span>
      </div>

      {/* Column type legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[11px]">
        <span className="text-gray-500">컬럼 유형:</span>
        <span className="text-gray-700">일반 — 사용자 기입</span>
        <span className="text-slate-400 italic">🔗 — JOIN (읽기 전용)</span>
        <span className="text-slate-400 italic">ƒ — 계산됨 (읽기 전용)</span>
      </div>

      {/* AG Grid */}
      <div className="flex-1 ag-theme-quartz">
        <AgGridReact
          rowData={displayRows}
          columnDefs={colDefs}
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          rowSelection="multiple"
          enableCellTextSelection
          onCellValueChanged={handleCellValueChanged}
          onGridReady={p => { gridApiRef.current = p.api }}
          rowHeight={36}
          headerHeight={40}
          stopEditingWhenCellsLoseFocus
        />
      </div>

      {/* Modals */}
      {showReasonModal && (
        <ChangeReasonModal
          changedCount={changedRowCount || rowData.length}
          onConfirm={handleReasonConfirm}
          onCancel={() => setShowReasonModal(false)}
        />
      )}

      {showHistory && (
        <HistoryPanel
          tableName={table.name}
          history={table.changeHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
