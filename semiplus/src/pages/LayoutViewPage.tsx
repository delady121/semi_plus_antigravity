import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Pencil, Search, Grid3x3, CalendarDays, X, ChevronRight,
  ZoomIn, ZoomOut, RefreshCw, Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../components/layout/PageLayout'
import { EditorCanvas } from '../components/layout-editor/EditorCanvas'
import { useLayoutStore } from '../stores/layoutStore'
import { mockService } from '../services/mockData'

type PanelTab = 'search' | 'groups' | 'date' | 'optimize' | null

interface EquipmentGroup {
  id: string
  color: string
  equipmentNos: string[]
  label: string
}

const GROUP_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6']

export const LayoutViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })
  const [activePanel, setActivePanel] = useState<PanelTab>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedMonth, setSelectedMonth] = useState(4)
  const [groups, setGroups] = useState<EquipmentGroup[]>([])
  const [newGroupInput, setNewGroupInput] = useState('')
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0])
  const [isOptimizing, setIsOptimizing] = useState(false)

  const { layouts } = useLayoutStore()
  const layout = layouts.find(l => l.id === id)

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: mockService.getEquipment,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setCanvasSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 설비 검색 결과
  const searchResults = searchQuery.trim()
    ? equipment.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.equipment_no.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : []

  const addGroup = () => {
    const lines = newGroupInput.trim().split('\n').filter(Boolean)
    if (!lines.length) return
    const newGroup: EquipmentGroup = {
      id: `grp_${Date.now()}`,
      color: newGroupColor,
      equipmentNos: lines,
      label: `그룹 ${groups.length + 1}`,
    }
    if (groups.length < 5) {
      setGroups(prev => [...prev, newGroup])
      setNewGroupInput('')
      setNewGroupColor(GROUP_COLORS[groups.length + 1] ?? GROUP_COLORS[0])
    }
  }

  const removeGroup = (id: string) => setGroups(prev => prev.filter(g => g.id !== id))

  const handleOptimize = async () => {
    setIsOptimizing(true)
    toast.loading('최적화 분석 중...', { id: 'optimize' })
    await new Promise(r => setTimeout(r, 2000))
    setIsOptimizing(false)
    toast.success('최적화 분석이 완료되었습니다.', { id: 'optimize' })
  }

  if (!layout) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm font-medium">레이아웃을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/layout')}
            className="mt-4 px-4 py-2 rounded-lg text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout fullWidth>
      <div className="flex h-full">
        {/* Canvas 영역 */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
            </div>
          ) : (
            <EditorCanvas
              equipment={equipment}
              containerWidth={canvasSize.w}
              containerHeight={canvasSize.h}
              readonly
              layout={layout}
            />
          )}

          {/* 편집 버튼 (우상단) */}
          <button
            onClick={() => navigate(`/layout/${id}/edit`)}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/90 border border-gray-200 text-gray-600 hover:bg-white shadow-sm backdrop-blur-sm transition-all"
          >
            <Pencil size={12} />
            편집
          </button>

          {/* 하단 줌 컨트롤 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 border border-gray-200 rounded-xl shadow-sm px-1 py-1 backdrop-blur-sm">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <ZoomOut size={15} />
            </button>
            <span className="text-xs text-gray-500 px-2 font-medium">100%</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <ZoomIn size={15} />
            </button>
          </div>
        </div>

        {/* 우측 기능 패널 */}
        <aside className="w-64 shrink-0 border-l border-gray-200 bg-white flex flex-col">
          {/* 레이아웃명 */}
          <div className="px-4 py-3.5 border-b border-gray-100">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">레이아웃 보기</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{layout.name}</p>
          </div>

          {/* 기능 탭 버튼 */}
          <div className="px-3 py-3 space-y-1 border-b border-gray-100">
            <FunctionTab
              icon={<Search size={14} />}
              label="설비 검색"
              active={activePanel === 'search'}
              onClick={() => setActivePanel(p => p === 'search' ? null : 'search')}
            />
            <FunctionTab
              icon={<Grid3x3 size={14} />}
              label="설비 구분 표기"
              active={activePanel === 'groups'}
              onClick={() => setActivePanel(p => p === 'groups' ? null : 'groups')}
            />
            <FunctionTab
              icon={<CalendarDays size={14} />}
              label="날짜 선택 (반출입)"
              active={activePanel === 'date'}
              onClick={() => setActivePanel(p => p === 'date' ? null : 'date')}
            />
            <FunctionTab
              icon={<Zap size={14} />}
              label="최적화 배치 검토"
              active={activePanel === 'optimize'}
              onClick={() => setActivePanel(p => p === 'optimize' ? null : 'optimize')}
            />
          </div>

          {/* 기능 패널 내용 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'search' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="설비명 또는 EQP_ID 검색"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map(eq => (
                      <button
                        key={eq.id}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <p className="text-[13px] font-medium text-gray-800">{eq.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{eq.equipment_no}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">검색 결과 없음</p>
                )}
              </div>
            )}

            {activePanel === 'groups' && (
              <div className="space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  설비 번호를 입력하면 선택한 색상으로 도면에 표기됩니다. 최대 5개 그룹.
                </p>

                {/* 그룹 추가 */}
                {groups.length < 5 && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {GROUP_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewGroupColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${newGroupColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <textarea
                      placeholder="EQP_ID 입력 (한 줄에 하나씩)"
                      value={newGroupInput}
                      onChange={e => setNewGroupInput(e.target.value)}
                      rows={3}
                      className="w-full px-2.5 py-2 rounded-lg text-xs border border-gray-200 focus:outline-none focus:border-blue-400 resize-none font-mono"
                    />
                    <button
                      onClick={addGroup}
                      disabled={!newGroupInput.trim()}
                      className="w-full py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all"
                    >
                      그룹 추가
                    </button>
                  </div>
                )}

                {/* 그룹 목록 */}
                <div className="space-y-1.5">
                  {groups.map(g => (
                    <div key={g.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-50">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: g.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700">{g.label}</p>
                        <p className="text-[10px] text-gray-400">{g.equipmentNos.length}개 설비</p>
                      </div>
                      <button onClick={() => removeGroup(g.id)} className="text-gray-300 hover:text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'date' && (
              <div className="space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  날짜를 선택하면 해당 시점의 설비 반출입 계획이 도면에 시각화됩니다.
                </p>

                {/* 연/월 슬라이더 */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span>연도</span>
                      <span className="font-bold text-gray-700">{selectedYear}</span>
                    </div>
                    <input
                      type="range"
                      min={2024}
                      max={2030}
                      value={selectedYear}
                      onChange={e => setSelectedYear(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                      <span>2024</span><span>2030</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span>월</span>
                      <span className="font-bold text-gray-700">{selectedMonth}월</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                      <span>1월</span><span>12월</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                  <p className="text-xs font-bold text-blue-700">{selectedYear}년 {selectedMonth}월</p>
                  <p className="text-[11px] text-blue-500 mt-1">기준 반출입 현황 표시 중</p>
                </div>

                {/* 범례 */}
                <div className="space-y-1.5 text-[11px]">
                  <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">색상 범례</p>
                  <LegendItem color="border-emerald-400 bg-transparent" label="반입 전 (초록 테두리)" />
                  <LegendItem color="bg-gray-200/80 border-transparent" label="반출 이후 (회색 반투명)" />
                  <LegendItem color="bg-sky-200 border-sky-400" label="정상 운영 (하늘색)" />
                </div>
              </div>
            )}

            {activePanel === 'optimize' && (
              <div className="space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  현재 레이아웃의 설비 배치를 분석하여 최적 배치 제안과 주의 구역을 도면에 표시합니다.
                </p>
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap size={15} />
                  {isOptimizing ? '분석 중...' : '최적화 실행'}
                </button>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5 text-[11px] text-gray-500">
                  <p className="font-semibold text-gray-600">분석 항목</p>
                  <p>· 설비 간 유지보수 통로 확보 여부</p>
                  <p>· OHT 레일 접근성</p>
                  <p>· 반입/반출 가능 영역 충돌</p>
                  <p>· 공간 활용률 개선 제안</p>
                </div>
              </div>
            )}

            {activePanel === null && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">위 기능을 선택하세요</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageLayout>
  )
}

const FunctionTab: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-all ${
      active
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <span className={active ? 'text-blue-500' : 'text-gray-400'}>{icon}</span>
    <span className="flex-1">{label}</span>
    <ChevronRight size={12} className={`transition-transform ${active ? 'rotate-90 text-blue-400' : 'text-gray-300'}`} />
  </button>
)

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 rounded border-2 shrink-0 ${color}`} />
    <span className="text-gray-600">{label}</span>
  </div>
)
