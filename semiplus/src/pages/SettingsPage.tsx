import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Bell, Building2, Shield, Pencil, Check, X } from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { mockService } from '../services/mockData'
import { useAuthStore } from '../stores/authStore'
import type { User } from '../types'
import toast from 'react-hot-toast'

const ROLE_CONFIG = {
  ADMIN: { label: '관리자', color: 'text-purple-700', bg: 'bg-purple-100' },
  PLANNER: { label: '기획자', color: 'text-blue-700', bg: 'bg-blue-100' },
  REVIEWER: { label: '검토자', color: 'text-green-700', bg: 'bg-green-100' },
  VIEWER: { label: '열람자', color: 'text-gray-600', bg: 'bg-gray-100' },
}

const TABS = [
  { key: 'users', label: '사용자 관리', icon: <Users size={16} /> },
  { key: 'notifications', label: '알림 설정', icon: <Bell size={16} /> },
  { key: 'bays', label: 'FAB Bay 관리', icon: <Building2 size={16} /> },
]

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('users')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<User['role']>('VIEWER')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: mockService.getUsers,
  })
  const { data: bays = [] } = useQuery({
    queryKey: ['fabBays'],
    queryFn: mockService.getFabBays,
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  const handleEditRole = (user: User) => {
    setEditingUserId(user.id)
    setEditRole(user.role)
  }

  const handleSaveRole = () => {
    toast.success('사용자 역할이 변경되었습니다.')
    setEditingUserId(null)
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">시스템 설정</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 관리 및 환경 설정</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(tab => {
            if (tab.key === 'users' && !isAdmin) return null
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shield size={16} className="text-purple-500" />
                사용자 관리
              </h2>
              {isAdmin && (
                <button
                  onClick={() => toast.success('사용자 초대 기능은 준비 중입니다.')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  + 사용자 초대
                </button>
              )}
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">사번</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                    {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">최근 로그인</th>}
                    {isAdmin && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const cfg = ROLE_CONFIG[user.role]
                    const isEditing = editingUserId === user.id
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-gray-600 font-mono">{user.employee_id}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                              {user.name[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{user.name}</span>
                            {user.id === currentUser?.id && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">나</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{user.department}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-3">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value as User['role'])}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Object.entries(ROLE_CONFIG).map(([r, c]) => (
                                <option key={r} value={r}>{c.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-3 text-xs text-gray-400">
                            {user.last_login_at
                              ? new Date(user.last_login_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-6 py-3">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button onClick={handleSaveRole} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md">
                                  <Check size={14} />
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditRole(user)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Bell size={16} className="text-blue-500" />
              알림 설정
            </h2>
            <div className="space-y-4">
              {[
                { label: '검토 요청 알림', desc: '내 기획안 검토 요청 수신 시 알림', defaultOn: true },
                { label: '승인/반려 알림', desc: '검토자가 승인 또는 반려 시 알림', defaultOn: true },
                { label: 'D-Day 리마인더', desc: '설비 반입 예정일 D-7, D-3, D-1 알림', defaultOn: true },
                { label: '기획안 변경 알림', desc: '내가 검토 중인 기획안 변경 시 알림', defaultOn: true },
                { label: '이메일 알림', desc: '시스템 알림 외 이메일로도 발송', defaultOn: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" onChange={() => toast.success('알림 설정이 변경되었습니다.')} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAB Bay Tab */}
        {activeTab === 'bays' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 size={16} className="text-orange-500" />
                FAB Bay 관리
              </h2>
              {isAdmin && (
                <button
                  onClick={() => toast.success('Bay 추가 기능은 준비 중입니다.')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  + Bay 추가
                </button>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {bays.map(bay => (
                <div key={bay.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                    <Building2 size={20} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{bay.name}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">층수</span>
                      <span className="font-medium text-gray-700">{bay.floor}층</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">면적</span>
                      <span className="font-medium text-gray-700">{bay.area_sqm.toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">축척</span>
                      <span className="font-medium text-gray-700">{bay.scale_mm_per_px} mm/px</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => toast.success('Bay 설정 편집은 준비 중입니다.')}
                      className="mt-3 w-full py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                    >
                      편집
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
