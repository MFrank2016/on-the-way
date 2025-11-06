'use client'

import { useState, useEffect } from 'react'
import { format, addDays, addWeeks, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, Bell, Repeat, ChevronRight, X } from 'lucide-react'
import { Solar, Lunar } from 'lunar-javascript'
import TimeSelector from './TimeSelector'
import ReminderSelector from './ReminderSelector'
import RecurrencePickerNew from './RecurrencePickerNew'
import CustomRecurrencePicker from './CustomRecurrencePicker'

interface DateTimeReminderPickerProps {
  value?: {
    date?: Date
    time?: string
    reminderOffset?: number // 提前分钟数
    reminderTime?: string // 提醒时间
    recurrence?: RecurrenceRule
    isAllDay?: boolean
    startDate?: Date
    endDate?: Date
  }
  onChange: (value: any) => void
  onClose?: () => void
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'workday' | 'holiday' | 'lunar_monthly' | 'lunar_yearly' | 'custom'
  interval?: number
  weekdays?: number[]
  monthDay?: number
  endDate?: string
  skipHolidays?: boolean
}

export default function DateTimeReminderPicker({
  value,
  onChange,
  onClose
}: DateTimeReminderPickerProps) {
  const [activeTab, setActiveTab] = useState<'date' | 'timeRange'>('date')
  const [selectedDate, setSelectedDate] = useState<Date>(value?.date || new Date())
  const [selectedTime, setSelectedTime] = useState<string>(value?.time || '')
  const [viewDate, setViewDate] = useState<Date>(value?.date || new Date())
  const [showTimeSelector, setShowTimeSelector] = useState(false)
  const [showReminderSelector, setShowReminderSelector] = useState(false)
  const [showRecurrenceSelector, setShowRecurrenceSelector] = useState(false)
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(false)
  const [reminderOffset, setReminderOffset] = useState<number>(value?.reminderOffset || 0)
  const [reminderTime, setReminderTime] = useState<string>(value?.reminderTime || '09:00')
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(value?.recurrence || null)
  
  // 时间段相关状态
  const [isAllDay, setIsAllDay] = useState(value?.isAllDay || false)
  const [startDate, setStartDate] = useState<Date>(value?.startDate || new Date())
  const [endDate, setEndDate] = useState<Date>(value?.endDate || new Date())
  const [startTime, setStartTime] = useState<string>('12:30')
  const [endTime, setEndTime] = useState<string>('13:30')

  // 快捷日期选项
  const quickDateOptions = [
    { label: '今天', date: new Date() },
    { label: '明天', date: addDays(new Date(), 1) },
    { label: '下周', date: addWeeks(new Date(), 1) },
    { label: '下月', date: addMonths(new Date(), 1) },
  ]

  // 获取日历中的所有日期
  const getCalendarDays = () => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    const startWeek = startOfWeek(start, { weekStartsOn: 1 })
    const endWeek = endOfWeek(end, { weekStartsOn: 1 })
    
    const days = []
    let currentDate = startWeek
    
    while (currentDate <= endWeek) {
      days.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }
    
    return days
  }

  // 获取农历日期
  const getLunarDate = (date: Date) => {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    return lunar.getDayInChinese()
  }

  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // 处理确认
  const handleConfirm = () => {
    const result: any = {
      date: selectedDate,
      time: selectedTime,
      reminderOffset,
      reminderTime,
      recurrence,
    }

    if (activeTab === 'timeRange') {
      result.isAllDay = isAllDay
      result.startDate = startDate
      result.endDate = endDate
      if (!isAllDay) {
        result.startTime = startTime
        result.endTime = endTime
      }
    }

    onChange(result)
    onClose?.()
  }

  // 处理清除
  const handleClear = () => {
    onChange(null)
    onClose?.()
  }

  // 计算提醒文本
  const getReminderText = () => {
    if (reminderOffset === 0) {
      return `当天, 提醒 ${reminderTime}`
    }
    const days = Math.floor(reminderOffset / 1440)
    const hours = Math.floor((reminderOffset % 1440) / 60)
    
    if (days > 0) {
      return `提前 ${days} 天 (${reminderTime})`
    } else if (hours > 0) {
      return `提前 ${hours} 小时`
    }
    return '当天'
  }

  // 获取重复文本
  const getRecurrenceText = () => {
    if (!recurrence) return '重复'
    const typeLabels: Record<string, string> = {
      daily: '每天',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
      workday: '工作日',
      holiday: '节假日',
      lunar_monthly: '农历每月',
      lunar_yearly: '农历每年',
      custom: '自定义',
    }
    return typeLabels[recurrence.type] || '重复'
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Tab切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('date')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'date'
              ? 'text-gray-900 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          日期
        </button>
        <button
          onClick={() => setActiveTab('timeRange')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'timeRange'
              ? 'text-gray-900 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          时间段
        </button>
      </div>

      <div className="p-4">
        {/* 日期Tab内容 */}
        {activeTab === 'date' && (
          <div className="space-y-4">
            {/* 快捷日期选择 */}
            <div className="grid grid-cols-4 gap-2">
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleDateSelect(option.date)}
                  className={`px-3 py-2 text-sm rounded-md transition ${
                    isSameDay(selectedDate, option.date)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 日历选择器 */}
            <div>
              {/* 月份导航 */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setViewDate(addMonths(viewDate, -1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-medium text-gray-700">
                  {format(viewDate, 'yyyy年MM月', { locale: zhCN })}
                </div>
                <button
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                  <div key={day} className="text-center text-xs text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = isSameMonth(date, viewDate)
                  const isSelected = isSameDay(date, selectedDate)
                  const isToday = isSameDay(date, new Date())
                  const lunarDay = getLunarDate(date)

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(date)}
                      disabled={!isCurrentMonth}
                      className={`
                        p-1 text-sm rounded-md transition flex flex-col items-center
                        ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
                        ${isSelected ? 'bg-blue-500 text-white' : ''}
                        ${isToday && !isSelected ? 'bg-blue-50 text-blue-600 font-medium' : ''}
                        ${isCurrentMonth && !isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      <span>{format(date, 'd')}</span>
                      <span className="text-[10px] opacity-70">{lunarDay}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 时间段Tab内容 */}
        {activeTab === 'timeRange' && (
          <div className="space-y-4">
            {/* 开始时间 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-12">开始</span>
              <input
                type="text"
                value={format(startDate, 'MM/dd')}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              )}
            </div>

            {/* 结束时间 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-12">结束</span>
              <input
                type="text"
                value={format(endDate, 'MM/dd')}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
              />
              {!isAllDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              )}
            </div>

            {/* 全天开关 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">全天</span>
              <button
                onClick={() => setIsAllDay(!isAllDay)}
                className={`relative w-11 h-6 rounded-full transition ${
                  isAllDay ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isAllDay ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* 底部固定区域 */}
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          {/* 时间选择 */}
          <button
            onClick={() => setShowTimeSelector(!showTimeSelector)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
          >
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="flex-1 text-sm text-blue-600">
              {selectedTime || '时间'}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 提醒选择 */}
          <button
            onClick={() => setShowReminderSelector(!showReminderSelector)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
          >
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="flex-1 text-sm text-blue-600">
              {reminderOffset > 0 ? getReminderText() : '准时'}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 重复选择 */}
          <button
            onClick={() => setShowRecurrenceSelector(!showRecurrenceSelector)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left"
          >
            <Repeat className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-sm text-gray-600">
              {getRecurrenceText()}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 底部按钮 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            清除
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
          >
            确定
          </button>
        </div>
      </div>

      {/* 时间选择弹窗 */}
      {showTimeSelector && (
        <TimeSelector
          value={selectedTime}
          onChange={(time) => {
            if (time) {
              setSelectedTime(time)
            }
            setShowTimeSelector(false)
          }}
          onClose={() => setShowTimeSelector(false)}
        />
      )}

      {/* 提醒选择弹窗 */}
      {showReminderSelector && (
        <ReminderSelector
          baseDate={selectedDate}
          value={{ offset: reminderOffset, time: reminderTime }}
          onChange={(value) => {
            if (value) {
              setReminderOffset(value.offset)
              setReminderTime(value.time)
            }
            setShowReminderSelector(false)
          }}
          onClose={() => setShowReminderSelector(false)}
        />
      )}

      {/* 重复选择弹窗 */}
      {showRecurrenceSelector && (
        <RecurrencePickerNew
          value={recurrence || undefined}
          onChange={(value) => {
            setRecurrence(value)
            setShowRecurrenceSelector(false)
          }}
          onClose={() => setShowRecurrenceSelector(false)}
          onCustomClick={() => {
            setShowRecurrenceSelector(false)
            setShowCustomRecurrence(true)
          }}
        />
      )}

      {/* 自定义重复弹窗 */}
      {showCustomRecurrence && (
        <CustomRecurrencePicker
          value={recurrence || undefined}
          onChange={(value) => {
            setRecurrence(value)
            setShowCustomRecurrence(false)
          }}
          onClose={() => setShowCustomRecurrence(false)}
        />
      )}
    </div>
  )
}

