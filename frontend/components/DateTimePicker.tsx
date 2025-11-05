'use client'

import { useState } from 'react'
import { format, addDays, startOfWeek, endOfWeek, addWeeks, addMonths, startOfMonth, endOfMonth, isSameDay, isSameMonth } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date) => void
  onClose?: () => void
  showTime?: boolean
}

export default function DateTimePicker({ 
  value, 
  onChange, 
  onClose,
  showTime = true 
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date())
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? format(value, 'HH:mm') : '14:00'
  )
  const [viewDate, setViewDate] = useState<Date>(value || new Date())
  const [showCalendar, setShowCalendar] = useState(false)

  const handleQuickSelect = (date: Date) => {
    setSelectedDate(date)
    const [hours, minutes] = selectedTime.split(':')
    date.setHours(parseInt(hours), parseInt(minutes))
    onChange(date)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const [hours, minutes] = selectedTime.split(':')
    date.setHours(parseInt(hours), parseInt(minutes))
    onChange(date)
    setShowCalendar(false)
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    const newDate = new Date(selectedDate)
    const [hours, minutes] = time.split(':')
    newDate.setHours(parseInt(hours), parseInt(minutes))
    onChange(newDate)
  }

  const getDaysInMonth = () => {
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

  const quickOptions = [
    { label: '今天', date: new Date() },
    { label: '明天', date: addDays(new Date(), 1) },
    { label: '下周一', date: addDays(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }), 0) },
    { label: '下周', date: addWeeks(new Date(), 1) },
  ]

  const timeOptions = [
    '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
  ]

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      {/* 快捷选择 */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2">
          {quickOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => handleQuickSelect(option.date)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isSameDay(selectedDate, option.date)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 日期选择按钮 */}
      <div className="mb-4">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full px-4 py-2 text-left bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">
            {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 日历 */}
      {showCalendar && (
        <div className="mb-4 border border-gray-200 rounded-md p-3">
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
            {getDaysInMonth().map((date, index) => {
              const isCurrentMonth = isSameMonth(date, viewDate)
              const isSelected = isSameDay(date, selectedDate)
              const isToday = isSameDay(date, new Date())

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={!isCurrentMonth}
                  className={`
                    p-2 text-sm font-medium rounded-md transition-colors
                    ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${isToday && !isSelected ? 'bg-blue-50 text-blue-600' : ''}
                    ${isCurrentMonth && !isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {format(date, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 时间选择 */}
      {showTime && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">时间</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeChange(time)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTime === time
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 确认按钮 */}
      {onClose && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              const [hours, minutes] = selectedTime.split(':')
              const finalDate = new Date(selectedDate)
              finalDate.setHours(parseInt(hours), parseInt(minutes))
              onChange(finalDate)
              onClose()
            }}
            className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      )}
    </div>
  )
}

