'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

interface ChartContainerProps {
  title: string
  children: ReactNode
  dropdown?: {
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }
  navigation?: {
    onPrev: () => void
    onNext: () => void
    label?: string
  }
  className?: string
}

export default function ChartContainer({
  title,
  children,
  dropdown,
  navigation,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="flex items-center gap-3">
          {dropdown && (
            <select
              value={dropdown.value}
              onChange={(e) => dropdown.onChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dropdown.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {navigation && (
            <div className="flex items-center gap-2">
              <button
                onClick={navigation.onPrev}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              {navigation.label && (
                <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                  {navigation.label}
                </span>
              )}
              <button
                onClick={navigation.onNext}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div>{children}</div>
    </div>
  )
}

