// [사내망 이관 시 교체] 사내 Datalake(bigdataquery) API로 교체 필요
// 현재 mockService 및 store 기반으로 동작

import { mockService } from './mockData'
import type { CustomTable } from '../types'

export type MockApiSource = 'equipment' | 'fabBays'

// Mock API에서 사용 가능한 데이터 소스 목록
// [사내망 이관 시 교체] 사내 DB 테이블 목록으로 교체 필요
export const MOCK_API_SOURCES: { id: MockApiSource; label: string; fields: { field: string; headerName: string }[] }[] = [
  {
    id: 'equipment',
    label: '설비 마스터 (Equipment)',
    fields: [
      { field: 'equipment_no',        headerName: '설비번호' },
      { field: 'name',                headerName: '설비명' },
      { field: 'model',               headerName: '모델' },
      { field: 'status',              headerName: '상태' },
      { field: 'width_mm',            headerName: '폭(mm)' },
      { field: 'depth_mm',            headerName: '깊이(mm)' },
      { field: 'height_mm',           headerName: '높이(mm)' },
      { field: 'maintenance_space_mm',headerName: '유지보수(mm)' },
      { field: 'investment_type',     headerName: '투자구분' },
      { field: 'fab_bay_id',          headerName: 'Bay ID' },
      { field: 'planned_in_date',     headerName: '반입예정일' },
      { field: 'planned_out_date',    headerName: '반출예정일' },
    ],
  },
  {
    id: 'fabBays',
    label: 'FAB Bay',
    fields: [
      { field: 'id',             headerName: 'Bay ID' },
      { field: 'name',           headerName: 'Bay명' },
      { field: 'floor',          headerName: '층' },
      { field: 'area_sqm',       headerName: '면적(m²)' },
      { field: 'scale_mm_per_px',headerName: '축척(mm/px)' },
    ],
  },
]

// [사내망 이관 시 교체] 실제 API 엔드포인트로 교체 필요
export async function loadApiSourceData(source: MockApiSource): Promise<Record<string, unknown>[]> {
  if (source === 'equipment') {
    const data = await mockService.getEquipment()
    return data as unknown as Record<string, unknown>[]
  }
  if (source === 'fabBays') {
    const data = await mockService.getFabBays()
    return data as unknown as Record<string, unknown>[]
  }
  return []
}

// 모든 테이블의 rows를 Map으로 반환 (JOIN 해석용)
// [사내망 이관 시 교체] API 기반 테이블 rows는 실제 API에서 조회
export async function buildSourceDataMap(
  tables: CustomTable[]
): Promise<Record<string, Record<string, unknown>[]>> {
  const map: Record<string, Record<string, unknown>[]> = {}

  for (const t of tables) {
    if (t.tableType === 'ORIGIN') {
      map[t.id] = t.rows
    } else if (t.tableType === 'API_CONNECTED' && t.apiSource) {
      const rows = await loadApiSourceData(t.apiSource as MockApiSource)
      map[t.id] = rows
    }
  }

  return map
}

// 단순 수식 평가 (계산된 컬럼 용)
// {field} 토큰을 실제 값으로 치환 후 수식 계산
export function evaluateFormula(formula: string, row: Record<string, unknown>): string {
  try {
    const expr = formula.replace(/\{(\w+)\}/g, (_, field) => {
      const val = row[field]
      const num = Number(val)
      return !isNaN(num) ? String(num) : '0'
    })
    // 숫자/연산자만 허용 (보안)
    if (!/^[\d\s+\-*/.()]+$/.test(expr)) return '#INVALID'
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${expr})`)()
    if (typeof result === 'number' && isFinite(result)) {
      return String(Math.round(result * 1000) / 1000)
    }
    return '#ERROR'
  } catch {
    return '#ERROR'
  }
}

// JOIN 컬럼 값 해석
export function resolveJoinValue(
  row: Record<string, unknown>,
  joinOnField: string,
  joinValueField: string,
  sourceRows: Record<string, unknown>[]
): unknown {
  const keyValue = row[joinOnField]
  const matched = sourceRows.find(r => r[joinOnField] === keyValue || r['id'] === keyValue)
  return matched?.[joinValueField] ?? ''
}
