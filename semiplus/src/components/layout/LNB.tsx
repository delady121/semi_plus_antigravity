import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, Database, GitBranch, Settings,
  ChevronLeft, ChevronRight,
  BarChart3, Layers, FileText, Users, Bell, Building2, Activity
} from 'lucide-react'

interface SubMenu {
  label: string
  path: string
  icon: React.ReactNode
}

interface NavSection {
  key: string
  label: string
  path: string
  icon: React.ReactNode
  subMenus: SubMenu[]
}

const navSections: NavSection[] = [
  {
    key: 'dashboard',
    label: '대시보드',
    path: '/dashboard',
    icon: <LayoutDashboard size={17} />,
    subMenus: [
      { label: '전체 현황', path: '/dashboard', icon: <BarChart3 size={15} /> },
      { label: '설비 현황', path: '/dashboard/equipment', icon: <Activity size={15} /> },
    ]
  },
  {
    key: 'layout',
    label: '레이아웃',
    path: '/layout',
    icon: <Map size={17} />,
    subMenus: [
      { label: '에디터', path: '/layout/editor', icon: <Layers size={15} /> },
      { label: 'Bay 목록', path: '/layout/bays', icon: <Building2 size={15} /> },
    ]
  },
  {
    key: 'data',
    label: '데이터관리',
    path: '/data',
    icon: <Database size={17} />,
    subMenus: [
      { label: '설비 마스터', path: '/data', icon: <FileText size={15} /> },
    ]
  },
  {
    key: 'workflow',
    label: '워크플로우',
    path: '/workflow',
    icon: <GitBranch size={17} />,
    subMenus: [
      { label: '기획안 목록', path: '/workflow', icon: <FileText size={15} /> },
    ]
  },
  {
    key: 'settings',
    label: '설정',
    path: '/settings',
    icon: <Settings size={17} />,
    subMenus: [
      { label: '사용자 관리', path: '/settings/users', icon: <Users size={15} /> },
      { label: '알림 설정', path: '/settings/notifications', icon: <Bell size={15} /> },
      { label: 'Bay 관리', path: '/settings/bays', icon: <Building2 size={15} /> },
    ]
  },
]

export const LNB: React.FC = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const currentSection = navSections.find(s => location.pathname.startsWith(s.path))

  return (
    <aside
      className="fixed left-0 top-[60px] bottom-0 flex flex-col transition-all duration-200 z-40 border-r border-white/[0.06]"
      style={{
        width: collapsed ? 64 : 220,
        background: '#0F172A',
      }}
    >
      {/* 현재 섹션 헤더 */}
      {!collapsed && currentSection && (
        <div className="px-4 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 text-white/80">
            <span className="text-brand-400">{currentSection.icon}</span>
            <span className="font-semibold text-sm">{currentSection.label}</span>
          </div>
        </div>
      )}

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-3">
        {collapsed ? (
          // 접힌 상태: 아이콘만
          <div className="flex flex-col items-center gap-1 px-2">
            {navSections.map(section => {
              const active = location.pathname.startsWith(section.path)
              return (
                <NavLink
                  key={section.key}
                  to={section.subMenus[0]?.path ?? section.path}
                  title={section.label}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                  }`}
                >
                  {section.icon}
                </NavLink>
              )
            })}
          </div>
        ) : (
          // 펼친 상태
          currentSection ? (
            <div className="px-3">
              {/* 현재 섹션 서브메뉴 */}
              {currentSection.subMenus.map(sub => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  end={sub.path === currentSection.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 mb-0.5 ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-300 font-medium'
                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                    }`
                  }
                >
                  {sub.icon}
                  {sub.label}
                </NavLink>
              ))}

              {/* 다른 섹션으로 이동 */}
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/25 uppercase tracking-widest font-semibold mb-2 px-3">메뉴</p>
                {navSections.filter(s => s.key !== currentSection.key).map(section => {
                  const active = location.pathname.startsWith(section.path)
                  return (
                    <NavLink
                      key={section.key}
                      to={section.subMenus[0]?.path ?? section.path}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 mb-0.5 ${
                        active
                          ? 'bg-brand-500/20 text-brand-300 font-medium'
                          : 'text-white/30 hover:bg-white/[0.06] hover:text-white/60'
                      }`}
                    >
                      {section.icon}
                      {section.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="px-3">
              {navSections.map(section => (
                <NavLink
                  key={section.key}
                  to={section.subMenus[0]?.path ?? section.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 mb-0.5 ${
                      isActive
                        ? 'bg-brand-500/20 text-brand-300 font-medium'
                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
                    }`
                  }
                >
                  {section.icon}
                  {section.label}
                </NavLink>
              ))}
            </div>
          )
        )}
      </nav>

      {/* 하단 영역 */}
      <div className="border-t border-white/[0.06]">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-full flex items-center gap-2 px-4 py-3 text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
          title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : (
              <>
                <ChevronLeft size={15} />
                <span className="text-[11px]">메뉴 접기</span>
              </>
            )
          }
        </button>
        {!collapsed && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-white/20">Semi-PLUS v1.0.0</p>
          </div>
        )}
      </div>
    </aside>
  )
}
