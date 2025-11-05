'use client'

import { DailyStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo, useState, useEffect } from 'react'
import TimeRangeSelector from '../TimeRangeSelector'
import { statisticsAPI } from '@/lib/api'

export default function FocusTrendChart() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [trendsData, setTrendsData] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await statisticsAPI.getFocusTrends({ range: timeRange })
        setTrendsData(response.data.data)
      } catch (error) {
        console.error('Failed to load focus trends:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [timeRange])

  const chartData = useMemo(() => {
    if (trendsData.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        day: `${i + 1}`,
        time: 0,
      }))
    }
    return trendsData.map(stat => {
      const date = new Date(stat.date)
      const dateStr = timeRange === 'month' 
        ? `${date.getMonth() + 1}月`
        : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
      
      return {
        day: dateStr,
        time: Math.round(stat.focusTime / 60),
      }
    })
  }, [trendsData, timeRange])

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">专注趋势</h3>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      {loading && (
        <div className="h-[200px] flex items-center justify-center text-gray-500">
          加载中...
        </div>
      )}
      {!loading && <ResponsiveContainer width="100%" height={200}>
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
      </ResponsiveContainer>}
      {!loading && (
        <div className="text-sm text-gray-500 mt-4">
          {chartData.length > 0 && `平均: ${Math.round(chartData.reduce((sum, item) => sum + item.time, 0) / chartData.length)}分钟`}
        </div>
      )}
    </div>
  )
}
