import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, GridApi, GetContextMenuItemsParams, MenuItemDef, DefaultMenuItem } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Plus, Columns, Upload, RefreshCw } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { mockService } from '../services/mockData'
import type { Equipment } from '../types'
import toast from 'react-hot-toast'

ModuleRegistry.registerModules([AllCommunityModule])

const TABLE_OPTIONS = [
  { value: 'equipment', label: '설비 마스터' },
  { value: 'bays', label: 'FAB Bay' },
]

const statusLabel: Record<string, string> = {
  OPERATING: '운영중', PLANNED_IN: '반입예정', PLANNED_OUT: '반출예정', REMOVED: '반출완료'
}
const investLabel: Record<string, string> = {
  NEW: '신규', EXPANSION: '증설', REPLACEMENT: '교체', RELOCATION: '이전'
}

const bayLabel: Record<string, string> = { bay1: 'A동 1층', bay2: 'A동 2층', bay3: 'B동 1층' }

export const DataManagementPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState('equipment')
  const [rowData, setRowData] = useState<Equipment[]>([])
  const [selectedRows, setSelectedRows] = useState<Equipment[]>([])
  const [lastModified, setLastModified] = useState<string | null>(null)
  const gridApiRef = useRef<GridApi | null>(null)

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  const { data: bays = [] } = useQuery({
    queryKey: ['fabBays'],
    queryFn: mockService.getFabBays,
  })

  useEffect(() => {
    if (selectedTable === 'equipment') setRowData(equipment)
    else if (selectedTable === 'bays') setRowData(bays as unknown as Equipment[])
  }, [selectedTable, equipment, bays])

  const equipmentCols: ColDef<Equipment>[] = [
    { field: 'equipment_no', headerName: '설비번호', width: 120, editable: true, pinned: 'left' },
    { field: 'name', headerName: '설비명', flex: 1, minWidth: 130, editable: true },
    { field: 'model', headerName: '모델', width: 150, editable: true },
    {
      field: 'status', headerName: '상태', width: 100, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['OPERATING', 'PLANNED_IN', 'PLANNED_OUT', 'REMOVED'] },
      valueFormatter: p => statusLabel[p.value] ?? p.value,
      cellStyle: p => {
        const c: Record<string, string> = {
          OPERATING: '#dbeafe', PLANNED_IN: '#dcfce7', PLANNED_OUT: '#ffedd5', REMOVED: '#f1f5f9'
        }
        return { backgroundColor: c[p.value] ?? 'white' }
      }
    },
    { field: 'width_mm', headerName: '폭(mm)', width: 90, editable: true, type: 'numericColumn' },
    { field: 'depth_mm', headerName: '깊이(mm)', width: 90, editable: true, type: 'numericColumn' },
    { field: 'height_mm', headerName: '높이(mm)', width: 90, editable: true, type: 'numericColumn' },
    { field: 'maintenance_space_mm', headerName: '유지보수(mm)', width: 110, editable: true, type: 'numericColumn' },
    {
      field: 'investment_type', headerName: '투자구분', width: 100, editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['NEW', 'EXPANSION', 'REPLACEMENT', 'RELOCATION'] },
      valueFormatter: p => investLabel[p.value] ?? p.value ?? '-',
    },
    {
      field: 'fab_bay_id', headerName: 'Bay', width: 100, editable: true,
      valueFormatter: p => bayLabel[p.value] ?? p.value ?? '-',
    },
    { field: 'planned_in_date', headerName: '반입예정일', width: 120, editable: true },
    { field: 'planned_out_date', headerName: '반출예정일', width: 120, editable: true },
    { field: 'created_at', headerName: '등록일', width: 120, editable: false,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '-'
    },
  ]

  const getContextMenuItems = useCallback((params: GetContextMenuItemsParams): (MenuItemDef | DefaultMenuItem)[] => {
    return [
      {
        name: '행 추가',
        icon: '<span>+</span>',
        action: () => {
          const newRow: Equipment = {
            id: `eq_new_${Date.now()}`,
            equipment_no: 'NEW-001',
            name: '새 설비',
            width_mm: 1000,
            depth_mm: 1000,
            height_mm: 2000,
            maintenance_space_mm: 600,
            status: 'PLANNED_IN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setRowData(prev => [...prev, newRow])
          setLastModified(new Date().toLocaleString('ko-KR'))
          toast.success('행이 추가되었습니다.')
        }
      },
      {
        name: '선택 행 삭제',
        icon: '<span>✕</span>',
        action: () => {
          const selected = params.api.getSelectedRows()
          if (selected.length === 0) {
            toast.error('삭제할 행을 선택하세요.')
            return
          }
          const selectedIds = new Set(selected.map((r: Equipment) => r.id))
          setRowData(prev => prev.filter(r => !selectedIds.has(r.id)))
          setLastModified(new Date().toLocaleString('ko-KR'))
          toast.success(`${selected.length}개 행이 삭제되었습니다.`)
        }
      },
      'separator' as DefaultMenuItem,
      {
        name: `이 값으로 필터: ${params.value ?? '(없음)'}`,
        action: () => {
          if (params.column && params.value !== undefined) {
            params.api.setFilterModel({
              [params.column.getColId()]: { type: 'equals', filter: String(params.value) }
            })
            toast.success('필터가 적용되었습니다.')
          }
        }
      },
      'separator' as DefaultMenuItem,
      'copy' as DefaultMenuItem,
      'paste' as DefaultMenuItem,
    ]
  }, [])

  // Ctrl+V paste simulation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        toast.success('붙여넣기 시뮬레이션: 클립보드에서 데이터를 가져옵니다.', { duration: 2000 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleAddRow = () => {
    const newRow: Equipment = {
      id: `eq_new_${Date.now()}`,
      equipment_no: `NEW-${String(rowData.length + 1).padStart(3, '0')}`,
      name: '새 설비',
      width_mm: 1000, depth_mm: 1000, height_mm: 2000,
      maintenance_space_mm: 600,
      status: 'PLANNED_IN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRowData(prev => [...prev, newRow])
    setLastModified(new Date().toLocaleString('ko-KR'))
    toast.success('새 행이 추가되었습니다.')
  }

  const handleImport = () => {
    toast('데이터 가져오기 기능은 준비 중입니다.', { icon: 'ℹ️' })
  }

  return (
    <PageLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">데이터 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">Origin 테이블 관리</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              새 행 추가
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Columns size={16} />
              컬럼 관리
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} />
              데이터 가져오기
            </button>
          </div>
        </div>

        {/* Table Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">테이블 선택:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {TABLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 ml-2">
              💡 셀 클릭으로 인라인 편집, 우클릭으로 컨텍스트 메뉴
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="animate-spin text-blue-500" size={28} />
            </div>
          ) : (
            <div className="ag-theme-quartz" style={{ height: 480 }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={equipmentCols}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                  editable: false,
                }}
                rowSelection="multiple"
                onSelectionChanged={e => setSelectedRows(e.api.getSelectedRows())}
                getContextMenuItems={getContextMenuItems}
                onCellValueChanged={() => {
                  setLastModified(new Date().toLocaleString('ko-KR'))
                }}
                suppressMovableColumns={false}
                enableCellTextSelection={true}
                onGridReady={p => { gridApiRef.current = p.api }}
                rowHeight={36}
                headerHeight={40}
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-2.5 flex items-center gap-4 text-xs text-gray-500">
          <span>총 <strong>{rowData.length}</strong>행</span>
          <span>|</span>
          <span>선택 <strong>{selectedRows.length}</strong>행</span>
          {lastModified && (
            <>
              <span>|</span>
              <span>마지막 수정: <strong>{lastModified}</strong></span>
            </>
          )}
          <span className="ml-auto text-gray-400">Ctrl+V로 엑셀 붙여넣기 지원</span>
        </div>
      </div>
    </PageLayout>
  )
}
