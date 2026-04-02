import React, { useState } from 'react'
import { X, Plus, Trash2, ChevronRight, Database, Layers, Link2 } from 'lucide-react'
import type { CustomTable, CustomColumnDef, TableType, CustomColumnType } from '../../types'
import { MOCK_API_SOURCES } from '../../services/dataTableService'
import { useAuthStore } from '../../stores/authStore'

interface Props {
  existingTables: CustomTable[]
  onClose: () => void
  onCreate: (table: CustomTable) => void
}

const TABLE_TYPES: { type: TableType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'ORIGIN',
    label: 'Origin 테이블',
    desc: '컬럼과 데이터를 직접 정의하고 입력합니다. 3가지 컬럼 유형 지원.',
    icon: <Layers size={20} className="text-emerald-400" />,
  },
  {
    type: 'API_CONNECTED',
    label: '사내 데이터 연결',
    desc: '사내 DB 테이블을 불러와 조회합니다. SQL로 컬럼 및 조건을 지정합니다.',
    icon: <Database size={20} className="text-blue-400" />,
  },
  {
    type: 'COMBINED',
    label: '기존 테이블 조합',
    desc: '업무 시스템 내 테이블을 조합하여 새 Read-only 뷰를 만듭니다.',
    icon: <Link2 size={20} className="text-purple-400" />,
  },
]

const COL_TYPE_OPTIONS: { type: CustomColumnType; label: string; desc: string }[] = [
  { type: 'USER_INPUT', label: '사용자 기입', desc: '사용자가 직접 값을 입력/편집' },
  { type: 'JOIN',       label: 'JOIN 컬럼',   desc: '다른 테이블과 JOIN하여 값을 가져옴' },
  { type: 'CALCULATED', label: '계산된 컬럼',  desc: 'Spotfire 방식의 수식 기반 자동 계산' },
]

export const CreateTableModal: React.FC<Props> = ({ existingTables, onClose, onCreate }) => {
  const { currentUser } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [tableType, setTableType] = useState<TableType>('ORIGIN')
  const [tableName, setTableName] = useState('')

  // ORIGIN 설정
  const [columns, setColumns] = useState<Omit<CustomColumnDef, 'id'>[]>([
    { field: 'col_1', headerName: '항목1', colType: 'USER_INPUT' },
  ])

  // API_CONNECTED 설정
  const [apiSource, setApiSource] = useState<string>(MOCK_API_SOURCES[0].id)
  const [apiFields, setApiFields] = useState<string[]>(MOCK_API_SOURCES[0].fields.slice(0, 5).map(f => f.field))
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM equipment')

  // COMBINED 설정
  const [baseTableId, setBaseTableId] = useState<string>('')
  const [combineFields, setCombineFields] = useState<string[]>([])

  const originTables = existingTables.filter(t => t.tableType === 'ORIGIN' && !t.isSystem)

  // ── ORIGIN 컬럼 편집 ──────────────────────────

  const addColumn = () => {
    setColumns(prev => [...prev, {
      field: `col_${Date.now()}`,
      headerName: `항목${prev.length + 1}`,
      colType: 'USER_INPUT',
    }])
  }

  const updateColumn = (idx: number, updates: Partial<Omit<CustomColumnDef, 'id'>>) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c))
  }

  const removeColumn = (idx: number) => {
    setColumns(prev => prev.filter((_, i) => i !== idx))
  }

  // ── API 소스 변경 ──────────────────────────────
  const handleApiSourceChange = (id: string) => {
    setApiSource(id)
    const src = MOCK_API_SOURCES.find(s => s.id === id)
    if (src) {
      setApiFields(src.fields.slice(0, 5).map(f => f.field))
      setSqlQuery(`SELECT * FROM ${id}`)
    }
  }

  const toggleApiField = (field: string) => {
    setApiFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    )
  }

  // ── COMBINED 베이스 테이블 변경 ────────────────
  const handleBaseTableChange = (id: string) => {
    setBaseTableId(id)
    setCombineFields([])
  }

  const baseTable = existingTables.find(t => t.id === baseTableId)

  const toggleCombineField = (field: string) => {
    setCombineFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    )
  }

  // ── 테이블 생성 ───────────────────────────────
  const handleCreate = () => {
    if (!tableName.trim()) return

    const now = new Date().toISOString()
    const id = `tbl_${Date.now()}`
    const userId = currentUser?.id ?? 'unknown'
    const userName = currentUser?.name ?? '사용자'

    let table: CustomTable

    if (tableType === 'ORIGIN') {
      const cols: CustomColumnDef[] = columns.map((c, i) => ({
        ...c,
        id: `${id}_col_${i}`,
        width: 140,
      }))
      table = {
        id,
        name: tableName.trim(),
        tableType: 'ORIGIN',
        columns: cols,
        rows: [],
        changeHistory: [],
        createdAt: now,
        updatedAt: now,
        createdById: userId,
        createdByName: userName,
      }
    } else if (tableType === 'API_CONNECTED') {
      const src = MOCK_API_SOURCES.find(s => s.id === apiSource)
      table = {
        id,
        name: tableName.trim(),
        tableType: 'API_CONNECTED',
        columns: [],
        rows: [],
        changeHistory: [],
        apiSource,
        apiSelectedFields: apiFields,
        sqlQuery,
        createdAt: now,
        updatedAt: now,
        createdById: userId,
        createdByName: userName,
      }
    } else {
      // COMBINED
      table = {
        id,
        name: tableName.trim(),
        tableType: 'COMBINED',
        columns: [],
        rows: [],
        changeHistory: [],
        baseTableId,
        combineColumns: combineFields.map(field => ({
          tableId: baseTableId,
          field,
          headerName: baseTable?.columns.find(c => c.field === field)?.headerName ?? field,
        })),
        createdAt: now,
        updatedAt: now,
        createdById: userId,
        createdByName: userName,
      }
    }

    onCreate(table)
  }

  const canProceed = tableName.trim().length > 0
  const canCreate = (() => {
    if (!canProceed) return false
    if (tableType === 'ORIGIN') return columns.length > 0
    if (tableType === 'API_CONNECTED') return apiFields.length > 0
    if (tableType === 'COMBINED') return !!baseTableId && combineFields.length > 0
    return false
  })()

  const apiSourceInfo = MOCK_API_SOURCES.find(s => s.id === apiSource)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: '#1E293B', width: 560, maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-white">새 테이블 생성</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Step {step} / 2 — {step === 1 ? '테이블 유형 및 이름' : '상세 설정'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 ? (
            /* ── Step 1: 유형 선택 + 이름 ── */
            <div className="space-y-4">
              <div className="space-y-2">
                {TABLE_TYPES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setTableType(t.type)}
                    className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all ${
                      tableType === t.type
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{t.icon}</div>
                    <div>
                      <p className={`text-sm font-semibold ${tableType === t.type ? 'text-white' : 'text-white/70'}`}>
                        {t.label}
                      </p>
                      <p className="text-[12px] text-white/40 mt-0.5 leading-relaxed">{t.desc}</p>
                    </div>
                    {tableType === t.type && (
                      <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] text-white/40 uppercase tracking-widest font-semibold block mb-2">
                  테이블 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 반입 계획표, 설비 스펙 DB"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && canProceed) setStep(2) }}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            </div>
          ) : (
            /* ── Step 2: 상세 설정 ── */
            <div>
              {tableType === 'ORIGIN' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">컬럼 정의</p>

                  {columns.map((col, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="컬럼 이름"
                          value={col.headerName}
                          onChange={e => updateColumn(idx, { headerName: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-lg text-[13px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/25 focus:outline-none focus:border-brand-500/40 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="field_key"
                          value={col.field}
                          onChange={e => updateColumn(idx, { field: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
                          className="w-32 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white/70 placeholder-white/20 focus:outline-none focus:border-brand-500/40 transition-colors font-mono"
                        />
                        <button
                          onClick={() => removeColumn(idx)}
                          disabled={columns.length <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* 컬럼 유형 선택 */}
                      <div className="flex gap-1.5">
                        {COL_TYPE_OPTIONS.map(opt => (
                          <button
                            key={opt.type}
                            onClick={() => updateColumn(idx, { colType: opt.type })}
                            title={opt.desc}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                              col.colType === opt.type
                                ? 'bg-brand-500/25 text-brand-300 border border-brand-500/40'
                                : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* JOIN 설정 */}
                      {col.colType === 'JOIN' && (
                        <div className="space-y-1.5 pt-1">
                          <select
                            value={col.joinTableId ?? ''}
                            onChange={e => updateColumn(idx, { joinTableId: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white focus:outline-none appearance-none"
                          >
                            <option value="">소스 테이블 선택...</option>
                            {existingTables.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="JOIN 키 필드 (현재 테이블)"
                              value={col.joinOnField ?? ''}
                              onChange={e => updateColumn(idx, { joinOnField: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                            />
                            <input
                              type="text"
                              placeholder="가져올 값 필드"
                              value={col.joinValueField ?? ''}
                              onChange={e => updateColumn(idx, { joinValueField: e.target.value })}
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* CALCULATED 설정 */}
                      {col.colType === 'CALCULATED' && (
                        <input
                          type="text"
                          placeholder="수식 (예: {width_mm} * {depth_mm})"
                          value={col.formula ?? ''}
                          onChange={e => updateColumn(idx, { formula: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none font-mono"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addColumn}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-white/[0.04] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80 transition-all w-full justify-center"
                  >
                    <Plus size={14} />
                    컬럼 추가
                  </button>
                </div>
              )}

              {tableType === 'API_CONNECTED' && (
                <div className="space-y-4">
                  {/* [사내망 이관 시 교체] 실제 사내 DB 테이블 목록으로 교체 필요 */}
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                      데이터 소스
                    </label>
                    <div className="space-y-1.5">
                      {MOCK_API_SOURCES.map(src => (
                        <button
                          key={src.id}
                          onClick={() => handleApiSourceChange(src.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                            apiSource === src.id
                              ? 'border-brand-500 bg-brand-500/10 text-white'
                              : 'border-white/[0.06] hover:border-white/15 text-white/60'
                          }`}
                        >
                          <Database size={14} className={apiSource === src.id ? 'text-brand-400' : 'text-white/30'} />
                          <span className="text-[13px]">{src.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {apiSourceInfo && (
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                        표시할 컬럼 선택
                      </label>
                      <div className="space-y-1">
                        {apiSourceInfo.fields.map(f => (
                          <label key={f.field} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={apiFields.includes(f.field)}
                              onChange={() => toggleApiField(f.field)}
                              className="w-3.5 h-3.5 accent-brand-500"
                            />
                            <span className="text-[13px] text-white/70 flex-1">{f.headerName}</span>
                            <span className="text-[11px] text-white/25 font-mono">{f.field}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                      SQL 쿼리 (선택사항)
                    </label>
                    <textarea
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-[12px] bg-white/[0.05] border border-white/[0.06] text-white/80 focus:outline-none focus:border-brand-500/40 transition-colors font-mono resize-none"
                    />
                    {/* [사내망 이관 시 교체] 실제 사내 Datalake(bigdataquery) SQL로 교체 필요 */}
                    <p className="text-[11px] text-white/25 mt-1.5">현재 Mock 환경에서는 참고용으로만 표시됩니다.</p>
                  </div>
                </div>
              )}

              {tableType === 'COMBINED' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                      베이스 테이블
                    </label>
                    <div className="space-y-1.5">
                      {existingTables.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleBaseTableChange(t.id)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                            baseTableId === t.id
                              ? 'border-brand-500 bg-brand-500/10 text-white'
                              : 'border-white/[0.06] hover:border-white/15 text-white/60'
                          }`}
                        >
                          <Layers size={13} className={baseTableId === t.id ? 'text-brand-400' : 'text-white/30'} />
                          <span className="text-[13px]">{t.name}</span>
                          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${
                            t.tableType === 'ORIGIN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                          }`}>
                            {t.tableType === 'ORIGIN' ? '직접 생성' : '사내 데이터'}
                          </span>
                        </button>
                      ))}
                      {existingTables.length === 0 && (
                        <p className="text-[13px] text-white/30 text-center py-4">
                          먼저 다른 테이블을 생성해주세요
                        </p>
                      )}
                    </div>
                  </div>

                  {baseTable && (
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                        표시할 컬럼
                      </label>
                      <div className="space-y-1">
                        {baseTable.columns.map(col => (
                          <label key={col.field} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={combineFields.includes(col.field)}
                              onChange={() => toggleCombineField(col.field)}
                              className="w-3.5 h-3.5 accent-brand-500"
                            />
                            <span className="text-[13px] text-white/70">{col.headerName}</span>
                            <span className="ml-auto text-[10px] text-white/25 font-mono">{col.field}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.08]">
          <button
            onClick={() => step === 2 ? setStep(1) : onClose()}
            className="px-4 py-2 rounded-lg text-[13px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {step === 2 ? '← 이전' : '취소'}
          </button>
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              다음
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-sm"
            >
              테이블 생성
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
