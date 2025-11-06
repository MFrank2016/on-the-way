'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { RecurrenceRule } from './RecurrencePickerNew'

interface CustomRecurrencePickerProps {
  value?: RecurrenceRule
  onChange: (value: RecurrenceRule | null) => void
  onClose: () => void
}

export default function CustomRecurrencePicker({
  value,
  onChange,
  onClose
}: CustomRecurrencePickerProps) {
  const [repeatType, setRepeatType] = useState<'expire' | 'complete'>('expire')
  const [intervalType, setIntervalType] = useState<'week' | 'month' | 'year'>('week')
  const [intervalValue, setIntervalValue] = useState(1)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([4]) // 默认周四
  const [skipHolidays, setSkipHolidays] = useState(false)

  const weekdayNames = ['一', '二', '三', '四', '五', '六', '日']

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day))
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort())
    }
  }

  const handleConfirm = () => {
    const rule: RecurrenceRule = {
      type: 'custom',
      interval: intervalValue,
      skipHolidays
    }

    if (intervalType === 'week') {
      rule.weekdays = selectedWeekdays
    }

    onChange(rule)
    onClose()
  }

  const handleCancel = () => {
    onChange(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[110]">
      <div className="bg-white rounded-lg shadow-xl w-96" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-900">重复</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 重复类型选择 */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">按天提前</label>
            <div className="relative">
              <select
                value={repeatType}
                onChange={(e) => setRepeatType(e.target.value as 'expire' | 'complete')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expire">到期重复</option>
                <option value="complete">完成重复</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* 间隔设置 */}
          <div>
            <label className="text-xs text-gray-600 mb-2 block">提醒天数</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每</span>
              <input
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                className="w-16 px-3 py-2 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative flex-1">
                <select
                  value={intervalType}
                  onChange={(e) => setIntervalType(e.target.value as 'week' | 'month' | 'year')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">周</option>
                  <option value="month">月</option>
                  <option value="year">年</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 星期选择（仅周重复时显示） */}
          {intervalType === 'week' && (
            <div>
              <label className="text-xs text-gray-600 mb-2 block">提醒时间</label>
              <div className="grid grid-cols-7 gap-1">
                {weekdayNames.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => toggleWeekday(index)}
                    className={`py-2 text-sm rounded-md transition ${
                      selectedWeekdays.includes(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 跳过法定节假日 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipHolidays}
                onChange={(e) => setSkipHolidays(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">跳过法定节假日</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

