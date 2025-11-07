'use client'

import { useState } from 'react'
import { Repeat, X, Check, ChevronRight } from 'lucide-react'

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'workday' | 'holiday' | 'lunar_monthly' | 'lunar_yearly' | 'ebbinghaus' | 'custom'
  interval?: number
  weekdays?: number[]
  monthDay?: number
  endDate?: string
  skipHolidays?: boolean
}

interface RecurrencePickerNewProps {
  value?: RecurrenceRule
  onChange: (value: RecurrenceRule | null) => void
  onClose: () => void
  onCustomClick?: () => void
}

export default function RecurrencePickerNew({
  value,
  onChange,
  onClose,
  onCustomClick
}: RecurrencePickerNewProps) {
  const [selectedType, setSelectedType] = useState<string>(value?.type || '')
  const [showWorkdayOptions, setShowWorkdayOptions] = useState(false)
  const [showHolidayOptions, setShowHolidayOptions] = useState(false)
  const [showLunarOptions, setShowLunarOptions] = useState(false)

  // 基础选项
  const basicOptions = [
    { type: 'daily', label: '每天' },
    { type: 'weekly', label: '每周', detail: '(周五)' },
    { type: 'monthly', label: '每月', detail: '(7日)' },
    { type: 'yearly', label: '每年', detail: '(11月7日)' },
  ]

  const handleOptionSelect = (type: string, weekdays?: number[]) => {
    setSelectedType(type)
    const rule: RecurrenceRule = { type: type as any }
    if (weekdays) {
      rule.weekdays = weekdays
    }
  }

  const handleConfirm = () => {
    if (!selectedType) {
      onChange(null)
    } else {
      onChange({ type: selectedType as any, interval: 1 })
    }
    onClose()
  }

  const handleCustom = () => {
    onCustomClick?.()
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">重复</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {/* 基础选项 */}
          <div className="space-y-1">
            {basicOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleOptionSelect(option.type)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                  selectedType === option.type
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.label}</span>
                  {option.detail && (
                    <span className="text-xs text-gray-500">{option.detail}</span>
                  )}
                </div>
                {selectedType === option.type && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* 工作日选项 */}
          <div className="mt-4">
            <button
              onClick={() => setShowWorkdayOptions(!showWorkdayOptions)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                selectedType === 'workday'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>工作日</span>
              <ChevronRight className={`w-4 h-4 transition ${showWorkdayOptions ? 'rotate-90' : ''}`} />
            </button>
            {showWorkdayOptions && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => handleOptionSelect('workday', [1, 2, 3, 4, 5])}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  每周工作日 <span className="text-xs text-gray-500">(周一至周五)</span>
                </button>
                <button
                  onClick={() => handleOptionSelect('workday')}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  法定工作日
                </button>
              </div>
            )}
          </div>

          {/* 节假日选项 */}
          <div className="mt-2">
            <button
              onClick={() => setShowHolidayOptions(!showHolidayOptions)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                selectedType === 'holiday'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>节假日</span>
              <ChevronRight className={`w-4 h-4 transition ${showHolidayOptions ? 'rotate-90' : ''}`} />
            </button>
            {showHolidayOptions && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => handleOptionSelect('holiday', [0, 6])}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  每周末
                </button>
                <button
                  onClick={() => handleOptionSelect('holiday')}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  法定节假日
                </button>
              </div>
            )}
          </div>

          {/* 农历重复选项 */}
          <div className="mt-2">
            <button
              onClick={() => setShowLunarOptions(!showLunarOptions)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                selectedType.includes('lunar')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>农历重复</span>
              <ChevronRight className={`w-4 h-4 transition ${showLunarOptions ? 'rotate-90' : ''}`} />
            </button>
            {showLunarOptions && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => handleOptionSelect('lunar_monthly')}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  农历每月 <span className="text-xs text-gray-500">(十八)</span>
                </button>
                <button
                  onClick={() => handleOptionSelect('lunar_yearly')}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-50"
                >
                  农历每年 <span className="text-xs text-gray-500">(九月十八)</span>
                </button>
              </div>
            )}
          </div>

          {/* 艾宾浩斯记忆法 */}
          <div className="mt-2">
            <button
              onClick={() => handleOptionSelect('ebbinghaus')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                selectedType === 'ebbinghaus'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>艾宾浩斯记忆法</span>
              {selectedType === 'ebbinghaus' && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>

          {/* 自定义 */}
          <div className="mt-2">
            <button
              onClick={handleCustom}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              <span>自定义</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => {
              onChange(null)
              onClose()
            }}
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

