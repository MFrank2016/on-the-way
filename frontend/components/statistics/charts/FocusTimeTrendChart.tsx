'use client'

import { DailyStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo, useState, useEffect } from 'react'
import TimeRangeSelector from '../TimeRangeSelector'
import { statisticsAPI } from '@/lib/api'

export default function FocusTimeTrendChart() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [trendsData, setTrendsData] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await statisticsAPI.getTrends({ 
          range: timeRange,
          chart: 'focus_time' 
        })
        setTrendsData(response.data.data)
      } catch (error) {
        console.error('Failed to load focus time trend:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [timeRange])

  const chartData = useMemo(() => {
    if (trendsData.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        date: `${i + 1}`,
        time: 0,
      }))
    }
    return trendsData.map((stat) => {
      const date = new Date(stat.date)
      const dateStr = timeRange === 'month' 
        ? `${date.getMonth() + 1}月`
        : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
      
      return {
        date: dateStr,
        time: Math.round(stat.focusTime / 60),
      }
    })
  }, [trendsData, timeRange])

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
        <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">最近专注时长趋势</h3>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      {loading && (
        <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
          加载中...
        </div>
      )}
      {!loading && <ResponsiveContainer width="100%" height={200}>
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
      </ResponsiveContainer>}
    </div>
  )
}
