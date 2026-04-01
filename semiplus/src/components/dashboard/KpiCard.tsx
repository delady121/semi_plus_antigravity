import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  accentColor?: string
  trend?: { value: string; positive: boolean }
  alert?: boolean
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subtitle, icon, iconBg = 'bg-blue-100', accentColor = 'bg-blue-500', trend, alert
}) => {
  return (
    <div className={`
      relative bg-white rounded-xl overflow-hidden
      transition-all duration-200 cursor-default
      hover:shadow-card-md hover:-translate-y-0.5
      ${alert
        ? 'shadow-card ring-1 ring-orange-300/60'
        : 'shadow-card'
      }
    `}>
      {/* 상단 액센트 라인 */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${alert ? 'bg-orange-400' : accentColor}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-extrabold mt-1.5 tracking-tight ${alert ? 'text-orange-600' : 'text-slate-900'}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-[12px] mt-1 ${alert ? 'text-orange-500 font-medium' : 'text-slate-400'}`}>{subtitle}</p>
            )}
            {trend && (
              <p className={`text-[12px] mt-1.5 font-semibold flex items-center gap-1 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                <span>{trend.positive ? '↑' : '↓'}</span>
                {trend.value}
              </p>
            )}
          </div>
          <div className={`
            p-2.5 rounded-xl shrink-0
            ${alert ? 'bg-orange-100' : iconBg}
          `}>
            {icon}
          </div>
        </div>
      </div>

      {/* alert 하단 인디케이터 */}
      {alert && (
        <div className="px-5 py-2 bg-orange-50 border-t border-orange-100">
          <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            즉시 확인 필요
          </span>
        </div>
      )}
    </div>
  )
}

