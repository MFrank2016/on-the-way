'use client'

import { FocusStats, HeatmapData } from '@/types'
import FocusOverviewCards from './focus/FocusOverviewCards'
import FocusDetailsChart from './focus/FocusDetailsChart'
import FocusRecordsList from './focus/FocusRecordsList'
import FocusTrendChart from './focus/FocusTrendChart'
import BestFocusTimeChart from './focus/BestFocusTimeChart'
import Heatmap from './Heatmap'

interface FocusTabProps {
  stats: FocusStats
  heatmapData: HeatmapData[]
  heatmapYear: number
  onHeatmapYearChange: (year: number) => void
}

export default function FocusTab({
  stats,
  heatmapData,
  heatmapYear,
  onHeatmapYearChange,
}: FocusTabProps) {
  return (
    <div className="space-y-6">
      {/* 概览 */}
      <FocusOverviewCards stats={stats} />

      {/* 专注详情和专注记录 */}
      <div className="grid grid-cols-2 gap-6">
        <FocusDetailsChart stats={stats} />
        <FocusRecordsList stats={stats} />
      </div>

      {/* 专注趋势 */}
      <FocusTrendChart />

      {/* 最佳专注时间 */}
      <BestFocusTimeChart stats={stats} />

      {/* 年度热力图 */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">年度热力图</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onHeatmapYearChange(heatmapYear - 1)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <span className="text-sm font-medium text-gray-700">{heatmapYear}</span>
            <button
              onClick={() => onHeatmapYearChange(heatmapYear + 1)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>
        <Heatmap data={heatmapData} year={heatmapYear} />
      </div>
    </div>
  )
}

