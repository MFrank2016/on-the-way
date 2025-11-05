'use client'

import { DailyStats } from '@/types'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useMemo } from 'react'

interface AchievementScoreChartProps {
  achievementScore: number
  trendsData: DailyStats[]
}

export default function AchievementScoreChart({ achievementScore, trendsData }: AchievementScoreChartProps) {
  const chartData = useMemo(() => {
    if (trendsData.length === 0) {
      const today = new Date()
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          score: 0,
        }
      })
    }
    
    return trendsData.map((stat) => {
      const score = stat.completedTasks * 10 + 
                   Math.floor(stat.focusTime / 3600) * 50 + 
                   stat.pomodoroCount * 5
      
      return {
        date: new Date(stat.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        score: score,
      }
    })
  }, [trendsData])

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
        <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">我的成就值</h3>
        <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
          <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-blue-600">{achievementScore}</span>
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAchievement" x1="0" y1="0" x2="0" y2="1">
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
            formatter={(value: number) => [`${value}分`, '成就值']}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#6366f1" 
            strokeWidth={3}
            fill="url(#colorAchievement)" 
            dot={{ fill: '#6366f1', r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

