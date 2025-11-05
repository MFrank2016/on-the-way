'use client'

import { FocusStats } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface FocusDetailsChartProps {
  stats: FocusStats
}

export default function FocusDetailsChart({ stats }: FocusDetailsChartProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">专注详情</h3>
        <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">按清单</option>
        </select>
      </div>
      {stats.focusDetails && stats.focusDetails.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={stats.focusDetails}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="duration"
              nameKey="listName"
            >
              {stats.focusDetails.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatTime(value)} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 text-sm">示例数据</div>
            <div className="text-gray-400 text-xs mt-1">仅供参考</div>
          </div>
        </div>
      )}
    </div>
  )
}

