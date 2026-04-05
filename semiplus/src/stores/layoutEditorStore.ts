import { create } from 'zustand'
import type { FabBay, EquipmentPlacement, CustomShape, LayerData } from '../types'

type ToolMode = 'select' | 'move' | 'rect' | 'circle' | 'text' | 'arrow' | 'zone' | 'oht'

interface HistoryState {
  placements: EquipmentPlacement[]
  customShapes: CustomShape[]
}

interface LayoutEditorState {
  currentBay: FabBay | null
  layers: LayerData[]
  selectedEquipmentIds: string[]
  placements: EquipmentPlacement[]
  customShapes: CustomShape[]
  toolMode: ToolMode
  zoomLevel: number
  canvasOffset: { x: number; y: number }
  historyStack: HistoryState[]
  historyIndex: number
  isDirty: boolean

  setCurrentBay: (bay: FabBay | null) => void
  setLayers: (layers: LayerData[]) => void
  toggleLayerVisibility: (code: string) => void
  toggleLayerLock: (code: string) => void
  setSelectedEquipmentIds: (ids: string[]) => void
  addSelectedEquipmentId: (id: string) => void
  setPlacements: (placements: EquipmentPlacement[]) => void
  addPlacement: (placement: EquipmentPlacement) => void
  updatePlacement: (id: string, updates: Partial<EquipmentPlacement>) => void
  removePlacement: (id: string) => void
  setCustomShapes: (shapes: CustomShape[]) => void
  addCustomShape: (shape: CustomShape) => void
  setToolMode: (mode: ToolMode) => void
  setZoomLevel: (zoom: number) => void
  setCanvasOffset: (offset: { x: number; y: number }) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  setIsDirty: (dirty: boolean) => void
  resetEditor: () => void
}

const DEFAULT_LAYERS: LayerData[] = [
  { code: 'L1', name: '배경', visible: true, locked: true },
  { code: 'L2', name: '배치영역', visible: true, locked: false },
  { code: 'L3', name: 'OHT레일', visible: true, locked: false },
  { code: 'L4', name: '격자', visible: true, locked: false },
  { code: 'L5', name: '설비', visible: true, locked: false },
  { code: 'L6', name: '마킹', visible: true, locked: false },
  { code: 'L7', name: '검토결과', visible: true, locked: false },
]

export const useLayoutEditorStore = create<LayoutEditorState>((set, get) => ({
  currentBay: null,
  layers: DEFAULT_LAYERS,
  selectedEquipmentIds: [],
  placements: [],
  customShapes: [],
  toolMode: 'select',
  zoomLevel: 1.0,
  canvasOffset: { x: 0, y: 0 },
  historyStack: [],
  historyIndex: -1,
  isDirty: false,

  setCurrentBay: (bay) => set({ currentBay: bay }),

  setLayers: (layers) => set({ layers }),

  toggleLayerVisibility: (code) => set(state => ({
    layers: state.layers.map(l => l.code === code ? { ...l, visible: !l.visible } : l)
  })),

  toggleLayerLock: (code) => set(state => ({
    layers: state.layers.map(l => l.code === code ? { ...l, locked: !l.locked } : l)
  })),

  setSelectedEquipmentIds: (ids) => set({ selectedEquipmentIds: ids }),

  addSelectedEquipmentId: (id) => set(state => ({
    selectedEquipmentIds: state.selectedEquipmentIds.includes(id)
      ? state.selectedEquipmentIds
      : [...state.selectedEquipmentIds, id]
  })),

  setPlacements: (placements) => set({ placements }),

  addPlacement: (placement) => {
    get().pushHistory()
    set(state => ({ placements: [...state.placements, placement], isDirty: true }))
  },

  updatePlacement: (id, updates) => {
    set(state => ({
      placements: state.placements.map(p => p.id === id ? { ...p, ...updates } : p),
      isDirty: true,
    }))
  },

  removePlacement: (id) => {
    get().pushHistory()
    set(state => ({
      placements: state.placements.filter(p => p.id !== id),
      isDirty: true,
    }))
  },

  setCustomShapes: (shapes) => set({ customShapes: shapes }),

  addCustomShape: (shape) => {
    get().pushHistory()
    set(state => ({ customShapes: [...state.customShapes, shape], isDirty: true }))
  },

  setToolMode: (mode) => set({ toolMode: mode }),

  setZoomLevel: (zoom) => set({ zoomLevel: Math.min(4.0, Math.max(0.1, zoom)) }),

  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  pushHistory: () => set(state => {
    const snapshot: HistoryState = {
      placements: [...state.placements],
      customShapes: [...state.customShapes],
    }
    const newStack = state.historyStack.slice(0, state.historyIndex + 1)
    if (newStack.length >= 50) newStack.shift()
    return {
      historyStack: [...newStack, snapshot],
      historyIndex: newStack.length,
    }
  }),

  undo: () => set(state => {
    if (state.historyIndex < 0) return state
    const prev = state.historyStack[state.historyIndex]
    return {
      placements: prev.placements,
      customShapes: prev.customShapes,
      historyIndex: state.historyIndex - 1,
      isDirty: true,
    }
  }),

  redo: () => set(state => {
    if (state.historyIndex >= state.historyStack.length - 1) return state
    const next = state.historyStack[state.historyIndex + 1]
    return {
      placements: next.placements,
      customShapes: next.customShapes,
      historyIndex: state.historyIndex + 1,
      isDirty: true,
    }
  }),

  setIsDirty: (dirty) => set({ isDirty: dirty }),

  resetEditor: () => set({
    currentBay: null,
    layers: DEFAULT_LAYERS,
    selectedEquipmentIds: [],
    placements: [],
    customShapes: [],
    toolMode: 'select',
    zoomLevel: 1.0,
    canvasOffset: { x: 0, y: 0 },
    historyStack: [],
    historyIndex: -1,
    isDirty: false,
  }),
}))
