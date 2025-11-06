'use client'

import { DailyStats } from '@/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo, useState, useEffect } from 'react'
import TimeRangeSelector from '../TimeRangeSelector'
import { statisticsAPI } from '@/lib/api'
import { parseDateString } from '@/lib/dateUtils'

interface CompletedTasksTrendChartProps {}

export default function CompletedTasksTrendChart({}: CompletedTasksTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [trendsData, setTrendsData] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const response = await statisticsAPI.getTrends({ 
          range: timeRange,
          chart: 'completed' 
        })
        setTrendsData(response.data.data)
      } catch (error) {
        console.error('Failed to load completed tasks trend:', error)
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
        count: 0,
      }))
    }
    return trendsData.map((stat) => {
      // 使用工具函数解析后端返回的日期格式（YYYYMMDD）
      const date = parseDateString(stat.date)
      // 根据时间范围选择不同的日期格式
      const dateStr = timeRange === 'month' 
        ? `${date.getMonth() + 1}月`
        : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
      
      return {
        date: dateStr,
        count: stat.completedTasks,
      }
    })
  }, [trendsData, timeRange])

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
        <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">最近已完成趋势</h3>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      {loading && (
        <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
          加载中...
        </div>
      )}
      {!loading && <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`${value}`, '完成数']}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#6366f1" 
            strokeWidth={3}
            fill="url(#colorCompleted)" 
            dot={{ fill: '#6366f1', r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>}
    </div>
  )
}

