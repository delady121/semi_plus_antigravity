import React from 'react'
import { History, X, Clock, User } from 'lucide-react'
import type { TableChangeRecord } from '../../types'

interface Props {
  tableName: string
  history: TableChangeRecord[]
  onClose: () => void
}

export const HistoryPanel: React.FC<Props> = ({ tableName, history, onClose }) => {
  return (
    <div
      className="fixed right-0 top-[60px] bottom-0 w-80 border-l border-white/[0.06] flex flex-col z-30 shadow-2xl"
      style={{ background: '#0F172A' }}
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <History size={15} className="text-brand-400" />
          <span className="text-sm font-semibold text-white">변경 이력</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-white/[0.06]">
        <p className="text-[11px] text-white/30 truncate">{tableName}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/25">
            <History size={28} className="mb-2 opacity-40" />
            <p className="text-xs">변경 이력이 없습니다</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {history.map((record, idx) => (
              <div
                key={record.id}
                className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    idx === 0
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-white/[0.06] text-white/40'
                  }`}>
                    #{history.length - idx}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {record.rowCount}행 변경
                  </span>
                </div>
                <p className="text-[13px] text-white/80 mb-2 leading-snug">{record.reason}</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                    <User size={10} />
                    <span>{record.userName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                    <Clock size={10} />
                    <span>{new Date(record.timestamp).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
