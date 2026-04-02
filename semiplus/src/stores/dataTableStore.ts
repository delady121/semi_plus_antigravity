import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomTable, CustomColumnDef, TableChangeRecord } from '../types'

// [사내망 이관 시 교체] 현재 localStorage 기반 → 사내망 이관 시 사용자 테이블 저장/조회 API로 교체 필요

const SYSTEM_TABLES: CustomTable[] = [
  {
    id: 'sys_equipment',
    name: '설비 마스터',
    tableType: 'API_CONNECTED',
    columns: [],
    rows: [],
    changeHistory: [],
    apiSource: 'equipment',
    apiSelectedFields: ['equipment_no', 'name', 'model', 'status', 'width_mm', 'depth_mm', 'maintenance_space_mm', 'fab_bay_id', 'planned_in_date', 'planned_out_date'],
    sqlQuery: 'SELECT * FROM equipment',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdById: 'system',
    createdByName: 'System',
    isSystem: true,
  },
  {
    id: 'sys_fabbays',
    name: 'FAB Bay',
    tableType: 'API_CONNECTED',
    columns: [],
    rows: [],
    changeHistory: [],
    apiSource: 'fabBays',
    apiSelectedFields: ['id', 'name', 'floor', 'area_sqm', 'scale_mm_per_px'],
    sqlQuery: 'SELECT * FROM fab_bays',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdById: 'system',
    createdByName: 'System',
    isSystem: true,
  },
]

interface DataTableState {
  tables: CustomTable[]
  addTable: (table: CustomTable) => void
  updateTable: (id: string, updates: Partial<CustomTable>) => void
  deleteTable: (id: string) => void
  saveRows: (tableId: string, rows: Record<string, unknown>[], record: TableChangeRecord) => void
  updateColumns: (tableId: string, columns: CustomColumnDef[]) => void
}

export const useDataTableStore = create<DataTableState>()(
  persist(
    (set) => ({
      tables: SYSTEM_TABLES,

      addTable: (table) =>
        set(state => ({ tables: [...state.tables, table] })),

      updateTable: (id, updates) =>
        set(state => ({
          tables: state.tables.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTable: (id) =>
        set(state => ({
          tables: state.tables.filter(t => t.id !== id),
        })),

      saveRows: (tableId, rows, record) =>
        set(state => ({
          tables: state.tables.map(t =>
            t.id === tableId
              ? {
                  ...t,
                  rows,
                  changeHistory: [record, ...t.changeHistory],
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      updateColumns: (tableId, columns) =>
        set(state => ({
          tables: state.tables.map(t =>
            t.id === tableId
              ? { ...t, columns, updatedAt: new Date().toISOString() }
              : t
          ),
        })),
    }),
    { name: 'semiplus-datatables' }
  )
)
