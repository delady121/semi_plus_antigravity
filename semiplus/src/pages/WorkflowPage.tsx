import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, X, MessageSquare, FileText, Send } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { mockService } from '../services/mockData'
import { useWorkflowStore } from '../stores/workflowStore'
import { useAuthStore } from '../stores/authStore'
import type { PlanStatus, Comment } from '../types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }> = {
  DRAFT:            { label: '가안',     color: 'text-slate-600',   bg: 'bg-slate-100',    ring: 'ring-slate-200',   icon: <AlertCircle size={13} /> },
  REVIEW_REQUESTED: { label: '검토 요청', color: 'text-brand-600',   bg: 'bg-brand-50',     ring: 'ring-brand-200',   icon: <Send size={13} /> },
  IN_PROGRESS:      { label: '처리 중',   color: 'text-sky-600',     bg: 'bg-sky-50',       ring: 'ring-sky-200',     icon: <Clock size={13} /> },
  APPROVED:         { label: '최종 승인', color: 'text-emerald-700', bg: 'bg-emerald-50',   ring: 'ring-emerald-200', icon: <CheckCircle size={13} /> },
  REJECTED:         { label: '반려',     color: 'text-red-600',     bg: 'bg-red-50',       ring: 'ring-red-200',     icon: <XCircle size={13} /> },
}

const INVEST_LABEL: Record<string, string> = {
  NEW: '신규투자', EXPANSION: '증설', REPLACEMENT: '대체', RELOCATION: '이설'
}

const ALL_STATUS_FILTERS: (PlanStatus | 'ALL')[] = ['ALL', 'DRAFT', 'REVIEW_REQUESTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED']

export const WorkflowPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const {
    plans, approvalRequests, selectedPlanId, activeTab,
    setPlans, setApprovalRequests, setSelectedPlanId, setActiveTab,
    updatePlanStatus, updateApprovalStatus,
  } = useWorkflowStore()

  const [statusFilter, setStatusFilter] = useState<PlanStatus | 'ALL'>('ALL')
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null)

  const { data: fetchedPlans = [] } = useQuery({
    queryKey: ['layoutPlans'],
    queryFn: mockService.getLayoutPlans,
  })
  const { data: fetchedRequests = [] } = useQuery({
    queryKey: ['approvalRequests'],
    queryFn: () => mockService.getApprovalRequests(),
  })
  const { data: fetchedComments = [] } = useQuery<Comment[]>({
    queryKey: ['comments'],
    queryFn: () => mockService.getComments(),
  })

  useEffect(() => { if (fetchedPlans.length) setPlans(fetchedPlans) }, [fetchedPlans, setPlans])
  useEffect(() => { if (fetchedRequests.length) setApprovalRequests(fetchedRequests) }, [fetchedRequests, setApprovalRequests])
  useEffect(() => { if (fetchedComments.length) setComments(fetchedComments) }, [fetchedComments])

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const planApprovals = approvalRequests.filter(r => r.plan_id === selectedPlanId)
  const planComments = comments.filter(c => c.plan_id === selectedPlanId)

  // Filter plans by tab and status
  const filteredPlans = plans.filter(plan => {
    if (statusFilter !== 'ALL' && plan.status !== statusFilter) return false
    if (activeTab === 'mine') return plan.created_by === currentUser?.id
    if (activeTab === 'review') {
      return approvalRequests.some(r => r.plan_id === plan.id && r.reviewer_id === currentUser?.id)
    }
    return true
  })

  const handleApprove = async (requestId: string) => {
    await new Promise(r => setTimeout(r, 300))
    updateApprovalStatus(requestId, 'APPROVED', commentText || undefined)
    // Check if all approved → update plan status
    const updated = approvalRequests.map(r =>
      r.id === requestId ? { ...r, status: 'APPROVED' as const } : r
    )
    const planReqs = updated.filter(r => r.plan_id === selectedPlanId)
    const allApproved = planReqs.every(r => r.status === 'APPROVED')
    const anyRejected = planReqs.some(r => r.status === 'REJECTED')
    if (allApproved) {
      updatePlanStatus(selectedPlanId!, 'APPROVED')
      toast.success('최종 승인 완료! 기획안이 확정되었습니다.')
    } else if (!anyRejected) {
      updatePlanStatus(selectedPlanId!, 'IN_PROGRESS')
      toast.success('승인 처리되었습니다.')
    }
    setCommentText('')
  }

  const handleReject = (requestId: string) => {
    setPendingRejectId(requestId)
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!pendingRejectId) return
    await new Promise(r => setTimeout(r, 300))
    updateApprovalStatus(pendingRejectId, 'REJECTED', rejectReason)
    updatePlanStatus(selectedPlanId!, 'REJECTED')
    toast.error('반려 처리되었습니다.')
    setShowRejectModal(false)
    setPendingRejectId(null)
    setRejectReason('')
  }

  const handleRequestReview = async (planId: string) => {
    await new Promise(r => setTimeout(r, 400))
    updatePlanStatus(planId, 'REVIEW_REQUESTED')
    toast.success('검토 요청이 발송되었습니다.')
  }

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedPlanId || !currentUser) return
    const newComment: Comment = {
      id: `cmt_${Date.now()}`,
      plan_id: selectedPlanId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      department: currentUser.department,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, newComment])
    setCommentText('')
    toast.success('의견이 등록되었습니다.')
  }

  const canApprove = currentUser?.role === 'REVIEWER' || currentUser?.role === 'ADMIN'

  return (
    <PageLayout>
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-widest mb-1">Workflow</p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">워크플로우</h1>
        <p className="text-[13px] text-slate-400 mt-1">기획안 요청 · 검토 · 승인 통합 관리</p>
      </div>
      <div className="flex gap-5 min-h-[calc(100vh-180px)]">
        {/* Left: Plan List */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4">
          {/* Tab */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
            {(['mine', 'review'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab === 'mine' ? '내가 요청한 기획안' : '내가 검토할 항목'}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUS_FILTERS.map(s => {
              const cfg = s === 'ALL' ? null : STATUS_CONFIG[s]
              const isActive = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-800'
                      : `${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-600'} border-transparent hover:opacity-80`
                  }`}
                >
                  {s === 'ALL' ? '전체' : cfg?.label}
                </button>
              )
            })}
          </div>

          {/* Plan Cards */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
            {filteredPlans.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">해당하는 기획안이 없습니다</p>
              </div>
            ) : (
              filteredPlans.map(plan => {
                const cfg = STATUS_CONFIG[plan.status]
                const planReqs = approvalRequests.filter(r => r.plan_id === plan.id)
                const approvedCount = planReqs.filter(r => r.status === 'APPROVED').length
                const isSelected = selectedPlanId === plan.id
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`text-left bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                      isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-gray-800 text-sm line-clamp-2 flex-1">{plan.title}</span>
                      <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                      {plan.investment_type && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {INVEST_LABEL[plan.investment_type]}
                        </span>
                      )}
                    </div>
                    {planReqs.length > 0 && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${(approvedCount / planReqs.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{approvedCount}/{planReqs.length}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(plan.updated_at).toLocaleDateString('ko-KR')} 수정
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {selectedPlan ? (
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedPlan.status]
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      )
                    })()}
                    {selectedPlan.investment_type && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {INVEST_LABEL[selectedPlan.investment_type]}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-2">{selectedPlan.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    수정일: {new Date(selectedPlan.updated_at).toLocaleString('ko-KR')} · 버전 {selectedPlan.version}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlanId(null)}
                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                {(selectedPlan.status === 'DRAFT') &&
                 (currentUser?.id === selectedPlan.created_by || currentUser?.role === 'ADMIN') && (
                  <button
                    onClick={() => handleRequestReview(selectedPlan.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    검토 요청 발송
                  </button>
                )}
                <button
                  onClick={() => window.open('/layout', '_blank')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <FileText size={14} />
                  도면 보기
                </button>
              </div>
            </div>

            {/* Approval Progress */}
            {planApprovals.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  검토 부서 진행 현황
                </h3>
                <div className="space-y-3">
                  {planApprovals.map(req => {
                    const isMyRequest = req.reviewer_id === currentUser?.id
                    return (
                      <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          req.status === 'APPROVED' ? 'bg-green-100' :
                          req.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {req.status === 'APPROVED' ? <CheckCircle size={16} className="text-green-600" /> :
                           req.status === 'REJECTED' ? <XCircle size={16} className="text-red-600" /> :
                           <Clock size={16} className="text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800">{req.department}</span>
                            <span className="text-xs text-gray-500">{req.reviewer_name}</span>
                            {isMyRequest && canApprove && req.status === 'PENDING' && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">내 검토</span>
                            )}
                          </div>
                          {req.comment && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{req.comment}</p>
                          )}
                          {req.reviewed_at && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(req.reviewed_at).toLocaleString('ko-KR')}
                            </p>
                          )}
                          {/* Approve/Reject Buttons */}
                          {isMyRequest && canApprove && req.status === 'PENDING' &&
                           (selectedPlan.status === 'REVIEW_REQUESTED' || selectedPlan.status === 'IN_PROGRESS') && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg"
                              >
                                <CheckCircle size={12} /> 승인
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
                              >
                                <XCircle size={12} /> 반려
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {req.status === 'APPROVED' ? '승인' : req.status === 'REJECTED' ? '반려' : '대기중'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Comment Thread */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                의견 스레드
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {planComments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">아직 의견이 없습니다</p>
                ) : (
                  planComments.map(cmt => (
                    <div key={cmt.id} className={`flex gap-3 ${cmt.user_id === currentUser?.id ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        cmt.user_id === currentUser?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {cmt.user_name[0]}
                      </div>
                      <div className={`max-w-xs ${cmt.user_id === currentUser?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-gray-700">{cmt.user_name}</span>
                          <span className="text-xs text-gray-400">{cmt.department}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl text-sm ${
                          cmt.user_id === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cmt.content}
                        </div>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(cmt.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="의견을 입력하세요..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors"
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">기획안을 선택하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">반려 사유 입력</h3>
            <p className="text-sm text-gray-500 mb-4">반려 사유를 입력해주세요 (필수)</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="반려 사유를 상세히 입력해주세요..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white rounded-lg text-sm font-medium transition-colors"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
