'use client'

import { useState } from 'react'
import { RecurrenceRule } from '@/types'

interface RecurrencePickerProps {
  value?: RecurrenceRule
  onChange: (rule: RecurrenceRule | null) => void
  onClose?: () => void
}

export default function RecurrencePicker({ value, onChange, onClose }: RecurrencePickerProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceRule['type']>(value?.type || 'daily')
  const [interval, setInterval] = useState(value?.interval || 1)
  const [weekdays, setWeekdays] = useState<number[]>(value?.weekdays || [1, 2, 3, 4, 5])
  const [monthDay, setMonthDay] = useState(value?.monthDay || 1)
  const [lunarDate, setLunarDate] = useState(value?.lunarDate || '')
  const [endDate, setEndDate] = useState<string>(value?.endDate || '')
  const [hasEndDate, setHasEndDate] = useState(!!value?.endDate)

  const recurrenceOptions = [
    { value: 'daily', label: '每天', icon: '☀️' },
    { value: 'weekly', label: '每周', icon: '📅' },
    { value: 'monthly', label: '每月', icon: '📆' },
    { value: 'yearly', label: '每年', icon: '🎉' },
    { value: 'workday', label: '工作日', icon: '💼' },
    { value: 'holiday', label: '节假日', icon: '🏖️' },
    { value: 'lunar_monthly', label: '农历每月', icon: '🏮' },
    { value: 'lunar_yearly', label: '农历每年', icon: '🧧' },
    { value: 'custom', label: '自定义', icon: '⚙️' },
  ]

  const weekdayOptions = [
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
    { value: 0, label: '周日' },
  ]

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter(d => d !== day))
    } else {
      setWeekdays([...weekdays, day].sort())
    }
  }

  const handleConfirm = () => {
    const rule: RecurrenceRule = {
      type: recurrenceType,
      interval,
    }

    if (recurrenceType === 'weekly' && weekdays.length > 0) {
      rule.weekdays = weekdays
    }

    if (recurrenceType === 'monthly') {
      rule.monthDay = monthDay
    }

    if (recurrenceType === 'lunar_monthly' || recurrenceType === 'lunar_yearly') {
      rule.lunarDate = lunarDate
    }

    if (hasEndDate && endDate) {
      rule.endDate = endDate
    }

    onChange(rule)
    onClose?.()
  }

  const handleDisable = () => {
    onChange(null)
    onClose?.()
  }

  return (
    <div className="w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">重复模式</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 重复类型选择 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">重复类型</label>
        <div className="grid grid-cols-3 gap-2">
          {recurrenceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRecurrenceType(option.value as RecurrenceRule['type'])}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex flex-col items-center gap-1 ${
                recurrenceType === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 间隔设置（每天、自定义） */}
      {(recurrenceType === 'daily' || recurrenceType === 'custom') && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {recurrenceType === 'daily' ? '每几天' : '自定义间隔（天）'}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每</span>
            <input
              type="number"
              min="1"
              max="365"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">天</span>
          </div>
        </div>
      )}

      {/* 每周重复 - 选择星期几 */}
      {recurrenceType === 'weekly' && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">选择星期</label>
          <div className="grid grid-cols-7 gap-2">
            {weekdayOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleWeekday(option.value)}
                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                  weekdays.includes(option.value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">每几周</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每</span>
              <input
                type="number"
                min="1"
                max="52"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">周</span>
            </div>
          </div>
        </div>
      )}

      {/* 每月重复 - 选择日期 */}
      {recurrenceType === 'monthly' && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">每月第几天</label>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">每月</span>
            <input
              type="number"
              min="1"
              max="31"
              value={monthDay}
              onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">日</span>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">每几个月</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每</span>
              <input
                type="number"
                min="1"
                max="12"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">个月</span>
            </div>
          </div>
        </div>
      )}

      {/* 每年重复 */}
      {recurrenceType === 'yearly' && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">每几年</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">每</span>
            <input
              type="number"
              min="1"
              max="10"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">年</span>
          </div>
        </div>
      )}

      {/* 农历重复 */}
      {(recurrenceType === 'lunar_monthly' || recurrenceType === 'lunar_yearly') && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">农历日期</label>
          <input
            type="text"
            placeholder="格式: MM-DD，例如 01-15"
            value={lunarDate}
            onChange={(e) => setLunarDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            示例：01-01（正月初一），08-15（八月十五）
          </p>
        </div>
      )}

      {/* 工作日/节假日提示 */}
      {recurrenceType === 'workday' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            工作日重复将在每周一至周五重复此任务
          </p>
        </div>
      )}

      {recurrenceType === 'holiday' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            节假日重复将在每个周末重复此任务
          </p>
        </div>
      )}

      {/* 结束日期 */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">设置结束日期</label>
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        {hasEndDate && (
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleDisable}
          className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          禁用重复
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  )
}

