import React, { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type { Equipment } from '../../types'

ModuleRegistry.registerModules([AllCommunityModule])

interface Props {
  equipment: Equipment[]
}

const statusLabel: Record<string, string> = {
  PLANNED_IN: '반입예정',
  PLANNED_OUT: '반출예정',
}

const statusClass: Record<string, string> = {
  PLANNED_IN: 'bg-green-100 text-green-700',
  PLANNED_OUT: 'bg-orange-100 text-orange-700',
}

export const ScheduledEquipmentTable: React.FC<Props> = ({ equipment }) => {
  const today = new Date('2026-03-30')

  const scheduled = useMemo(() => {
    const cutoff = new Date(today)
    cutoff.setDate(cutoff.getDate() + 30)

    return equipment
      .filter(e => {
        if (e.status === 'PLANNED_IN' && e.planned_in_date) {
          return new Date(e.planned_in_date) <= cutoff
        }
        if (e.status === 'PLANNED_OUT' && e.planned_out_date) {
          return new Date(e.planned_out_date) <= cutoff
        }
        return false
      })
      .map(e => {
        const dateStr = e.status === 'PLANNED_IN' ? e.planned_in_date : e.planned_out_date
        const date = dateStr ? new Date(dateStr) : null
        const diffDays = date ? Math.ceil((date.getTime() - today.getTime()) / 86400000) : null
        return { ...e, scheduleDate: dateStr, daysLeft: diffDays }
      })
      .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
  }, [equipment])

  const colDefs: ColDef[] = [
    { field: 'equipment_no', headerName: '설비번호', width: 110, pinned: 'left' },
    { field: 'name', headerName: '설비명', flex: 1, minWidth: 120 },
    {
      field: 'status',
      headerName: '상태',
      width: 90,
      cellRenderer: (params: { value: string }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[params.value] ?? ''}`}>
          {statusLabel[params.value] ?? params.value}
        </span>
      )
    },
    { field: 'scheduleDate', headerName: '예정일', width: 110 },
    {
      field: 'daysLeft',
      headerName: 'D-Day',
      width: 80,
      cellRenderer: (params: { value: number | null }) => {
        if (params.value === null) return '-'
        const urgent = params.value <= 7
        return (
          <span className={`font-bold ${urgent ? 'text-red-600' : 'text-gray-700'}`}>
            D-{params.value}
          </span>
        )
      }
    },
    { field: 'fab_bay_id', headerName: 'Bay', width: 90,
      valueFormatter: (p) => {
        const bay: Record<string, string> = { bay1: 'A동 1층', bay2: 'A동 2층', bay3: 'B동 1층' }
        return bay[p.value] ?? p.value ?? '-'
      }
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        반입/반출 예정 설비 (30일 이내, {scheduled.length}건)
      </h3>
      <div className="ag-theme-quartz" style={{ height: 220 }}>
        <AgGridReact
          rowData={scheduled}
          columnDefs={colDefs}
          defaultColDef={{ resizable: true, sortable: true }}
          suppressCellFocus={true}
          rowHeight={36}
          headerHeight={36}
        />
      </div>
    </div>
  )
}
