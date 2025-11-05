'use client'

import { useEffect, useState } from 'react'
import { habitAPI } from '@/lib/api'
import { Habit } from '@/types'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import HabitDialog from '@/components/HabitDialog'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showHabitDialog, setShowHabitDialog] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined)
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    loadHabits()
  }, [])

  const loadHabits = async () => {
    try {
      const response = await habitAPI.getHabits()
      setHabits(response.data.data || [])
    } catch (error) {
      console.error('Failed to load habits:', error)
      setHabits([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCheckIn = async (habitId: string, date: Date) => {
    // 使用本地日期字符串，避免时区问题
    const dateStr = format(date, 'yyyy-MM-dd')
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    // 检查该日期是否已打卡
    const isChecked = habit.records?.some((r: any) => {
      if (!r || !r.checkDate) return false
      const checkDate = new Date(r.checkDate)
      const checkDateStr = format(checkDate, 'yyyy-MM-dd')
      return checkDateStr === dateStr
    })

    try {
      if (isChecked) {
        // 取消打卡，不显示确认对话框
        await habitAPI.cancelCheckIn(habitId, date)
        loadHabits()
        // 如果有选中的习惯，刷新选中状态
        if (selectedHabit?.id === habitId) {
          const updated = await habitAPI.getHabits()
          const updatedHabit = updated.data.data?.find((h: any) => h.id === habitId)
          if (updatedHabit) setSelectedHabit(updatedHabit)
        }
      } else {
        // 打卡
        await habitAPI.checkIn(habitId, date)
        loadHabits()
        // 如果有选中的习惯，刷新选中状态
        if (selectedHabit?.id === habitId) {
          const updated = await habitAPI.getHabits()
          const updatedHabit = updated.data.data?.find((h: any) => h.id === habitId)
          if (updatedHabit) setSelectedHabit(updatedHabit)
        }
      }
    } catch (error: any) {
      console.error('Failed to toggle check-in:', error)
      const errorMsg = error.response?.data?.message || (isChecked ? '取消打卡失败' : '打卡失败')
      alert(errorMsg)
    }
  }

  const handleAddHabit = () => {
    setEditingHabit(undefined)
    setShowHabitDialog(true)
  }

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit)
    setShowHabitDialog(true)
  }

  const handleSaveHabit = async (habitData: any) => {
    try {
      if (editingHabit) {
        await habitAPI.updateHabit(editingHabit.id, habitData)
      } else {
        await habitAPI.createHabit(habitData)
      }
      setShowHabitDialog(false)
      setEditingHabit(undefined)
      loadHabits()
    } catch (error) {
      console.error('Failed to save habit:', error)
      alert('保存习惯失败，请检查输入。')
    }
  }

  const handleSelectHabit = (habit: any) => {
    setSelectedHabit(habit)
  }

  const getWeekDays = () => {
    const days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push({
        date,
        label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        isToday: i === 0,
      })
    }
    return days
  }

  const isCheckedOn = (habit: any, date: Date) => {
    if (!habit.records || !Array.isArray(habit.records)) return false
    const dateStr = format(date, 'yyyy-MM-dd')
    return habit.records.some((r: any) => {
      if (!r || !r.checkDate) return false
      const checkDate = new Date(r.checkDate)
      const checkDateStr = format(checkDate, 'yyyy-MM-dd')
      return checkDateStr === dateStr
    })
  }

  const getMonthCheckedDays = (habit: any) => {
    if (!habit.records || !Array.isArray(habit.records)) return 0
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return habit.records.filter((r: any) => {
      if (!r || !r.checkDate) return false
      const checkDate = new Date(r.checkDate)
      return checkDate >= start && checkDate <= end
    }).length
  }

  const getTotalCheckedDays = (habit: any) => {
    if (!habit.records || !Array.isArray(habit.records)) return 0
    return habit.records.length
  }

  const getMonthCompletionRate = (habit: any) => {
    const today = new Date()
    const daysInMonth = endOfMonth(currentMonth).getDate()
    const currentDay = isSameMonth(currentMonth, today) ? today.getDate() : daysInMonth
    const checkedDays = getMonthCheckedDays(habit)
    return currentDay > 0 ? Math.round((checkedDays / currentDay) * 100) : 0
  }

  const daysInCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: zhCN, weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { locale: zhCN, weekStartsOn: 1 })
    const days = []
    let day = start

    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const calendarDays = daysInCalendar()

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧：习惯列表 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">习惯</h2>
          <button
            onClick={handleAddHabit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>添加习惯</span>
          </button>
        </div>

        {/* 习惯列表 */}
        <div className="flex-1 overflow-y-auto">
          {habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="text-4xl mb-3">✨</div>
              <div className="text-gray-400 text-sm mb-1">还没有习惯</div>
              <div className="text-gray-500 text-xs">点击上方按钮添加新习惯</div>
            </div>
          ) : (
            <div className="p-2">
              {habits.map((habit) => {
                const isSelected = selectedHabit?.id === habit.id
                const todayChecked = isCheckedOn(habit, new Date())
                
                return (
                  <div
                    key={habit.id}
                    onClick={() => handleSelectHabit(habit)}
                    onDoubleClick={() => handleEditHabit(habit)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{habit.icon || '⭐'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {habit.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>连续 {habit.currentStreak || 0} 天</span>
                        </div>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleCheckIn(habit.id, new Date())
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                          todayChecked
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {todayChecked && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：统计面板 */}
      <div className="flex-1 overflow-y-auto">
        {selectedHabit ? (
          <div className="p-6">
            {/* 习惯标题 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedHabit.icon || '⭐'}</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedHabit.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    连续打卡 {selectedHabit.currentStreak || 0} 天
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEditHabit(selectedHabit)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                编辑
              </button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📅</span>
                  </div>
                  <span className="text-xs text-gray-500">月打卡</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getMonthCheckedDays(selectedHabit)} 天
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">✅</span>
                  </div>
                  <span className="text-xs text-gray-500">总打卡</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getTotalCheckedDays(selectedHabit)} 天
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600">🔥</span>
                  </div>
                  <span className="text-xs text-gray-500">月完成率</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {getMonthCompletionRate(selectedHabit)}%
                </div>
              </div>
            </div>

            {/* 日历视图 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {/* 月份导航 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    本月
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日历格子 */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  const isChecked = isCheckedOn(selectedHabit, day)

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (isCurrentMonth) {
                          handleToggleCheckIn(selectedHabit.id, day)
                        }
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition ${
                        !isCurrentMonth
                          ? 'text-gray-300 cursor-default'
                          : isToday
                          ? 'bg-blue-50 ring-2 ring-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm mb-1 ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </div>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          isChecked
                            ? 'bg-green-500'
                            : isCurrentMonth
                            ? 'bg-gray-200'
                            : 'bg-transparent'
                        }`}
                      >
                        {isChecked && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 十一月打卡日志 */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2">
                {format(currentMonth, 'MM月', { locale: zhCN })}打卡日志
              </h4>
              <p className="text-sm text-gray-600">
                这个月没有打卡日志哦
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">选择一个习惯</h3>
            <p className="text-gray-500 text-sm">
              从左侧列表中选择习惯，查看详细的统计数据和打卡记录
            </p>
          </div>
        )}
      </div>

      {/* 习惯对话框 */}
      {showHabitDialog && (
        <HabitDialog
          habit={editingHabit}
          onSave={handleSaveHabit}
          onClose={() => {
            setShowHabitDialog(false)
            setEditingHabit(undefined)
          }}
        />
      )}
    </div>
  )
}

