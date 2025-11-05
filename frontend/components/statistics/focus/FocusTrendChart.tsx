'use client'

import { FocusStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

interface FocusTrendChartProps {
  stats: FocusStats
}

export default function FocusTrendChart({ stats }: FocusTrendChartProps) {
  const chartData = useMemo(() => {
    if (!stats.focusTrends || stats.focusTrends.length === 0) {
      const today = new Date()
      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - dayOfWeek + 1)
      
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        return {
          day: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
          time: 0,
        }
      })
    }
    return stats.focusTrends.map(stat => ({
      day: new Date(stat.date).toLocaleDateString('zh-CN', { weekday: 'short' }),
      time: Math.round(stat.focusTime / 60),
    }))
  }, [stats.focusTrends])

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">专注趋势</h3>
        <div className="text-sm text-gray-600">本周</div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="day" 
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
          <Bar dataKey="time" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-sm text-gray-500 mt-4">每日平均: 0m</div>
    </div>
  )
}

