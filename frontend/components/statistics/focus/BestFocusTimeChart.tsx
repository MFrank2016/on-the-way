'use client'

import { FocusStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

interface BestFocusTimeChartProps {
  stats: FocusStats
}

export default function BestFocusTimeChart({ stats }: BestFocusTimeChartProps) {
  const chartData = useMemo(() => {
    if (!stats.bestFocusTime || stats.bestFocusTime.length === 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
      }))
    }
    const dataMap = new Map(stats.bestFocusTime.map(item => [item.hour, item.count]))
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: dataMap.get(i) || 0,
    }))
  }, [stats.bestFocusTime])

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">最佳专注时间</h3>
        <div className="text-sm text-gray-600">11月</div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(hour) => `${hour}:00`}
            interval={2}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelFormatter={(hour) => `${hour}:00 - ${Number(hour) + 1}:00`} 
          />
          <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

