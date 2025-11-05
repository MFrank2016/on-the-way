'use client'

import { useEffect, useState } from 'react'
import PomodoroTimer from '@/components/PomodoroTimer'
import { pomodoroAPI } from '@/lib/api'
import { Pomodoro } from '@/types'
import { formatTime } from '@/lib/utils'
import { Clock } from 'lucide-react'

export default function PomodoroPage() {
  const [todayStats, setTodayStats] = useState({ count: 0, totalDuration: 0 })
  const [recentPomodoros, setRecentPomodoros] = useState<Pomodoro[]>([])

  useEffect(() => {
    loadStats()
    loadRecentPomodoros()
    
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const loadStats = async () => {
    try {
      const response = await pomodoroAPI.getTodayStats()
      setTodayStats(response.data.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadRecentPomodoros = async () => {
    try {
      const today = new Date()
      const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const response = await pomodoroAPI.getPomodoros({ 
        startDate,
      })
      setRecentPomodoros(response.data.data.slice(0, 10))
    } catch (error) {
      console.error('Failed to load pomodoros:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">番茄专注</h1>
          <p className="text-gray-600">保持专注，提高效率</p>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：计时器 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <PomodoroTimer />
            </div>
          </div>

          {/* 右侧：统计和记录 */}
          <div className="space-y-6">
            {/* 今日统计 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">今日统计</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">完成番茄</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {todayStats.count}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">专注时长</span>
                  <span className="text-2xl font-bold text-green-600">
                    {Math.floor(todayStats.totalDuration / 60)}m
                  </span>
                </div>
              </div>
            </div>

            {/* 专注记录 */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">今日记录</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentPomodoros.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>还没有专注记录</p>
                  </div>
                ) : (
                  recentPomodoros.map((pomodoro) => (
                    <div
                      key={pomodoro.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {pomodoro.task?.title || '自由专注'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(pomodoro.startTime).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {Math.floor(pomodoro.duration / 60)}分钟
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 提示卡片 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-4xl mb-3">🍅</div>
            <h4 className="font-semibold text-gray-900 mb-2">什么是番茄工作法？</h4>
            <p className="text-sm text-gray-600">
              将工作分解为25分钟的专注时段，每个时段后休息5分钟
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-4xl mb-3">💪</div>
            <h4 className="font-semibold text-gray-900 mb-2">提高专注力</h4>
            <p className="text-sm text-gray-600">
              通过定时专注，减少干扰，提高工作效率和质量
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-4xl mb-3">📈</div>
            <h4 className="font-semibold text-gray-900 mb-2">追踪进度</h4>
            <p className="text-sm text-gray-600">
              记录每个番茄时钟，查看统计数据，了解你的专注习惯
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

