'use client'

import { useMemo, useState } from 'react'
import { HeatmapData } from '@/types'

interface HeatmapProps {
  data: HeatmapData[]
  year: number
}

export default function Heatmap({ data, year }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null)

  // 生成一年的所有日期
  const yearData = useMemo(() => {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const days: HeatmapData[] = []

    const dataMap = new Map(data.map((d) => [d.date, d]))

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const existingData = dataMap.get(dateStr)
      days.push(
        existingData || {
          date: dateStr,
          count: 0,
          level: 0,
        }
      )
    }

    return days
  }, [data, year])

  // 按周组织数据
  const weeks = useMemo(() => {
    const result: HeatmapData[][] = []
    let week: HeatmapData[] = []

    // 补齐第一周
    const firstDay = new Date(year, 0, 1).getDay()
    for (let i = 0; i < firstDay; i++) {
      week.push({ date: '', count: 0, level: 0 })
    }

    yearData.forEach((day) => {
      week.push(day)
      if (week.length === 7) {
        result.push(week)
        week = []
      }
    })

    // 补齐最后一周
    if (week.length > 0) {
      while (week.length < 7) {
        week.push({ date: '', count: 0, level: 0 })
      }
      result.push(week)
    }

    return result
  }, [yearData, year])

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-gray-100',
      'bg-blue-200',
      'bg-blue-400',
      'bg-blue-600',
      'bg-blue-800',
    ]
    return colors[level] || colors[0]
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className="relative">
      {/* 月份标签 */}
      <div className="flex gap-1 mb-2 pl-8">
        {months.map((month, index) => (
          <div
            key={month}
            className="text-xs text-gray-500 flex-1 text-center"
            style={{ minWidth: '40px' }}
          >
            {index % 2 === 0 ? month : ''}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* 星期标签 */}
        <div className="flex flex-col gap-1 mr-2 text-xs text-gray-500">
          <div style={{ height: '12px' }}>一</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>三</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>五</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>日</div>
        </div>

        {/* 热力图网格 */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${
                    day.date ? getLevelColor(day.level) : 'bg-transparent'
                  } ${day.date ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''} transition-all`}
                  onMouseEnter={() => day.date && setHoveredCell(day)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={day.date ? `${day.date}: ${formatTime(day.count)}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
            />
          ))}
        </div>
        <span>多</span>
      </div>

      {/* 悬浮提示 */}
      {hoveredCell && hoveredCell.date && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10">
          <div className="font-medium">{hoveredCell.date}</div>
          <div className="text-gray-300 mt-1">专注时长: {formatTime(hoveredCell.count)}</div>
        </div>
      )}
    </div>
  )
}

