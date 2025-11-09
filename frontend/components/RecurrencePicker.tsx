'use client'

import { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'workday' | 'holiday' | 'lunar_monthly' | 'lunar_yearly' | 'custom'
  interval: number
  weekdays?: number[] // 0=周日, 1=周一, ..., 6=周六
  monthDay?: number // 1-31
  lunarDate?: string // 格式: "MM-DD"
  endDate?: string
  endType?: 'none' | 'date' | 'count' // 结束类型
  endCount?: number // 重复次数
}

interface RecurrencePickerProps {
  value?: RecurrenceRule
  onChange: (rule: RecurrenceRule | null) => void
  onClose?: () => void
}

export default function RecurrencePicker({ value, onChange, onClose }: RecurrencePickerProps) {
  const [selectedType, setSelectedType] = useState<string>(value?.type || '')
  const [interval, setInterval] = useState(value?.interval || 1)
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(value?.weekdays || [])
  const [monthDay, setMonthDay] = useState(value?.monthDay || 1)
  const [endType, setEndType] = useState<'none' | 'date' | 'count'>(value?.endType || 'none')
  const [endDate, setEndDate] = useState(value?.endDate || '')
  const [endCount, setEndCount] = useState(value?.endCount || 10)
  const [showWorkdayOptions, setShowWorkdayOptions] = useState(false)
  const [showHolidayOptions, setShowHolidayOptions] = useState(false)
  const [showLunarOptions, setShowLunarOptions] = useState(false)

  const weekdayNames = ['日', '一', '二', '三', '四', '五', '六']

  const toggleWeekday = (day: number) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day))
    } else {
      setSelectedWeekdays([...selectedWeekdays, day].sort())
    }
  }

  const handleConfirm = () => {
    if (!selectedType) {
      onChange(null)
      onClose?.()
      return
    }

    const rule: RecurrenceRule = {
      type: selectedType as any,
      interval,
      endType,
    }

    if (selectedType === 'weekly' && selectedWeekdays.length > 0) {
      rule.weekdays = selectedWeekdays
    }

    if (selectedType === 'monthly') {
      rule.monthDay = monthDay
    }

    if (endType === 'date' && endDate) {
      rule.endDate = endDate
    }

    if (endType === 'count') {
      rule.endCount = endCount
    }

    onChange(rule)
    onClose?.()
  }

  const renderBasicOptions = () => (
    <div className="space-y-1">
      <button
        onClick={() => setSelectedType('daily')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'daily' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        每天
      </button>
      
      <button
        onClick={() => setSelectedType('weekly')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'weekly' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        每周 {selectedWeekdays.length > 0 && `(周${selectedWeekdays.map(d => weekdayNames[d]).join('、')})`}
      </button>

      <button
        onClick={() => setSelectedType('monthly')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'monthly' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        每月 ({monthDay}日)
      </button>

      <button
        onClick={() => setSelectedType('yearly')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'yearly' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        每年 (11月5日)
      </button>
    </div>
  )

  const renderAdvancedOptions = () => (
    <div className="space-y-1 mt-4">
      <button
        onClick={() => {
          setShowWorkdayOptions(!showWorkdayOptions)
          if (!showWorkdayOptions) setSelectedType('workday')
        }}
        className={`w-full px-3 py-2 text-left rounded-md transition flex items-center justify-between ${
          selectedType === 'workday' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>工作日</span>
        <ChevronRight className={`w-4 h-4 transition ${showWorkdayOptions ? 'rotate-90' : ''}`} />
      </button>
      {showWorkdayOptions && (
        <div className="ml-4 space-y-1">
          <button
            onClick={() => {
              setSelectedType('workday')
              setSelectedWeekdays([1, 2, 3, 4, 5])
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            每周1-5工作日 (周一至周五)
          </button>
          <button
            onClick={() => setSelectedType('workday')}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            法定工作日
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setShowHolidayOptions(!showHolidayOptions)
          if (!showHolidayOptions) setSelectedType('holiday')
        }}
        className={`w-full px-3 py-2 text-left rounded-md transition flex items-center justify-between ${
          selectedType === 'holiday' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>节假日</span>
        <ChevronRight className={`w-4 h-4 transition ${showHolidayOptions ? 'rotate-90' : ''}`} />
      </button>
      {showHolidayOptions && (
        <div className="ml-4 space-y-1">
          <button
            onClick={() => {
              setSelectedType('holiday')
              setSelectedWeekdays([0, 6])
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            每周末
          </button>
          <button
            onClick={() => setSelectedType('holiday')}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            法定节假日
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setShowLunarOptions(!showLunarOptions)
          if (!showLunarOptions) setSelectedType('lunar_monthly')
        }}
        className={`w-full px-3 py-2 text-left rounded-md transition flex items-center justify-between ${
          selectedType.includes('lunar') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>农历重复</span>
        <ChevronRight className={`w-4 h-4 transition ${showLunarOptions ? 'rotate-90' : ''}`} />
      </button>
      {showLunarOptions && (
        <div className="ml-4 space-y-1">
          <button
            onClick={() => setSelectedType('lunar_monthly')}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            农历每月 (十六)
          </button>
          <button
            onClick={() => setSelectedType('lunar_yearly')}
            className="w-full px-3 py-2 text-sm text-gray-600 text-left rounded-md hover:bg-gray-50"
          >
            农历每年 (九月十六)
          </button>
        </div>
      )}

      <button
        onClick={() => setSelectedType('custom')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'custom' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        艾宾浩斯记忆法
      </button>

      <button
        onClick={() => setSelectedType('custom')}
        className={`w-full px-3 py-2 text-left rounded-md transition ${
          selectedType === 'custom' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        自定义
      </button>
    </div>
  )

  return (
    <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>重复</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {renderBasicOptions()}
        {renderAdvancedOptions()}

        {/* 每周选择星期 */}
        {selectedType === 'weekly' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-700 mb-2">选择星期</div>
            <div className="grid grid-cols-7 gap-1">
              {weekdayNames.map((name, index) => (
                <button
                  key={index}
                  onClick={() => toggleWeekday(index)}
                  className={`py-1 text-xs rounded transition ${
                    selectedWeekdays.includes(index)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 每月选择日期 */}
        {selectedType === 'monthly' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-700 mb-2">每月第几天</div>
            <input
              type="number"
              min="1"
              max="31"
              value={monthDay}
              onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
              className="w-full px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded"
            />
          </div>
        )}

        {/* 间隔设置 */}
        {selectedType && !['workday', 'holiday'].includes(selectedType) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">每</span>
              <input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded"
              />
              <span className="text-xs font-medium text-gray-700">
                {selectedType === 'daily' && '天'}
                {selectedType === 'weekly' && '周'}
                {selectedType === 'monthly' && '月'}
                {selectedType === 'yearly' && '年'}
              </span>
            </div>
          </div>
        )}

        {/* 结束规则 */}
        {selectedType && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-700 mb-2">结束规则</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={endType === 'none'}
                  onChange={() => setEndType('none')}
                  className="w-3 h-3"
                />
                <span className="text-sm text-gray-700">永不结束</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={endType === 'date'}
                  onChange={() => setEndType('date')}
                  className="w-3 h-3"
                />
                <span className="text-sm text-gray-700">按到期日期</span>
              </label>
              {endType === 'date' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded ml-5"
                />
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                  className="w-3 h-3"
                />
                <span className="text-sm text-gray-700">按完成次数</span>
              </label>
              {endType === 'count' && (
                <div className="flex items-center gap-2 ml-5">
                  <input
                    type="number"
                    min="1"
                    value={endCount}
                    onChange={(e) => setEndCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">次</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            onChange(null)
            onClose?.()
          }}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          清除
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition shadow-sm"
        >
          确定
        </button>
      </div>
    </div>
  )
}
