import React from 'react'
import {
  MousePointer2, Move, Square, Circle, Type, ArrowRight,
  ZoomIn, ZoomOut, Save, Send, RotateCcw, RotateCw,
  LayoutGrid, Spline, SlidersHorizontal, Magnet,
} from 'lucide-react'
import { useLayoutEditorStore } from '../../stores/layoutEditorStore'

interface Props {
  onSave: () => void
  onRequestReview: () => void
  onProperties?: () => void
}

type ToolMode = 'select' | 'move' | 'rect' | 'circle' | 'text' | 'arrow' | 'zone' | 'oht'

const tools: { mode: ToolMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'select', icon: <MousePointer2 size={16} />, label: '선택' },
  { mode: 'move', icon: <Move size={16} />, label: '이동' },
  { mode: 'zone', icon: <LayoutGrid size={16} />, label: '배치영역' },
  { mode: 'oht', icon: <Spline size={16} />, label: 'OHT 레일' },
  { mode: 'rect', icon: <Square size={16} />, label: '사각형' },
  { mode: 'circle', icon: <Circle size={16} />, label: '원' },
  { mode: 'text', icon: <Type size={16} />, label: '텍스트' },
  { mode: 'arrow', icon: <ArrowRight size={16} />, label: '화살표' },
]

export const EditorToolbar: React.FC<Props> = ({ onSave, onRequestReview, onProperties }) => {
  const { toolMode, setToolMode, zoomLevel, setZoomLevel, undo, redo, isDirty, snapEnabled, setSnapEnabled } = useLayoutEditorStore()

  const handleZoomIn = () => setZoomLevel(Math.min(4.0, zoomLevel + 0.1))
  const handleZoomOut = () => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))
  const handleZoomReset = () => setZoomLevel(1.0)

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 flex-wrap">
      {/* Drawing Tools */}
      <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">
        {tools.map(tool => (
          <button
            key={tool.mode}
            onClick={() => setToolMode(tool.mode)}
            title={tool.label}
            className={`p-2 rounded-md transition-colors ${
              toolMode === tool.mode
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          title="실행 취소 (Ctrl+Z)"
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={redo}
          title="다시 실행 (Ctrl+Y)"
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Snap Toggle */}
      <button
        onClick={() => setSnapEnabled(!snapEnabled)}
        title={`스냅핑 ${snapEnabled ? 'ON' : 'OFF'} (꼭지점 스냅)`}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          snapEnabled
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'text-gray-400 border border-gray-200 hover:bg-gray-100'
        }`}
      >
        <Magnet size={14} />
        스냅
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">
        <button onClick={handleZoomOut} title="축소" className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 py-1 text-xs font-mono font-semibold text-gray-700 hover:bg-gray-100 rounded min-w-[52px] text-center"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button onClick={handleZoomIn} title="확대" className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Properties Button */}
      {onProperties && (
        <>
          <button
            onClick={onProperties}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={15} />
            속성
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
        </>
      )}

      {/* Right Side Actions */}
      <button
        onClick={onSave}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isDirty
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-500 cursor-default'
        }`}
      >
        <Save size={15} />
        저장{isDirty ? ' *' : ''}
      </button>

      <button
        onClick={onRequestReview}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <Send size={15} />
        검토 요청
      </button>
    </div>
  )
}
