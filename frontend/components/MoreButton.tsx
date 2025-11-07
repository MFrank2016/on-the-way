'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, List, Columns3, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MoreButtonProps {
  currentViewType: 'list' | 'kanban' | 'timeline'
  hideCompleted: boolean
  showDetail: boolean
  onViewTypeChange: (viewType: 'list' | 'kanban' | 'timeline') => void
  onHideCompletedChange: (hide: boolean) => void
  onShowDetailChange: (show: boolean) => void
}

export default function MoreButton({
  currentViewType,
  hideCompleted,
  showDetail,
  onViewTypeChange,
  onHideCompletedChange,
  onShowDetailChange,
}: MoreButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const viewTypes = [
    { value: 'list' as const, label: '列表视图', icon: List },
    { value: 'kanban' as const, label: '看板视图', icon: Columns3 },
    { value: 'timeline' as const, label: '时间线视图', icon: Clock, disabled: true },
  ]

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showDropdown])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* 视图选择 */}
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-2">视图</div>
            <div className="space-y-1">
              {viewTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      if (!type.disabled) {
                        onViewTypeChange(type.value)
                      }
                    }}
                    disabled={type.disabled}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition',
                      currentViewType === type.value
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50 text-gray-700',
                      type.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm flex-1">{type.label}</span>
                    {currentViewType === type.value && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 隐藏已完成 */}
          <div className="px-3 py-2 border-b border-gray-200">
            <button
              onClick={() => onHideCompletedChange(!hideCompleted)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition text-left"
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center',
                  hideCompleted
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                )}
              >
                {hideCompleted && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-700">隐藏已完成</span>
            </button>
          </div>

          {/* 显示详细 */}
          <div className="px-3 py-2">
            <button
              onClick={() => onShowDetailChange(!showDetail)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition text-left"
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center',
                  showDetail
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                )}
              >
                {showDetail && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-700">显示详细</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

