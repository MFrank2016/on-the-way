'use client'

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface TasksDateSelectorProps {
  dateRange: string
  currentDate: Date
  onDateRangeChange: (range: string) => void
  onDateChange: (date: Date) => void
}

export default function TasksDateSelector({
  dateRange,
  currentDate,
  onDateRangeChange,
  onDateChange,
}: TasksDateSelectorProps) {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (dateRange === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (dateRange === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (dateRange === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    onDateChange(newDate)
  }

  const formatDateDisplay = () => {
    if (dateRange === 'day') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const current = new Date(currentDate)
      current.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((current.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今天'
      if (diffDays === -1) return '昨天'
      if (diffDays === 1) return '明天'
      return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`
    } else if (dateRange === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
    } else {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* 日期范围选择 */}
      <div className="relative">
        <button
          onClick={() => {
            const dropdown = document.getElementById('date-range-dropdown')
            if (dropdown) {
              dropdown.classList.toggle('hidden')
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
        >
          <span>
            {dateRange === 'day' ? '按日' : dateRange === 'week' ? '按周' : '按月'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <div
          id="date-range-dropdown"
          className="hidden absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]"
        >
          <button
            onClick={() => {
              onDateRangeChange('day')
              onDateChange(new Date())
              document.getElementById('date-range-dropdown')?.classList.add('hidden')
            }}
            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
              dateRange === 'day' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
            }`}
          >
            {dateRange === 'day' && <span className="mr-2">✓</span>}
            按日
          </button>
          <button
            onClick={() => {
              onDateRangeChange('week')
              onDateChange(new Date())
              document.getElementById('date-range-dropdown')?.classList.add('hidden')
            }}
            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
              dateRange === 'week' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
            }`}
          >
            {dateRange === 'week' && <span className="mr-2">✓</span>}
            按周
          </button>
          <button
            onClick={() => {
              onDateRangeChange('month')
              onDateChange(new Date())
              document.getElementById('date-range-dropdown')?.classList.add('hidden')
            }}
            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
              dateRange === 'month' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
            }`}
          >
            {dateRange === 'month' && <span className="mr-2">✓</span>}
            按月
          </button>
        </div>
      </div>

      {/* 日期导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigateDate('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium min-w-[120px] text-center text-gray-700">
          {formatDateDisplay()}
        </span>
        <button
          onClick={() => navigateDate('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

