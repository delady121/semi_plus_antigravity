import React, { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Link2, Lock } from 'lucide-react'
import type { CustomTable } from '../../types'

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  table: CustomTable
  allTables: CustomTable[]
}

export const CombinedTableViewer: React.FC<Props> = ({ table, allTables }) => {
  const baseTable = allTables.find(t => t.id === table.baseTableId)
  const combineColumns = table.combineColumns ?? []

  // 베이스 테이블의 행 데이터에서 선택된 컬럼만 추출
  const rowData = useMemo(() => {
    if (!baseTable) return []
    return baseTable.rows.map(row => {
      const filtered: Record<string, unknown> = {}
      for (const cc of combineColumns) {
        if (cc.tableId === baseTable.id) {
          filtered[cc.field] = row[cc.field]
        }
      }
      return filtered
    })
  }, [baseTable, combineColumns])

  const colDefs = useMemo<ColDef[]>(() => {
    return combineColumns
      .filter(cc => cc.tableId === (baseTable?.id ?? ''))
      .map(cc => ({
        field: cc.field,
        headerName: cc.headerName,
        resizable: true,
        sortable: true,
        filter: true,
        editable: false,
        cellStyle: { color: '#374151' },
      }))
  }, [combineColumns, baseTable])

  if (!baseTable) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        베이스 테이블을 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 text-[13px] text-gray-600">
          <Link2 size={14} className="text-purple-500" />
          <span>기반:</span>
          <span className="font-medium text-purple-700">{baseTable.name}</span>
          <Lock size={12} className="text-gray-400" />
          <span className="text-gray-400">Read Only</span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">
          {combineColumns.length}개 컬럼 · {rowData.length}행
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 ag-theme-quartz">
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          enableCellTextSelection
          rowHeight={36}
          headerHeight={40}
        />
      </div>
    </div>
  )
}
