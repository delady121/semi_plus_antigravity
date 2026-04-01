import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Settings, User, Zap } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'

const navItems = [
  { label: '대시보드', path: '/dashboard' },
  { label: '레이아웃', path: '/layout' },
  { label: '데이터관리', path: '/data' },
  { label: '워크플로우', path: '/workflow' },
  { label: '설정', path: '/settings' },
]

const roleLabel: Record<string, string> = {
  ADMIN: '관리자',
  PLANNER: '기획자',
  REVIEWER: '검토자',
  VIEWER: '열람자',
}

const roleColor: Record<string, string> = {
  ADMIN:    'from-purple-500 to-indigo-600',
  PLANNER:  'from-blue-500 to-cyan-600',
  REVIEWER: 'from-emerald-500 to-teal-600',
  VIEWER:   'from-slate-400 to-slate-600',
}

export const GNB: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuthStore()
  const { notifications, markAllAsRead } = useNotificationStore()
  const unreadCount = notifications.filter(n => !n.is_read).length

  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 border-b border-white/[0.06]"
      style={{ height: 60, background: '#0F172A' }}
    >
      {/* 로고 */}
      <Link to="/dashboard" className="flex items-center gap-2.5 mr-8 shrink-0 group">
        <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold text-white tracking-tight">Semi-PLUS</span>
          <span className="text-[10px] text-white/40 tracking-widest uppercase font-medium">FAB System</span>
        </div>
      </Link>

      {/* 네비게이션 */}
      <nav className="flex items-center gap-0.5 flex-1">
        {navItems.map(item => {
          const active = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
              }`}
            >
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 우측 액션 영역 */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 알림 */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-400 rounded-full ring-2 ring-navy-900" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-card-lg border border-gray-100 overflow-hidden z-50 animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-gray-500" />
                  <span className="font-semibold text-gray-800 text-sm">알림</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button onClick={markAllAsRead} className="text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors">
                  전체 읽음
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">알림이 없습니다</p>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-brand-50/60' : ''
                      }`}
                    >
                      {!n.is_read && (
                        <span className="inline-block w-1.5 h-1.5 bg-brand-500 rounded-full mb-1" />
                      )}
                      <p className="text-[13px] font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {new Date(n.created_at).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* 프로필 */}
        {currentUser && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-all duration-150 group"
            >
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${roleColor[currentUser.role] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-[11px] font-bold text-white shadow-sm`}>
                {currentUser.name[0]}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-semibold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-white/40 leading-tight">{roleLabel[currentUser.role]}</p>
              </div>
              <ChevronDown size={12} className="text-white/30 group-hover:text-white/60 transition-colors" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-card-lg border border-gray-100 overflow-hidden z-50 animate-slide-up">
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor[currentUser.role] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-sm font-bold text-white mb-2`}>
                    {currentUser.name[0]}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{currentUser.department}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full">
                    {roleLabel[currentUser.role]}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/settings'); setShowProfile(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={15} className="text-gray-400" />
                    설정
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setShowProfile(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={15} className="text-gray-400" />
                    프로필
                  </button>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
