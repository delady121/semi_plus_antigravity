import React from 'react'
import type { AuditLog, Notification } from '../../types'
import { Activity, Bell, Zap } from 'lucide-react'

interface Props {
  auditLogs: AuditLog[]
  notifications: Notification[]
}

const actionLabel: Record<string, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  STATUS_CHANGE: '상태변경',
}

const actionStyle: Record<string, { bg: string; text: string; dot: string }> = {
  CREATE:        { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  UPDATE:        { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  DELETE:        { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500' },
  STATUS_CHANGE: { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500' },
}

const targetLabel: Record<string, string> = {
  LayoutPlan: '기획안',
  Equipment: '설비',
  ApprovalRequest: '검토요청',
  User: '사용자',
}

export const ActivityFeed: React.FC<Props> = ({ auditLogs, notifications }) => {
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 flex flex-col h-full overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
        <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
          <Activity size={13} className="text-brand-600" />
        </div>
        <h3 className="text-[13px] font-semibold text-slate-700">최근 활동</h3>
      </div>

      {/* 활동 로그 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="relative">
          {/* 타임라인 수직선 */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-100" />

          <div className="space-y-3">
            {auditLogs.slice(0, 8).map((log) => {
              const style = actionStyle[log.action] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
              return (
                <div key={log.id} className="flex items-start gap-3 relative">
                  {/* 마커 */}
                  <div className={`w-[18px] h-[18px] rounded-full border-2 border-white ${style.dot} shadow-sm shrink-0 mt-0.5 z-10`} />
                  <div className="flex-1 min-w-0 pb-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>
                        {actionLabel[log.action] ?? log.action}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-700">{log.user_name}</span>
                        {' · '}{targetLabel[log.target_type] ?? log.target_type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 미읽은 알림 */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Bell size={12} className="text-slate-400" />
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">미읽은 알림</h4>
        </div>
        <div className="space-y-1.5">
          {notifications.filter(n => !n.is_read).slice(0, 3).map(n => (
            <div key={n.id} className="flex items-start gap-2 bg-brand-50 rounded-lg p-2.5 border border-brand-100/50">
              <Zap size={11} className="text-brand-500 mt-0.5 shrink-0" fill="currentColor" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate">{n.title}</p>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
              </div>
            </div>
          ))}
          {notifications.filter(n => !n.is_read).length === 0 && (
            <p className="text-[12px] text-slate-400 text-center py-2">미읽은 알림이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
