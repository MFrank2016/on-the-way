'use client'

import { DailyStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

interface FocusTimeTrendChartProps {
  trendsData: DailyStats[]
}

export default function FocusTimeTrendChart({ trendsData }: FocusTimeTrendChartProps) {
  const chartData = useMemo(() => {
    if (trendsData.length === 0) {
      const today = new Date()
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          time: 0,
        }
      })
    }
    return trendsData.map((stat) => ({
      date: new Date(stat.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      time: Math.round(stat.focusTime / 60),
    }))
  }, [trendsData])

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
        <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">最近专注时长趋势</h3>
        <select className="px-2 md:px-3 py-1 md:py-1.5 border border-gray-200 rounded-lg text-[10px] sm:text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="day">日</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            label={{ value: '分钟', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`${value}分钟`, '专注时长']}
          />
          <Bar 
            dataKey="time" 
            fill="#6366f1"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

