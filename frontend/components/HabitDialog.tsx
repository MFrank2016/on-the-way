'use client'

import { useState } from 'react'
import { Habit } from '@/types'
import FrequencyPicker, { FrequencyRule } from './FrequencyPicker'

interface HabitDialogProps {
  habit?: Habit
  onSave: (habitData: any) => void
  onClose: () => void
}

export default function HabitDialog({ habit, onSave, onClose }: HabitDialogProps) {
  const [name, setName] = useState(habit?.name || '')
  const [icon, setIcon] = useState(habit?.icon || '⭐')
  const [frequency, setFrequency] = useState<FrequencyRule>({
    type: (habit?.frequency as any) || 'daily',
    weekdays: habit?.frequencyDays ? JSON.parse(habit.frequencyDays) : [],
    interval: habit?.frequencyInterval || 1,
  })
  const [goalType, setGoalType] = useState<'daily_complete' | 'times_per_day'>(
    (habit?.goalType as any) || 'daily_complete'
  )
  const [goalCount, setGoalCount] = useState(habit?.goalCount || 1)
  const [startDate, setStartDate] = useState(
    habit?.startDate ? habit.startDate.split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [endDays, setEndDays] = useState<number>(habit?.endDays || 0)
  const [group, setGroup] = useState(habit?.group || 'evening')
  const [reminderTimes, setReminderTimes] = useState<string[]>(
    habit?.reminderTimes ? JSON.parse(habit.reminderTimes) : []
  )
  const [autoJournal, setAutoJournal] = useState(habit?.autoJournal || false)

  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [newReminderTime, setNewReminderTime] = useState('20:00')

  const icons = ['⭐', '🌟', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '🎯', '✅', '🔥']
  const groupOptions = [
    { value: 'morning', label: '上午' },
    { value: 'afternoon', label: '下午' },
    { value: 'evening', label: '晚上' },
    { value: 'other', label: '其他' },
  ]
  const endDaysOptions = [
    { value: 0, label: '永远' },
    { value: 7, label: '7天' },
    { value: 21, label: '21天' },
    { value: 30, label: '30天' },
    { value: 100, label: '100天' },
    { value: 365, label: '365天' },
  ]

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入习惯名称')
      return
    }

    const habitData: any = {
      name: name.trim(),
      icon: icon || '⭐',
      frequency: frequency.type || 'daily',
      frequencyDays: frequency.weekdays && frequency.weekdays.length > 0 ? JSON.stringify(frequency.weekdays) : '',
      frequencyInterval: frequency.interval || 1,
      goalType: goalType || 'daily_complete',
      goalCount: goalCount || 1,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDays: endDays || 0,
      group: group || 'evening',
      reminderTimes: reminderTimes.length > 0 ? JSON.stringify(reminderTimes) : '',
      autoJournal: autoJournal || false,
    }

    onSave(habitData)
  }

  const addReminderTime = () => {
    if (newReminderTime && !reminderTimes.includes(newReminderTime)) {
      setReminderTimes([...reminderTimes, newReminderTime].sort())
    }
  }

  const removeReminderTime = (time: string) => {
    setReminderTimes(reminderTimes.filter(t => t !== time))
  }

  const getFrequencyLabel = () => {
    if (frequency.type === 'daily') return '每天'
    if (frequency.type === 'weekly') {
      const days = frequency.weekdays?.map(d => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、')
      return `每周${days}`
    }
    if (frequency.type === 'custom') return `每${frequency.interval}天`
    return '每天'
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {habit ? '编辑习惯' : '添加习惯'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4">
          {/* 图标和名称 */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-16 h-16 text-4xl bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                {icon}
              </button>
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3 grid grid-cols-6 gap-2 z-10">
                  {icons.map((i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setIcon(i)
                        setShowIconPicker(false)
                      }}
                      className="w-10 h-10 text-2xl hover:bg-gray-100 rounded transition-colors"
                    >
                      {i}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="每天进步一点点"
              className="flex-1 px-4 py-3 text-lg text-gray-700 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* 频率 */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-2 block">频率</label>
            <div
              onClick={() => setShowFrequencyPicker(true)}
              className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm text-gray-700">{getFrequencyLabel()}</span>
            </div>
            {showFrequencyPicker && (
              <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50">
                <FrequencyPicker
                  value={frequency}
                  onChange={(rule) => {
                    if (rule) setFrequency(rule)
                    setShowFrequencyPicker(false)
                  }}
                  onClose={() => setShowFrequencyPicker(false)}
                />
              </div>
            )}
          </div>

          {/* 目标 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">目标</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={goalType === 'daily_complete'}
                  onChange={() => setGoalType('daily_complete')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">当天完成打卡</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={goalType === 'times_per_day'}
                  onChange={() => setGoalType('times_per_day')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">当天完成一定量</span>
              </label>
              {goalType === 'times_per_day' && (
                <div className="flex items-center gap-2 ml-6">
                  <input
                    type="number"
                    min="1"
                    value={goalCount}
                    onChange={(e) => setGoalCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">次/天</span>
                </div>
              )}
            </div>
          </div>

          {/* 开始日期 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 坚持天数 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">坚持天数</label>
            <div className="grid grid-cols-3 gap-2">
              {endDaysOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEndDays(option.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    endDays === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 分组 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">所属分组</label>
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 提醒 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">提醒</label>
            <div className="space-y-2">
              {reminderTimes.map((time) => (
                <div key={time} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">{time}</span>
                  <button
                    onClick={() => removeReminderTime(time)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addReminderTime}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  添加
                </button>
              </div>
            </div>
          </div>

          {/* 自动弹出打卡日志 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoJournal}
                onChange={(e) => setAutoJournal(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">自动弹出打卡日志</span>
            </label>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {habit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

