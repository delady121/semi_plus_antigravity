import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Zap, User, Lock, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { mockUsers } from '../services/mockData'

const QUICK_ACCOUNTS = [
  { label: '김관리', role: 'ADMIN', id: 'u1', color: 'from-purple-500 to-indigo-600' },
  { label: '이계획', role: 'PLANNER', id: 'u2', color: 'from-blue-500 to-cyan-600' },
  { label: '정검토', role: 'REVIEWER', id: 'u5', color: 'from-emerald-500 to-teal-600' },
  { label: '신열람', role: 'VIEWER', id: 'u9', color: 'from-slate-400 to-slate-600' },
]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자', PLANNER: '기획자', REVIEWER: '검토자', VIEWER: '열람자',
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const user = mockUsers.find(u => u.employee_id === employeeId)
    if (user) {
      login(user)
      toast.success(`환영합니다, ${user.name}님!`)
      navigate('/')
    } else {
      toast.error('사번 또는 비밀번호를 확인해주세요.')
    }
    setLoading(false)
  }

  const handleQuickLogin = async (userId: string) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      login(user)
      toast.success(`환영합니다, ${user.name}님!`)
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #050A14 0%, #0F172A 40%, #1a1040 70%, #0F172A 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradientShift 8s ease infinite',
      }}
    >
      {/* 배경 글로우 장식 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 그리드 패턴 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 mb-4 shadow-glow">
            <Zap size={28} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Semi-PLUS</h1>
          <p className="text-white/40 mt-2 text-sm tracking-wide">FAB Layout & Collaboration System</p>
        </div>

        {/* 로그인 카드 — Glassmorphism */}
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 사번 입력 */}
            <div>
              <label className="block text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-2">사번</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="EMP001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] text-white placeholder-white/25 outline-none transition-all duration-200
                    border border-white/10 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-2">비밀번호</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] text-white placeholder-white/25 outline-none transition-all duration-200
                    border border-white/10 focus:border-brand-400/60 focus:ring-2 focus:ring-brand-400/20"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading || !employeeId}
              className="w-full py-3 rounded-xl font-bold text-[14px] text-white flex items-center justify-center gap-2
                bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-glow transition-all duration-200 hover:shadow-glow mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  로그인
                </>
              )}
            </button>
          </form>

          {/* 개발용 빠른 로그인 */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-[11px] text-white/30 text-center mb-3 uppercase tracking-widest">개발용 빠른 로그인</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleQuickLogin(acc.id)}
                  disabled={loading}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/20
                    transition-all duration-150 disabled:opacity-40 group"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${acc.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                      {acc.label[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-[12px] font-semibold text-white/80 leading-tight">{acc.label}</p>
                      <p className="text-[10px] text-white/35">{ROLE_LABEL[acc.role]}</p>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/20 text-[11px] mt-6">
          © 2026 Semi-PLUS · 제조기획팀
        </p>
      </div>
    </div>
  )
}
