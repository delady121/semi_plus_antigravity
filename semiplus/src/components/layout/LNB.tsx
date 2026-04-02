import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Map, Database, GitBranch, Settings,
  ChevronLeft, ChevronRight, Layers,
} from 'lucide-react'
import { useMenuStore } from '../../stores/menuStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { useDashboardStore } from '../../stores/dashboardStore'
import { renderIcon } from './menuIcons'

interface NavSection {
  key: string
  label: string
  path: string
  icon: React.ReactNode
}

const navSections: NavSection[] = [
  { key: 'dashboard', label: '대시보드', path: '/dashboard', icon: <LayoutDashboard size={17} /> },
  { key: 'layout',    label: '레이아웃',  path: '/layout',    icon: <Map size={17} /> },
  { key: 'data',      label: '데이터관리', path: '/data',     icon: <Database size={17} /> },
  { key: 'workflow',  label: '워크플로우', path: '/workflow',  icon: <GitBranch size={17} /> },
  { key: 'settings',  label: '설정',      path: '/settings',  icon: <Settings size={17} /> },
]

export const LNB: React.FC = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const { sections } = useMenuStore()
  const { layouts } = useLayoutStore()
  const { dashboards } = useDashboardStore()

  const currentSection = navSections.find(s => location.pathname.startsWith(s.path))

  // 대시보드/레이아웃 섹션은 생성된 항목을 자동으로 서브메뉴에 추가
  const getSubMenus = (key: string) => {
    const stored = sections[key] ?? []
    if (key === 'dashboard') return getDashboardSubMenus()
    if (key !== 'layout') return stored

    // 레이아웃 목록 관리 항목 + 사용자 생성 레이아웃 자동 추가
    const mgmtItem = { id: 'layout-mgmt', label: '레이아웃 관리', path: '/layout', iconType: 'Layers' }
    const layoutItems = layouts.map(l => ({
      id: `layout-${l.id}`,
      label: l.name,
      path: l.isSetupComplete ? `/layout/${l.id}` : `/layout/${l.id}/edit`,
      iconType: 'Map',
    }))
    return [mgmtItem, ...layoutItems]
  }

  const getDashboardSubMenus = () => {
    return dashboards.map(d => ({
      id: `dash-${d.id}`,
      label: d.name,
      path: `/dashboard/${d.id}`,
      iconType: 'LayoutDashboard',
    }))
  }

  return (
    <>
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
              <span className="font-semibold text-sm flex-1">{currentSection.label}</span>
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
                    to={getSubMenus(section.key)[0]?.path ?? section.path}
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
            currentSection ? (
              <div className="px-3">
                {/* 현재 섹션 서브메뉴 */}
                {getSubMenus(currentSection.key).map(sub => (
                  <NavLink
                    key={sub.id}
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
                    {renderIcon(sub.iconType, 15)}
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
                        to={getSubMenus(section.key)[0]?.path ?? section.path}
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
                    to={getSubMenus(section.key)[0]?.path ?? section.path}
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

    </>
  )
}
