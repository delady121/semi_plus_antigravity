import React from 'react'
import { FileText, User, Calendar, ChevronRight } from 'lucide-react'
import type { LayoutPlan, ApprovalRequest } from '../../types'

interface Props {
  plan: LayoutPlan
  approvals: ApprovalRequest[]
  creatorName: string
  onClick: () => void
  isSelected: boolean
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: '가안', color: 'text-gray-600', bg: 'bg-gray-100' },
  REVIEW_REQUESTED: { label: '검토요청', color: 'text-blue-700', bg: 'bg-blue-100' },
  IN_PROGRESS: { label: '처리중', color: 'text-purple-700', bg: 'bg-purple-100' },
  APPROVED: { label: '최종승인', color: 'text-green-700', bg: 'bg-green-100' },
  REJECTED: { label: '반려', color: 'text-red-700', bg: 'bg-red-100' },
}

const investLabel: Record<string, string> = {
  NEW: '신규', EXPANSION: '증설', REPLACEMENT: '교체', RELOCATION: '이전'
}

const bayLabel: Record<string, string> = { bay1: 'A동 1층', bay2: 'A동 2층', bay3: 'B동 1층' }

const approvalStatusIcon: Record<string, string> = {
  APPROVED: '✅',
  PENDING: '⏳',
  REJECTED: '❌',
}

export const PlanCard: React.FC<Props> = ({ plan, approvals, creatorName, onClick, isSelected }) => {
  const cfg = statusConfig[plan.status] ?? statusConfig.DRAFT

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-blue-400 shadow-md ring-1 ring-blue-300' : 'border-gray-200 hover:border-blue-200'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{plan.title}</h3>
          </div>
          <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          {plan.investment_type && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {investLabel[plan.investment_type]}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {bayLabel[plan.fab_bay_id] ?? plan.fab_bay_id}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User size={11} />
            {creatorName}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(plan.updated_at).toLocaleDateString('ko-KR')}
          </div>
          <div className="ml-auto text-gray-400">v{plan.version}</div>
        </div>

        {/* Approval Progress */}
        {approvals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1.5">검토 현황</p>
            <div className="flex gap-2 flex-wrap">
              {approvals.map(apr => (
                <div key={apr.id} className="flex items-center gap-1 text-xs text-gray-600">
                  <span>{approvalStatusIcon[apr.status] ?? '⏳'}</span>
                  <span>{apr.department}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
