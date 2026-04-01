import React from 'react'
import ReactECharts from 'echarts-for-react'
import type { Equipment } from '../../types'
import { BarChart3 } from 'lucide-react'

interface Props {
  equipment: Equipment[]
}

const statusLabel: Record<string, string> = {
  OPERATING: '운영중',
  PLANNED_IN: '반입예정',
  PLANNED_OUT: '반출예정',
  REMOVED: '반출완료',
}

const statusColors: Record<string, [string, string]> = {
  OPERATING:   ['#6366F1', '#818CF8'],
  PLANNED_IN:  ['#10B981', '#34D399'],
  PLANNED_OUT: ['#F59E0B', '#FCD34D'],
  REMOVED:     ['#94A3B8', '#CBD5E1'],
}

export const EquipmentStatusChart: React.FC<Props> = ({ equipment }) => {
  const counts: Record<string, number> = {
    OPERATING: 0, PLANNED_IN: 0, PLANNED_OUT: 0, REMOVED: 0
  }
  equipment.forEach(e => counts[e.status]++)

  const statuses = Object.keys(counts)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1E293B',
      borderColor: '#334155',
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Pretendard Variable' },
    },
    grid: { left: 16, right: 16, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: statuses.map(s => statusLabel[s]),
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748B', fontSize: 11, fontFamily: 'Pretendard Variable' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: statuses.map(s => ({
          value: counts[s],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: statusColors[s][0] },
                { offset: 1, color: statusColors[s][1] },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
        })),
        barWidth: '48%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}',
          fontSize: 12,
          fontWeight: 700,
          color: '#475569',
        },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(99,102,241,0.3)' }
        }
      }
    ]
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-brand-50 flex items-center justify-center">
          <BarChart3 size={13} className="text-brand-600" />
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-slate-700">설비 상태별 현황</h3>
          <p className="text-[11px] text-slate-400">전체 {equipment.length}대</p>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 204 }} />
    </div>
  )
}
