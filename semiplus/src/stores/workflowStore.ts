import { create } from 'zustand'
import type { LayoutPlan, ApprovalRequest, PlanStatus, ApprovalStatus } from '../types'

interface WorkflowState {
  plans: LayoutPlan[]
  approvalRequests: ApprovalRequest[]
  selectedPlanId: string | null
  activeTab: 'mine' | 'review'

  setPlans: (plans: LayoutPlan[]) => void
  setApprovalRequests: (requests: ApprovalRequest[]) => void
  setSelectedPlanId: (id: string | null) => void
  setActiveTab: (tab: 'mine' | 'review') => void
  updatePlanStatus: (planId: string, status: PlanStatus) => void
  updateApprovalStatus: (requestId: string, status: ApprovalStatus, comment?: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  plans: [],
  approvalRequests: [],
  selectedPlanId: null,
  activeTab: 'mine',

  setPlans: (plans) => set({ plans }),
  setApprovalRequests: (requests) => set({ approvalRequests: requests }),
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  updatePlanStatus: (planId, status) => set(state => ({
    plans: state.plans.map(p => p.id === planId ? { ...p, status } : p)
  })),

  updateApprovalStatus: (requestId, status, comment) => set(state => ({
    approvalRequests: state.approvalRequests.map(r =>
      r.id === requestId
        ? { ...r, status, comment: comment ?? r.comment, reviewed_at: new Date().toISOString() }
        : r
    )
  })),
}))
