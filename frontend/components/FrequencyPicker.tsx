'use client'

import { useState, useEffect } from 'react'

export interface FrequencyRule {
  type: 'daily' | 'weekly' | 'custom'
  weekdays?: number[] // [1,2,3,4,5] 代表周一到周五
  interval?: number // 每N天
}

interface FrequencyPickerProps {
  value?: FrequencyRule
  onChange: (rule: FrequencyRule | null) => void
  onClose: () => void
}

export default function FrequencyPicker({ value, onChange, onClose }: FrequencyPickerProps) {
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>(value?.type || 'daily')
  const [weekdays, setWeekdays] = useState<number[]>(value?.weekdays || [])
  const [interval, setInterval] = useState(value?.interval || 1)

  const weekdayOptions = [
    { value: 1, label: '一' },
    { value: 2, label: '二' },
    { value: 3, label: '三' },
    { value: 4, label: '四' },
    { value: 5, label: '五' },
    { value: 6, label: '六' },
    { value: 0, label: '日' },
  ]

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter(d => d !== day))
    } else {
      setWeekdays([...weekdays, day].sort())
    }
  }

  const handleConfirm = () => {
    const rule: FrequencyRule = {
      type: frequencyType,
    }

    if (frequencyType === 'weekly') {
      rule.weekdays = weekdays
    } else if (frequencyType === 'custom') {
      rule.interval = interval
    }

    onChange(rule)
    onClose()
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 w-96">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">设置频率</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 频率类型选择 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">频率类型</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setFrequencyType('daily')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              frequencyType === 'daily'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            每天
          </button>
          <button
            onClick={() => setFrequencyType('weekly')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              frequencyType === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            按周
          </button>
          <button
            onClick={() => setFrequencyType('custom')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              frequencyType === 'custom'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            按时间间隔
          </button>
        </div>
      </div>

      {/* 按周 - 选择星期几 */}
      {frequencyType === 'weekly' && (
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
        </div>
      )}

      {/* 按时间间隔 */}
      {frequencyType === 'custom' && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">间隔天数</label>
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

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          取消
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

