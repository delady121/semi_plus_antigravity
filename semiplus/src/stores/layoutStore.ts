import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ScaleMeasurement {
  pixelDistance: number
  realDistanceMm: number
}

export interface PlacementZone {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
}

export interface OhtRailSegment {
  id: string
  points: number[]  // [x1, y1, x2, y2]
}

export interface LayoutDataLayerConfig {
  tableId: string
  xmaxField: string
  xminField: string
  ymaxField: string
  yminField: string
  eqpIdField: string
  extraFields: string[]
}

export interface LayoutItem {
  id: string
  name: string
  // 초기 편집 프로세스 단계 (3~11, 11=완료)
  setupStep: number
  isSetupComplete: boolean
  // Step 3: 배경 이미지 또는 직접 크기 설정
  backgroundImageData?: string   // base64 data URL
  backgroundImageName?: string
  canvasWidth?: number            // 이미지 없음 선택 시 직접 입력한 가로 크기(px)
  canvasHeight?: number           // 이미지 없음 선택 시 직접 입력한 세로 크기(px)
  // Step 4: 축척 설정 (3회 반복 측정)
  scaleMeasurements: ScaleMeasurement[]
  scaleMmPerPx?: number          // 3회 평균값
  // Step 5: 격자 (자동 생성)
  gridEnabled: boolean
  gridSizeMm: number             // 기본 600mm
  // Step 6: 설비 배치 영역
  placementZones: PlacementZone[]
  // Step 7: OHT 레일
  ohtRails: OhtRailSegment[]
  // Step 8: 설비 레이어 설정
  equipmentLayerConfig?: LayoutDataLayerConfig
  // Step 9: 시설물 레이어 설정
  facilityLayerConfig?: LayoutDataLayerConfig
  // Step 10: 사용자 정의 레이어
  customLayers: { id: string; name: string }[]
  // 메타
  createdAt: string
  updatedAt: string
  createdById: string
  createdByName: string
}

interface LayoutState {
  // [사내망 이관 시 교체] localStorage → 사내 레이아웃 저장 API로 교체 필요
  layouts: LayoutItem[]
  addLayout: (layout: LayoutItem) => void
  updateLayout: (id: string, updates: Partial<LayoutItem>) => void
  deleteLayout: (id: string) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      layouts: [],

      addLayout: (layout) =>
        set(state => ({ layouts: [...state.layouts, layout] })),

      updateLayout: (id, updates) =>
        set(state => ({
          layouts: state.layouts.map(l =>
            l.id === id
              ? { ...l, ...updates, updatedAt: new Date().toISOString() }
              : l
          ),
        })),

      deleteLayout: (id) =>
        set(state => ({ layouts: state.layouts.filter(l => l.id !== id) })),
    }),
    { name: 'semiplus-layouts' }
  )
)
