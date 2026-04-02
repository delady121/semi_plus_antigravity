import React, { useState, useRef } from 'react'
import {
  CheckCircle2, Circle, ImageUp, Ruler, Grid3x3, SquareDashed,
  Route, Cpu, Building2, Plus, Trash2, ChevronRight, Info,
} from 'lucide-react'
import type { LayoutItem, ScaleMeasurement } from '../../stores/layoutStore'

interface Props {
  layout: LayoutItem
  onUpdate: (updates: Partial<LayoutItem>) => void
  onComplete: () => void
}

const STEPS = [
  { num: 3,  icon: <ImageUp size={14} />,       label: '배경 이미지 업로드' },
  { num: 4,  icon: <Ruler size={14} />,          label: '축척 설정' },
  { num: 5,  icon: <Grid3x3 size={14} />,        label: '격자 생성' },
  { num: 6,  icon: <SquareDashed size={14} />,   label: '설비 배치 영역 지정' },
  { num: 7,  icon: <Route size={14} />,          label: 'OHT 레일 그리기' },
  { num: 8,  icon: <Cpu size={14} />,            label: '설비 레이어 설정' },
  { num: 9,  icon: <Building2 size={14} />,      label: '시설물 레이어 설정' },
  { num: 10, icon: <Plus size={14} />,           label: '사용자 정의 레이어' },
  { num: 11, icon: <CheckCircle2 size={14} />,   label: '저장 및 완료' },
]

export const SetupWizard: React.FC<Props> = ({ layout, onUpdate, onComplete }) => {
  const currentStep = layout.setupStep

  const goToStep = (step: number) => onUpdate({ setupStep: step })
  const nextStep = () => {
    if (currentStep < 11) goToStep(currentStep + 1)
    else onComplete()
  }
  const prevStep = () => {
    if (currentStep > 3) goToStep(currentStep - 1)
  }

  return (
    <aside
      className="w-72 shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-hidden"
    >
      {/* 헤더 */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-slate-50">
        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">초기 편집 설정</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{layout.name}</p>
      </div>

      {/* 단계 목록 (간략) */}
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="space-y-0.5">
          {STEPS.map(step => {
            const isDone = step.num < currentStep
            const isCurrent = step.num === currentStep
            return (
              <button
                key={step.num}
                onClick={() => goToStep(step.num)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all text-[12px] ${
                  isCurrent
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : isDone
                      ? 'text-emerald-600'
                      : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <span className="shrink-0">
                  {isDone
                    ? <CheckCircle2 size={14} className="text-emerald-500" />
                    : isCurrent
                      ? <Circle size={14} className="text-blue-500 fill-blue-100" />
                      : <Circle size={14} className="text-gray-300" />
                  }
                </span>
                <span className="flex-1 truncate">
                  Step {step.num - 2}. {step.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 현재 단계 상세 */}
      <div className="flex-1 overflow-y-auto p-4">
        <StepContent
          layout={layout}
          currentStep={currentStep}
          onUpdate={onUpdate}
        />
      </div>

      {/* 네비게이션 */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <button
          onClick={prevStep}
          disabled={currentStep <= 3}
          className="px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          이전
        </button>
        <button
          onClick={nextStep}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
        >
          {currentStep === 11 ? '완료 및 저장' : '다음 단계'}
          {currentStep < 11 && <ChevronRight size={14} />}
        </button>
      </div>
    </aside>
  )
}

// ── 단계별 콘텐츠 ────────────────────────────────────────────

interface StepContentProps {
  layout: LayoutItem
  currentStep: number
  onUpdate: (updates: Partial<LayoutItem>) => void
}

const StepContent: React.FC<StepContentProps> = ({ layout, currentStep, onUpdate }) => {
  switch (currentStep) {
    case 3:  return <Step3 layout={layout} onUpdate={onUpdate} />
    case 4:  return <Step4 layout={layout} onUpdate={onUpdate} />
    case 5:  return <Step5 layout={layout} onUpdate={onUpdate} />
    case 6:  return <Step6 />
    case 7:  return <Step7 />
    case 8:  return <Step8 layout={layout} onUpdate={onUpdate} />
    case 9:  return <Step9 layout={layout} onUpdate={onUpdate} />
    case 10: return <Step10 layout={layout} onUpdate={onUpdate} />
    case 11: return <Step11 layout={layout} />
    default: return null
  }
}

// ── Step 3: 배경 이미지 ──────────────────────────────────────

const Step3: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      onUpdate({
        backgroundImageData: ev.target?.result as string,
        backgroundImageName: file.name,
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <StepHeader
        title="배경 이미지 업로드"
        desc="도면 PNG 또는 SVG 파일을 업로드하세요. 업로드된 이미지가 캔버스 배경이 됩니다."
      />
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
        onClick={() => inputRef.current?.click()}
      >
        <ImageUp size={28} className="mx-auto text-gray-300 mb-2" />
        <p className="text-[13px] font-medium text-gray-500">클릭하여 파일 선택</p>
        <p className="text-xs text-gray-400 mt-1">PNG, SVG 지원</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.svg,.jpg,.jpeg"
        className="hidden"
        onChange={handleFile}
      />
      {layout.backgroundImageData && (
        <div className="rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 p-2">
          <img
            src={layout.backgroundImageData}
            alt="preview"
            className="w-full h-28 object-contain"
          />
          <p className="text-[11px] text-emerald-600 font-medium mt-1.5 text-center">
            ✓ {layout.backgroundImageName}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Step 4: 축척 설정 ────────────────────────────────────────

const Step4: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => {
  const [px, setPx] = useState('')
  const [mm, setMm] = useState('')
  const measurements = layout.scaleMeasurements

  const addMeasurement = () => {
    const pxVal = parseFloat(px)
    const mmVal = parseFloat(mm)
    if (isNaN(pxVal) || isNaN(mmVal) || pxVal <= 0 || mmVal <= 0) return
    const next: ScaleMeasurement[] = [...measurements, { pixelDistance: pxVal, realDistanceMm: mmVal }]
    const scale = next.reduce((sum, m) => sum + (m.realDistanceMm / m.pixelDistance), 0) / next.length
    onUpdate({ scaleMeasurements: next, scaleMmPerPx: Math.round(scale * 1000) / 1000 })
    setPx('')
    setMm('')
  }

  const removeMeasurement = (idx: number) => {
    const next = measurements.filter((_, i) => i !== idx)
    const scale = next.length > 0
      ? next.reduce((sum, m) => sum + (m.realDistanceMm / m.pixelDistance), 0) / next.length
      : undefined
    onUpdate({ scaleMeasurements: next, scaleMmPerPx: scale })
  }

  return (
    <div className="space-y-3">
      <StepHeader
        title="축척 설정"
        desc="도면 위 두 지점의 픽셀 거리와 실제 거리를 입력합니다. 정확도를 위해 3회 반복하세요."
      />
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">픽셀 거리</label>
            <input
              type="number"
              placeholder="px"
              value={px}
              onChange={e => setPx(e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">실제 거리</label>
            <input
              type="number"
              placeholder="mm"
              value={mm}
              onChange={e => setMm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addMeasurement() }}
              className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <button
          onClick={addMeasurement}
          disabled={!px || !mm || measurements.length >= 3}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus size={13} />
          측정 추가 ({measurements.length}/3)
        </button>
      </div>

      {measurements.length > 0 && (
        <div className="space-y-1.5">
          {measurements.map((m, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 text-[12px] text-gray-600">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              <span className="flex-1">{m.pixelDistance}px = {m.realDistanceMm}mm</span>
              <span className="text-gray-400 font-mono text-[11px]">
                {(m.realDistanceMm / m.pixelDistance).toFixed(3)}mm/px
              </span>
              <button onClick={() => removeMeasurement(i)} className="text-gray-300 hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          {layout.scaleMmPerPx && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
              <p className="text-[11px] text-blue-500 font-semibold uppercase tracking-wide mb-1">평균 축척비</p>
              <p className="text-lg font-bold text-blue-700">{layout.scaleMmPerPx} mm/px</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Step 5: 격자 생성 ────────────────────────────────────────

const Step5: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => {
  const [size, setSize] = useState(layout.gridSizeMm)

  const handleGenerate = () => {
    onUpdate({ gridEnabled: true, gridSizeMm: size })
  }

  return (
    <div className="space-y-3">
      <StepHeader
        title="격자 자동 생성"
        desc="설정한 축척비를 기반으로 격자를 생성합니다. 기본 600mm 간격입니다."
      />
      <div>
        <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">격자 간격 (mm)</label>
        <input
          type="number"
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="w-full px-2.5 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
        />
      </div>
      <button
        onClick={handleGenerate}
        className="w-full py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
      >
        {layout.gridEnabled ? '✓ 격자 생성됨 (재생성)' : '격자 생성'}
      </button>
      {layout.gridEnabled && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 text-center">
          <p className="text-[12px] text-emerald-600 font-semibold">
            ✓ {layout.gridSizeMm}mm 간격 격자 생성 완료
          </p>
          {layout.scaleMmPerPx && (
            <p className="text-[11px] text-emerald-500 mt-0.5">
              캔버스 간격: {(layout.gridSizeMm / layout.scaleMmPerPx).toFixed(1)}px
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Step 6: 설비 배치 영역 ────────────────────────────────────

const Step6: React.FC = () => (
  <div className="space-y-3">
    <StepHeader
      title="설비 배치 영역 지정"
      desc="캔버스에서 드래그하여 설비를 배치할 수 있는 구역을 지정합니다."
    />
    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
      <div className="flex items-start gap-2">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-700">
          우측 캔버스에서 <strong>드래그</strong>하여 설비 배치 가능 구역을 그려주세요.
          여러 구역을 그릴 수 있습니다.
        </p>
      </div>
    </div>
    <div className="rounded-xl bg-slate-800 p-3 text-center">
      <SquareDashed size={28} className="mx-auto text-slate-400 mb-2" />
      <p className="text-[12px] text-slate-400">도구 모음에서 [배치영역] 선택 후<br />캔버스에서 드래그하세요</p>
    </div>
  </div>
)

// ── Step 7: OHT 레일 ─────────────────────────────────────────

const Step7: React.FC = () => (
  <div className="space-y-3">
    <StepHeader
      title="OHT 레일 그리기"
      desc="OHT(Overhead Transport) 레일 경로를 직접 그립니다. 45도 단위 스냅핑이 적용됩니다."
    />
    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
      <div className="flex items-start gap-2">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[12px] text-amber-700">
          도구 모음에서 <strong>[OHT 레일]</strong> 도구를 선택 후 캔버스에서 클릭하여 레일을 그려주세요.
          45° 스냅핑이 자동 적용됩니다.
        </p>
      </div>
    </div>
    <div className="rounded-xl bg-slate-800 p-3 text-center">
      <Route size={28} className="mx-auto text-slate-400 mb-2" />
      <p className="text-[12px] text-slate-400">도구 모음 → OHT 레일 → 캔버스 클릭</p>
    </div>
  </div>
)

// ── Step 8: 설비 레이어 ────────────────────────────────────────

const LayerConfigForm: React.FC<{
  config: LayoutItem['equipmentLayerConfig']
  onUpdate: (c: NonNullable<LayoutItem['equipmentLayerConfig']>) => void
  showEqpId?: boolean
}> = ({ config, onUpdate, showEqpId = true }) => {
  const c = config ?? { tableId: '', xmaxField: '', xminField: '', ymaxField: '', yminField: '', eqpIdField: '', extraFields: [] }
  const update = (key: string, val: string) => onUpdate({ ...c, [key]: val })

  const fields = [
    { key: 'tableId',   label: '테이블 선택', placeholder: '테이블 이름 또는 ID' },
    { key: 'xmaxField', label: 'Xmax 컬럼',  placeholder: 'x_max' },
    { key: 'xminField', label: 'Xmin 컬럼',  placeholder: 'x_min' },
    { key: 'ymaxField', label: 'Ymax 컬럼',  placeholder: 'y_max' },
    { key: 'yminField', label: 'Ymin 컬럼',  placeholder: 'y_min' },
    ...(showEqpId ? [{ key: 'eqpIdField', label: 'EQP_ID 컬럼', placeholder: 'equipment_no' }] : []),
  ]

  return (
    <div className="space-y-2">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-0.5">{f.label}</label>
          <input
            type="text"
            placeholder={f.placeholder}
            value={(c as Record<string, string>)[f.key] ?? ''}
            onChange={e => update(f.key, e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border border-gray-200 focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>
      ))}
    </div>
  )
}

const Step8: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => (
  <div className="space-y-3">
    <StepHeader title="설비 레이어 설정" desc="설비 좌표 데이터가 있는 테이블과 필수 컬럼 5가지를 지정합니다." />
    <LayerConfigForm
      config={layout.equipmentLayerConfig}
      onUpdate={c => onUpdate({ equipmentLayerConfig: c })}
      showEqpId
    />
    {/* [사내망 이관 시 교체] 사내 Datalake 테이블 목록으로 교체 필요 */}
  </div>
)

const Step9: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => (
  <div className="space-y-3">
    <StepHeader title="시설물 레이어 설정" desc="기둥, 계단실 등 시설물 좌표 테이블과 컬럼을 지정합니다." />
    <LayerConfigForm
      config={layout.facilityLayerConfig}
      onUpdate={c => onUpdate({ facilityLayerConfig: c })}
      showEqpId={false}
    />
    {/* [사내망 이관 시 교체] 사내 Datalake 테이블 목록으로 교체 필요 */}
  </div>
)

// ── Step 10: 사용자 정의 레이어 ──────────────────────────────

const Step10: React.FC<{ layout: LayoutItem; onUpdate: (u: Partial<LayoutItem>) => void }> = ({ layout, onUpdate }) => {
  const [newLayerName, setNewLayerName] = useState('')

  const addLayer = () => {
    if (!newLayerName.trim()) return
    const next = [...layout.customLayers, { id: `cl_${Date.now()}`, name: newLayerName.trim() }]
    onUpdate({ customLayers: next })
    setNewLayerName('')
  }

  const removeLayer = (id: string) => {
    onUpdate({ customLayers: layout.customLayers.filter(l => l.id !== id) })
  }

  return (
    <div className="space-y-3">
      <StepHeader
        title="사용자 정의 레이어"
        desc="필요한 레이어를 추가하세요. 이 단계는 선택사항입니다."
      />
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="레이어 이름"
          value={newLayerName}
          onChange={e => setNewLayerName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addLayer() }}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={addLayer}
          disabled={!newLayerName.trim()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-1.5">
        {layout.customLayers.map(l => (
          <div key={l.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 text-[12px]">
            <Layers size={12} className="text-gray-400 shrink-0" />
            <span className="flex-1 text-gray-700">{l.name}</span>
            <button onClick={() => removeLayer(l.id)} className="text-gray-300 hover:text-red-400">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {layout.customLayers.length === 0 && (
          <p className="text-center text-[12px] text-gray-400 py-3">추가된 레이어 없음 (선택사항)</p>
        )}
      </div>
    </div>
  )
}

// ── Step 11: 완료 ────────────────────────────────────────────

const Step11: React.FC<{ layout: LayoutItem }> = ({ layout }) => (
  <div className="space-y-3">
    <StepHeader
      title="설정 완료"
      desc="모든 설정이 완료되었습니다. 저장하면 레이아웃 일반 보기 화면으로 이동합니다."
    />
    <div className="space-y-1.5 text-[12px]">
      {[
        { label: '배경 이미지', done: !!layout.backgroundImageData },
        { label: '축척 설정',   done: !!layout.scaleMmPerPx },
        { label: '격자 생성',   done: layout.gridEnabled },
        { label: '설비 레이어', done: !!layout.equipmentLayerConfig?.tableId },
        { label: '시설물 레이어', done: !!layout.facilityLayerConfig?.tableId },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50">
          {item.done
            ? <CheckCircle2 size={13} className="text-emerald-500" />
            : <Circle size={13} className="text-gray-300" />
          }
          <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
          {!item.done && <span className="ml-auto text-[11px] text-amber-500">선택사항</span>}
        </div>
      ))}
    </div>
    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
      <p className="text-[12px] text-blue-600 font-medium">
        '다음 단계' 버튼을 누르면 저장 후<br />일반 보기 화면으로 이동합니다.
      </p>
    </div>
  </div>
)

// ── 공통 헤더 ────────────────────────────────────────────────

const StepHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="mb-1">
    <p className="text-[13px] font-bold text-gray-800">{title}</p>
    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{desc}</p>
  </div>
)
