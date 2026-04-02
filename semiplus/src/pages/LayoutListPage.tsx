import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Map, Pencil, Trash2, CheckCircle2, Clock,
  Layers, X, ChevronRight, Check,
} from 'lucide-react'
import { PageLayout } from '../components/layout/PageLayout'
import { useLayoutStore } from '../stores/layoutStore'
import { useAuthStore } from '../stores/authStore'
import type { LayoutItem } from '../stores/layoutStore'

export const LayoutListPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { layouts, addLayout, updateLayout, deleteLayout } = useLayoutStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const handleRenameStart = (layout: LayoutItem) => {
    setRenamingId(layout.id)
    setRenameValue(layout.name)
  }

  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      updateLayout(renamingId, { name: renameValue.trim() })
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = `layout_${Date.now()}`
    const layout: LayoutItem = {
      id,
      name: newName.trim(),
      setupStep: 3,
      isSetupComplete: false,
      scaleMeasurements: [],
      gridEnabled: false,
      gridSizeMm: 600,
      placementZones: [],
      ohtRails: [],
      customLayers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdById: currentUser?.id ?? 'unknown',
      createdByName: currentUser?.name ?? '사용자',
    }
    addLayout(layout)
    setNewName('')
    setShowCreate(false)
    // 생성 후 바로 편집 화면으로
    navigate(`/layout/${id}/edit`)
  }

  const handleDelete = (id: string) => {
    deleteLayout(id)
    setConfirmDelete(null)
  }

  return (
    <PageLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">레이아웃 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">FAB 레이아웃 도면을 생성하고 관리합니다</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsEditMode(v => !v); setRenamingId(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                isEditMode
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Pencil size={14} />
              {isEditMode ? '편집 완료' : '편집'}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              새 레이아웃
            </button>
          </div>
        </div>

        {/* 레이아웃 카드 목록 */}
        {layouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20">
            <Map size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium mb-2">레이아웃이 없습니다</p>
            <p className="text-sm text-gray-400 mb-6">새 레이아웃을 생성하여 FAB 도면을 설정하세요</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} />
              새 레이아웃 생성
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {layouts.map(layout => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                onEdit={() => navigate(`/layout/${layout.id}/edit`)}
                onView={() => navigate(`/layout/${layout.id}`)}
                onDelete={() => setConfirmDelete(layout.id)}
                isEditMode={isEditMode}
                isRenaming={renamingId === layout.id}
                renameValue={renameValue}
                onRenameStart={() => handleRenameStart(layout)}
                onRenameChange={setRenameValue}
                onRenameConfirm={handleRenameConfirm}
                onRenameCancel={() => { setRenamingId(null); setRenameValue('') }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 새 레이아웃 생성 모달 */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-96 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Layers size={16} className="text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-gray-900">새 레이아웃</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">레이아웃 이름</label>
                <input
                  type="text"
                  placeholder="예: 1라인, A동 2층, CVD Bay"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400">
                생성 후 11단계 초기 설정 프로세스가 시작됩니다.
              </p>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                생성 및 편집 시작
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-80">
            <h3 className="text-base font-bold text-gray-900 mb-2">레이아웃 삭제</h3>
            <p className="text-sm text-gray-600 mb-5">
              '{layouts.find(l => l.id === confirmDelete)?.name}' 레이아웃을 삭제합니다.<br />
              모든 도면 데이터가 삭제됩니다.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

// ── 레이아웃 카드 ──────────────────────────────────────────

interface CardProps {
  layout: LayoutItem
  onEdit: () => void
  onView: () => void
  onDelete: () => void
  isEditMode: boolean
  isRenaming: boolean
  renameValue: string
  onRenameStart: () => void
  onRenameChange: (v: string) => void
  onRenameConfirm: () => void
  onRenameCancel: () => void
}

const LayoutCard: React.FC<CardProps> = ({
  layout, onEdit, onView, onDelete,
  isEditMode, isRenaming, renameValue,
  onRenameStart, onRenameChange, onRenameConfirm, onRenameCancel,
}) => {
  const progress = layout.isSetupComplete
    ? 100
    : Math.round(((layout.setupStep - 3) / 9) * 100)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return
    if (isEditMode) return
    if (layout.isSetupComplete) onView()
  }

  return (
    <div
      className={`bg-white rounded-2xl border transition-all group overflow-hidden ${
        isEditMode
          ? 'border-blue-300 shadow-sm ring-1 ring-blue-100'
          : `border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 ${layout.isSetupComplete ? 'cursor-pointer' : ''}`
      }`}
      onClick={handleCardClick}
    >
      {/* 미리보기 영역 */}
      <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
        {layout.backgroundImageData ? (
          <img
            src={layout.backgroundImageData}
            alt={layout.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <Map size={36} className="text-slate-300" />
        )}
        {/* 상태 배지 */}
        <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
          layout.isSetupComplete
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          {layout.isSetupComplete
            ? <><CheckCircle2 size={11} /> 완료</>
            : <><Clock size={11} /> 설정 중 ({layout.setupStep - 2}/9)</>
          }
        </div>
      </div>

      {/* 정보 */}
      <div className="p-4">
        {/* 이름: 편집 모드 시 인라인 수정 */}
        {isEditMode && isRenaming ? (
          <div className="flex items-center gap-1.5 mb-1">
            <input
              type="text"
              value={renameValue}
              onChange={e => onRenameChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onRenameConfirm()
                if (e.key === 'Escape') onRenameCancel()
              }}
              autoFocus
              className="flex-1 px-2 py-1 text-sm font-bold border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={onRenameConfirm}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check size={13} />
            </button>
            <button
              onClick={onRenameCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <h3 className="font-bold text-gray-900 mb-1">{layout.name}</h3>
        )}

        {/* 설정 진행도 */}
        {!layout.isSetupComplete && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>초기 설정</span>
              <span>Step {layout.setupStep - 2} / 9</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mb-4">
          {new Date(layout.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 수정
          · {layout.createdByName}
        </p>

        {/* 액션 버튼 */}
        {isEditMode ? (
          /* 편집 모드: 이름 변경 + 삭제 */
          <div className="flex gap-2">
            <button
              onClick={onRenameStart}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={13} />
              이름 변경
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              삭제
            </button>
          </div>
        ) : (
          /* 일반 모드: 설정 미완료 시 설정 계속 버튼만 표시 */
          !layout.isSetupComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Pencil size={14} />
              설정 계속
            </button>
          )
        )}
      </div>
    </div>
  )
}
