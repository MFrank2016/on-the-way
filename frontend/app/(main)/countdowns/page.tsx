'use client'

import { useEffect, useState } from 'react'
import { countdownAPI } from '@/lib/api'
import { Countdown } from '@/types'
import { Plus, Calendar } from 'lucide-react'

export default function CountdownsPage() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCountdowns()
  }, [])

  const loadCountdowns = async () => {
    try {
      const response = await countdownAPI.getCountdowns()
      setCountdowns(response.data.data)
    } catch (error) {
      console.error('Failed to load countdowns:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysLeft = (targetDate: string) => {
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">倒数日</h1>
        <p className="text-gray-600">记录重要的日子</p>
      </div>

      {/* 添加按钮 */}
      <div className="mb-6">
        <button className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
          <Plus className="w-5 h-5" />
          <span>添加倒数日</span>
        </button>
      </div>

      {/* 倒数日网格 */}
      {countdowns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <div className="text-gray-400 text-lg mb-2">还没有倒数日</div>
          <div className="text-gray-500 text-sm">点击上方按钮添加重要日期</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countdowns.map((countdown) => {
            const daysLeft = calculateDaysLeft(countdown.targetDate)
            const isPast = daysLeft < 0

            return (
              <div
                key={countdown.id}
                className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition"
              >
                {/* 背景图片 */}
                {countdown.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${countdown.imageUrl})` }}
                  />
                )}

                <div className="relative p-6 text-white">
                  {/* 类型标签 */}
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-4">
                    {countdown.type === 'anniversary' ? '纪念日' : '倒数日'}
                  </div>

                  {/* 标题 */}
                  <h3 className="text-xl font-bold mb-2">{countdown.title}</h3>

                  {/* 日期 */}
                  <div className="text-sm opacity-90 mb-4">
                    {formatDate(countdown.targetDate)}
                  </div>

                  {/* 天数显示 */}
                  <div className="flex items-center gap-2">
                    {isPast ? (
                      <div className="text-sm">已过去 {Math.abs(daysLeft)} 天</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold">{daysLeft}</div>
                        <div className="text-lg">天</div>
                      </>
                    )}
                  </div>

                  {/* 悬停显示操作按钮 */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition">
                      <span className="text-sm">编辑</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 预设模板建议 */}
      <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-3">💝 倒数日灵感</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <span className="text-2xl mb-2 block">🎂</span>
            <div className="font-medium text-gray-900">生日</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="text-2xl mb-2 block">❤️</span>
            <div className="font-medium text-gray-900">恋爱纪念</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="text-2xl mb-2 block">🎓</span>
            <div className="font-medium text-gray-900">毕业</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <span className="text-2xl mb-2 block">✈️</span>
            <div className="font-medium text-gray-900">旅行</div>
          </div>
        </div>
      </div>
    </div>
  )
}

