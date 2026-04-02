import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X } from 'lucide-react'

interface Props {
  onConfirm: (reason: string) => void
  onCancel: () => void
  changedCount?: number
}

export const ChangeReasonModal: React.FC<Props> = ({ onConfirm, onCancel, changedCount }) => {
  const [reason, setReason] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConfirm = () => {
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-[420px] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: '#1E293B' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={14} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">변경 사유 입력</span>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {changedCount !== undefined && (
            <p className="text-[13px] text-white/60">
              <span className="text-brand-300 font-semibold">{changedCount}개 행</span>의 데이터가 변경됩니다.
              저장 전 변경 사유를 입력해주세요.
            </p>
          )}
          <textarea
            ref={inputRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleConfirm() }}
            placeholder="변경 사유를 입력하세요 (예: 설비 스펙 수정, 오기입 정정 등)"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
          />
          <p className="text-[11px] text-white/25">Ctrl+Enter로 저장</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.08]">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
