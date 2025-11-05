'use client'

import { FocusStats } from '@/types'

interface FocusOverviewCardsProps {
  stats: FocusStats
}

export default function FocusOverviewCards({ stats }: FocusOverviewCardsProps) {
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">概览</h3>
      <div className="grid grid-cols-4 gap-6">
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.todayPomodoros}</div>
          <div className="text-sm text-gray-600">今日番茄</div>
          <div className="text-xs text-gray-500 mt-1">比前一天多0个 ↑</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.totalPomodoros}</div>
          <div className="text-sm text-gray-600">总番茄</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{formatTime(stats.todayFocusTime)}</div>
          <div className="text-sm text-gray-600">今日专注时长</div>
          <div className="text-xs text-gray-500 mt-1">比前一天多0h0m ↑</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{formatTime(stats.totalFocusTime)}</div>
          <div className="text-sm text-gray-600">总专注时长</div>
        </div>
      </div>
    </div>
  )
}

