'use client'

interface TimeRangeSelectorProps {
  value: 'day' | 'week' | 'month'
  onChange: (range: 'day' | 'week' | 'month') => void
  className?: string
}

export default function TimeRangeSelector({ value, onChange, className = '' }: TimeRangeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'day' | 'week' | 'month')}
      className={`px-2 md:px-3 py-1 md:py-1.5 border border-gray-200 rounded-lg text-[10px] sm:text-xs md:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="day">日</option>
      <option value="week">周</option>
      <option value="month">月</option>
    </select>
  )
}

