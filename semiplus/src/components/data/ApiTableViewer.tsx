import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { RefreshCw, Database, Code2 } from 'lucide-react'
import type { CustomTable } from '../../types'
import { loadApiSourceData, MOCK_API_SOURCES } from '../../services/dataTableService'

ModuleRegistry.registerModules([AllCommunityModule])

const STATUS_LABEL: Record<string, string> = {
  OPERATING: '운영중', PLANNED_IN: '반입예정', PLANNED_OUT: '반출예정', REMOVED: '반출완료'
}
const INVEST_LABEL: Record<string, string> = {
  NEW: '신규', EXPANSION: '증설', REPLACEMENT: '교체', RELOCATION: '이전'
}

interface Props {
  table: CustomTable
}

export const ApiTableViewer: React.FC<Props> = ({ table }) => {
  const apiSource = table.apiSource ?? ''
  const selectedFields = table.apiSelectedFields ?? []
  const [showSql, setShowSql] = React.useState(false)

  // [사내망 이관 시 교체] 실제 사내 API 엔드포인트로 교체 필요
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['apiSource', apiSource],
    queryFn: () => loadApiSourceData(apiSource as 'equipment' | 'fabBays'),
    enabled: !!apiSource,
  })

  const sourceInfo = MOCK_API_SOURCES.find(s => s.id === apiSource)

  const colDefs = useMemo<ColDef[]>(() => {
    if (!sourceInfo) return []
    return selectedFields
      .map(field => {
        const meta = sourceInfo.fields.find(f => f.field === field)
        if (!meta) return null
        return {
          field,
          headerName: meta.headerName,
          resizable: true,
          sortable: true,
          filter: true,
          editable: false,
          cellStyle: { color: '#374151' },
          valueFormatter: (p: { value: unknown }) => {
            if (field === 'status') return STATUS_LABEL[p.value as string] ?? String(p.value ?? '')
            if (field === 'investment_type') return INVEST_LABEL[p.value as string] ?? String(p.value ?? '')
            if (field === 'fab_bay_id') {
              const map: Record<string, string> = { bay1: 'A동 1층', bay2: 'A동 2층', bay3: 'B동 1층' }
              return map[p.value as string] ?? String(p.value ?? '')
            }
            return p.value != null ? String(p.value) : '-'
          },
        } as ColDef
      })
      .filter(Boolean) as ColDef[]
  }, [selectedFields, sourceInfo])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 text-[13px] text-gray-600">
          <Database size={14} className="text-blue-500" />
          <span className="font-medium text-blue-700">{sourceInfo?.label ?? apiSource}</span>
          <span className="text-gray-400">— Read Only</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowSql(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
            showSql
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Code2 size={14} />
          SQL 쿼리
        </button>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          새로고침
        </button>
        <span className="text-xs text-gray-400">{data.length}행</span>
      </div>

      {/* SQL 쿼리 패널 */}
      {showSql && (
        <div className="px-4 py-3 border-b border-gray-100 bg-slate-800">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
            SQL 쿼리 (Mock 환경 — 참고용)
            {/* [사내망 이관 시 교체] 실제 사내 Datalake(bigdataquery)에서 실행되는 쿼리 */}
          </p>
          <pre className="text-[12px] text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">
            {table.sqlQuery || `SELECT ${selectedFields.join(', ')}\nFROM ${apiSource}`}
          </pre>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="animate-spin text-blue-500" size={24} />
        </div>
      ) : (
        <div className="flex-1 ag-theme-quartz">
          <AgGridReact
            rowData={data}
            columnDefs={colDefs}
            defaultColDef={{ resizable: true, sortable: true, filter: true }}
            enableCellTextSelection
            rowHeight={36}
            headerHeight={40}
          />
        </div>
      )}
    </div>
  )
}
