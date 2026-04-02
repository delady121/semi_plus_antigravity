import React, { useState } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import type { CustomMenuItem } from '../../stores/menuStore'
import { ICON_OPTIONS, renderIcon } from './menuIcons'

interface Props {
  sectionKey: string
  sectionLabel: string
  items: CustomMenuItem[]
  onSave: (items: CustomMenuItem[]) => void
  onClose: () => void
}

export const MenuEditModal: React.FC<Props> = ({
  sectionKey,
  sectionLabel,
  items,
  onSave,
  onClose,
}) => {
  const [localItems, setLocalItems] = useState<CustomMenuItem[]>([...items])
  const [newLabel, setNewLabel] = useState('')
  const [newPath, setNewPath] = useState('')
  const [newIconType, setNewIconType] = useState('ChevronRight')

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...localItems]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setLocalItems(next)
  }

  const moveDown = (idx: number) => {
    if (idx === localItems.length - 1) return
    const next = [...localItems]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setLocalItems(next)
  }

  const deleteItem = (id: string) => {
    setLocalItems(prev => prev.filter(i => i.id !== id))
  }

  const addItem = () => {
    if (!newLabel.trim() || !newPath.trim()) return
    const rawPath = newPath.trim()
    const item: CustomMenuItem = {
      id: `${sectionKey}-${Date.now()}`,
      label: newLabel.trim(),
      path: rawPath.startsWith('/') ? rawPath : `/${rawPath}`,
      iconType: newIconType,
    }
    setLocalItems(prev => [...prev, item])
    setNewLabel('')
    setNewPath('')
    setNewIconType('ChevronRight')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[480px] max-h-[80vh] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: '#1E293B' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Pencil size={14} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">
              {sectionLabel} 메뉴 편집
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 현재 항목 */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
              현재 메뉴 항목
            </p>
            {localItems.length === 0 ? (
              <p className="text-center text-white/25 text-xs py-5">
                메뉴 항목이 없습니다
              </p>
            ) : (
              <div className="space-y-1.5">
                {localItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] group hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-white/40 shrink-0">
                      {renderIcon(item.iconType, 14)}
                    </span>
                    <span className="flex-1 text-[13px] text-white/80">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-white/25 font-mono truncate max-w-[140px]">
                      {item.path}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === localItems.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 새 항목 추가 */}
          <div className="pt-3 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">
              새 항목 추가
            </p>
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="메뉴 이름"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
              <input
                type="text"
                placeholder="경로 (예: /layout/1라인)"
                value={newPath}
                onChange={e => setNewPath(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addItem() }}
                className="w-full px-3 py-2 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 transition-colors font-mono"
              />

              {/* 아이콘 선택 */}
              <div>
                <p className="text-[11px] text-white/30 mb-2">아이콘 선택</p>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => setNewIconType(opt.type)}
                      title={opt.label}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${
                        newIconType === opt.type
                          ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                          : 'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60'
                      }`}
                    >
                      {renderIcon(opt.type, 14)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addItem}
                disabled={!newLabel.trim() || !newPath.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus size={14} />
                항목 추가
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            취소
          </button>
          <button
            onClick={() => onSave(localItems)}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-400 transition-all shadow-glow-sm"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
