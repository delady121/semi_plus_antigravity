import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, GridApi, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Plus, Save, History, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'
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

// 컬럼의 기존 데이터로 타입 추론 (숫자형 여부)
function inferColumnNumeric(field: string, rows: Record<string, unknown>[]): boolean {
  const values = rows.map(r => r[field]).filter(v => v !== '' && v !== null && v !== undefined)
  if (values.length === 0) return false
  return values.every(v => !isNaN(Number(v)))
}

export const OriginTableViewer: React.FC<Props> = ({ table, sourceDataMap, onSaveRows }) => {
  const { currentUser } = useAuthStore()
  const [rowData, setRowData] = useState<Record<string, unknown>[]>([...table.rows])
  const [isDirty, setIsDirty] = useState(false)
  const [changedRowCount, setChangedRowCount] = useState(0)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const gridApiRef = useRef<GridApi | null>(null)

  // 붙여넣기 오류 셀 추적: "rowIdx_field" 형태의 키 집합
  const pasteErrorsRef = useRef<Set<string>>(new Set())
  const [hasPasteError, setHasPasteError] = useState(false)

  // 행 선택 및 삭제
  const [selectedRowCount, setSelectedRowCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteReason, setPendingDeleteReason] = useState(false)

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
    const checkboxCol: ColDef = {
      colId: '__checkbox__',
      headerName: '',
      width: 44,
      minWidth: 44,
      maxWidth: 44,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      resizable: false,
      sortable: false,
      filter: false,
      pinned: 'left',
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
    }

    const dataCols: ColDef[] = table.columns.map(col => {
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
        // cellStyle는 함수로 정의해 pasteErrorsRef를 동적으로 참조
        cellStyle: (params) => {
          if (!isEditable) {
            return { color: '#64748b', fontStyle: 'italic', background: '#f8fafc' }
          }
          const rowIdx = params.node?.rowIndex ?? -1
          if (pasteErrorsRef.current.has(`${rowIdx}_${col.field}`)) {
            return { border: '2px solid #ef4444', background: '#fef2f2' }
          }
          return undefined
        },
        headerTooltip: col.colType === 'CALCULATED'
          ? `수식: ${col.formula}`
          : col.colType === 'JOIN'
            ? `JOIN: ${col.joinTableId} → ${col.joinValueField}`
            : undefined,
      }
    })

    return [checkboxCol, ...dataCols]
  }, [table.columns])

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent) => {
    setIsDirty(true)
    setChangedRowCount(prev => Math.max(prev, 1))
    // 수동 편집 시 해당 셀의 붙여넣기 오류 제거
    const rowIdx = e.node?.rowIndex ?? -1
    const field = e.column?.getColId() ?? ''
    const key = `${rowIdx}_${field}`
    if (pasteErrorsRef.current.has(key)) {
      pasteErrorsRef.current.delete(key)
      if (pasteErrorsRef.current.size === 0) setHasPasteError(false)
    }
  }, [])

  const handleSelectionChanged = useCallback((e: SelectionChangedEvent) => {
    setSelectedRowCount(e.api.getSelectedNodes().length)
  }, [])

  const handleDeleteClick = () => {
    if (selectedRowCount === 0) return
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setPendingDeleteReason(true)
    setShowReasonModal(true)
  }

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

    if (pendingDeleteReason) {
      // ── 행 삭제 경로 ──────────────────────────────
      const selectedIds = new Set(
        gridApiRef.current.getSelectedNodes().map(n => n.data?._id).filter(Boolean)
      )
      const deletedCount = selectedIds.size

      const currentRows: Record<string, unknown>[] = []
      gridApiRef.current.forEachNode(node => {
        if (node.data && !selectedIds.has(node.data._id)) {
          currentRows.push(node.data)
        }
      })

      const finalRows = applyCalculated(currentRows)
      const record: TableChangeRecord = {
        id: `chg_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id ?? 'unknown',
        userName: currentUser?.name ?? '사용자',
        reason,
        rowCount: deletedCount,
      }

      onSaveRows(finalRows, record)
      setRowData(finalRows)
      setIsDirty(false)
      setChangedRowCount(0)
      setSelectedRowCount(0)
      pasteErrorsRef.current = new Set()
      setHasPasteError(false)
      setPendingDeleteReason(false)
      setShowReasonModal(false)
      toast.success(`${deletedCount}개 행이 삭제되었습니다.`)
      return
    }

    // ── 일반 저장 경로 ────────────────────────────
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
    pasteErrorsRef.current = new Set()
    setHasPasteError(false)
    setShowReasonModal(false)
    toast.success('저장되었습니다.')
  }

  const handleDiscard = () => {
    setRowData([...table.rows])
    setIsDirty(false)
    setChangedRowCount(0)
    setSelectedRowCount(0)
    pasteErrorsRef.current = new Set()
    setHasPasteError(false)
    setPendingDeleteReason(false)
    toast('변경 사항이 취소되었습니다.', { icon: 'ℹ️' })
  }

  // ── 엑셀 Ctrl+V 붙여넣기 처리 ──────────────────────────────
  const handleGridPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!gridApiRef.current) return

    const focusedCell = gridApiRef.current.getFocusedCell()
    if (!focusedCell) return

    const clipText = e.clipboardData?.getData('text/plain') ?? ''
    if (!clipText) return

    e.preventDefault()
    e.stopPropagation()

    // TSV 파싱 (Excel 복사 형식)
    const pastedMatrix = clipText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trimEnd()
      .split('\n')
      .map(line => line.split('\t'))

    const startRowIdx = focusedCell.rowIndex
    const startColId = focusedCell.column.getColId()
    const allColumns = table.columns
    const startColIdx = allColumns.findIndex(c => c.field === startColId)
    if (startColIdx === -1) return

    // 현재 rowData 복사
    const currentRows: Record<string, unknown>[] = []
    gridApiRef.current.forEachNode(node => {
      if (node.data) currentRows.push({ ...node.data })
    })

    // 필요한 경우 행 자동 생성
    const totalRowsNeeded = startRowIdx + pastedMatrix.length
    while (currentRows.length < totalRowsNeeded) {
      const newRow: Record<string, unknown> = { _id: `row_${Date.now()}_${currentRows.length}` }
      for (const col of allColumns) {
        if (col.colType === 'USER_INPUT') newRow[col.field] = ''
      }
      currentRows.push(newRow)
    }

    const newErrors = new Set<string>()

    pastedMatrix.forEach((pastedRow, rowOffset) => {
      const targetRowIdx = startRowIdx + rowOffset

      pastedRow.forEach((value, colOffset) => {
        const targetColIdx = startColIdx + colOffset
        if (targetColIdx >= allColumns.length) return

        const targetCol = allColumns[targetColIdx]
        // 사용자 기입 컬럼만 붙여넣기 허용
        if (targetCol.colType !== 'USER_INPUT') return

        // 숫자형 컬럼 타입 불일치 검사
        if (value !== '' && inferColumnNumeric(targetCol.field, table.rows)) {
          if (isNaN(Number(value))) {
            newErrors.add(`${targetRowIdx}_${targetCol.field}`)
          }
        }

        currentRows[targetRowIdx][targetCol.field] = value
      })
    })

    pasteErrorsRef.current = newErrors
    const hasError = newErrors.size > 0
    setHasPasteError(hasError)

    const newlyAdded = Math.max(0, totalRowsNeeded - table.rows.length)
    const withCalc = applyCalculated(currentRows)
    setRowData(withCalc)
    setIsDirty(true)
    setChangedRowCount(pastedMatrix.length)

    // AG Grid 셀 스타일 강제 새로고침
    setTimeout(() => {
      gridApiRef.current?.refreshCells({ force: true })
    }, 0)

    if (hasError) {
      toast.error(`타입 불일치 셀이 있습니다 (빨간 테두리). 수정 후 저장하세요.`, { duration: 3000 })
    } else {
      const msg = newlyAdded > 0
        ? `${pastedMatrix.length}행 붙여넣기 완료 (${newlyAdded}행 자동 생성)`
        : `${pastedMatrix.length}행 붙여넣기 완료`
      toast.success(msg)
    }
  }, [table, applyCalculated])

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

        {selectedRowCount > 0 && (
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 size={14} />
            {selectedRowCount}행 삭제
          </button>
        )}

        {isDirty && (
          <>
            <button
              onClick={handleSaveClick}
              disabled={hasPasteError}
              title={hasPasteError ? '타입 불일치 셀을 수정한 후 저장하세요' : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            {hasPasteError ? (
              <span className="flex items-center gap-1 text-[12px] text-red-600 font-medium">
                <AlertTriangle size={13} />
                타입 불일치 셀 있음 — 저장 불가
              </span>
            ) : (
              <span className="text-[12px] text-amber-600 font-medium">● 미저장 변경사항 있음</span>
            )}
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
      <div className="flex-1 ag-theme-quartz" onPaste={handleGridPaste}>
        <AgGridReact
          rowData={displayRows}
          columnDefs={colDefs}
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          rowSelection={{
            mode: 'multiRow',
            checkboxes: false,      // 체크박스는 colDef에서 직접 설정
            enableClickSelection: true,
            enableSelectionWithoutKeys: false,
          }}
          enableCellTextSelection
          onCellValueChanged={handleCellValueChanged}
          onSelectionChanged={handleSelectionChanged}
          onGridReady={p => { gridApiRef.current = p.api }}
          rowHeight={36}
          headerHeight={40}
          stopEditingWhenCellsLoseFocus
        />
      </div>

      {/* Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-80">
            <h3 className="text-base font-bold text-gray-900 mb-2">행 삭제 확인</h3>
            <p className="text-sm text-gray-600 mb-5">
              선택한 <span className="font-semibold text-red-600">{selectedRowCount}개</span>의 행을 삭제하시겠습니까?
              <br />
              <span className="text-xs text-gray-400">삭제 후 변경 사유를 입력합니다.</span>
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {showReasonModal && (
        <ChangeReasonModal
          changedCount={pendingDeleteReason ? selectedRowCount : (changedRowCount || rowData.length)}
          onConfirm={handleReasonConfirm}
          onCancel={() => { setShowReasonModal(false); setPendingDeleteReason(false) }}
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
