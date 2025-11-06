'use client'

import { useState } from 'react'
import { Clock, X, Check } from 'lucide-react'

interface TimeSelectorProps {
  value?: string
  onChange: (time: string | null) => void
  onClose: () => void
}

export default function TimeSelector({ value, onChange, onClose }: TimeSelectorProps) {
  const [selectedTime, setSelectedTime] = useState(value || '12:00')
  const [customTime, setCustomTime] = useState(value || '12:00')

  // 预设时间选项
  const timeOptions = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'
  ]

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setCustomTime(time)
  }

  const handleConfirm = () => {
    onChange(customTime)
    onClose()
  }

  const handleClear = () => {
    onChange(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">{customTime}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {/* 预设时间选项 */}
          <div className="space-y-1">
            {timeOptions.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeSelect(time)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${
                  selectedTime === time
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{time}</span>
                {selectedTime === time && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* 自定义时间输入 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="text-xs text-gray-600 mb-2 block">自定义时间</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => {
                setCustomTime(e.target.value)
                setSelectedTime(e.target.value)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={handleClear}
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

