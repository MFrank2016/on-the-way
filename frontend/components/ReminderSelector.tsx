'use client'

import { useState } from 'react'
import { Bell, X, Check, ChevronDown } from 'lucide-react'
import { format, addDays, subDays, subHours } from 'date-fns'

interface ReminderSelectorProps {
  baseDate?: Date // 任务的截止日期
  value?: {
    offset: number // 提前分钟数
    time: string // 提醒时间
  }
  onChange: (value: { offset: number; time: string } | null) => void
  onClose: () => void
}

export default function ReminderSelector({
  baseDate = new Date(),
  value,
  onChange,
  onClose
}: ReminderSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<string>(value ? 'custom' : '')
  const [showCustom, setShowCustom] = useState(false)
  const [customMode, setCustomMode] = useState<'day' | 'hour'>('day')
  const [customDays, setCustomDays] = useState(1)
  const [customHours, setCustomHours] = useState(1)
  const [customTime, setCustomTime] = useState('09:00')

  // 预设选项
  const presetOptions = [
    { label: '当天 (9:00)', value: 'same_day', offset: 0, time: '09:00' },
    { label: '提前 1 天 (9:00)', value: 'day_1', offset: 1440, time: '09:00' },
    { label: '提前 2 天 (9:00)', value: 'day_2', offset: 2880, time: '09:00' },
    { label: '提前 3 天 (9:00)', value: 'day_3', offset: 4320, time: '09:00' },
    { label: '提前 7 天 (9:00)', value: 'day_7', offset: 10080, time: '09:00' },
  ]

  const handlePresetSelect = (option: typeof presetOptions[0]) => {
    setSelectedOption(option.value)
    setShowCustom(false)
  }

  const handleCustomClick = () => {
    setSelectedOption('custom')
    setShowCustom(true)
  }

  const calculateReminderTime = () => {
    if (customMode === 'day') {
      const reminderDate = subDays(baseDate, customDays)
      const [hours, minutes] = customTime.split(':')
      reminderDate.setHours(parseInt(hours), parseInt(minutes))
      return format(reminderDate, 'yyyy年MM月dd日, HH:mm') + '提醒'
    } else {
      const reminderDate = subHours(baseDate, customHours)
      return format(reminderDate, 'yyyy年MM月dd日, HH:mm') + '提醒'
    }
  }

  const handleConfirm = () => {
    if (selectedOption === 'custom') {
      const offset = customMode === 'day' 
        ? customDays * 1440 
        : customHours * 60
      onChange({ offset, time: customTime })
    } else {
      const preset = presetOptions.find(o => o.value === selectedOption)
      if (preset) {
        onChange({ offset: preset.offset, time: preset.time })
      }
    }
    onClose()
  }

  const handleCancel = () => {
    onChange(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">当天, 提醒 1 天</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {/* 预设选项 */}
          <div className="space-y-1">
            {presetOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePresetSelect(option)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                  selectedOption === option.value
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{option.label}</span>
                {selectedOption === option.value && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* 自定义选项 */}
          <div className="mt-2">
            <button
              onClick={handleCustomClick}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                selectedOption === 'custom'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>自定义</span>
              {selectedOption === 'custom' && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>

          {/* 自定义配置 */}
          {showCustom && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              {/* 提醒方式选择 */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">按天提前</label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value as 'day' | 'hour')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">按天提前</option>
                  <option value="hour">按时提前</option>
                </select>
              </div>

              {/* 天数/小时数输入 */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">
                  提醒{customMode === 'day' ? '天' : '时'}数
                </label>
                <input
                  type="number"
                  min="1"
                  value={customMode === 'day' ? customDays : customHours}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    if (customMode === 'day') {
                      setCustomDays(value)
                    } else {
                      setCustomHours(value)
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 提醒时间（仅按天提前时显示） */}
              {customMode === 'day' && (
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">提醒时间</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* 提醒时间预览 */}
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                {calculateReminderTime()}
              </div>
            </div>
          )}
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
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

