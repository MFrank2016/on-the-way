'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GroupSortDialogProps {
  currentGroupBy: 'none' | 'time' | 'list' | 'tag' | 'priority'
  currentSortBy: 'time' | 'title' | 'tag' | 'priority'
  currentSortOrder: 'asc' | 'desc'
  onSave: (groupBy: string, sortBy: string, sortOrder: string) => void
  onClose: () => void
}

export default function GroupSortDialog({
  currentGroupBy,
  currentSortBy,
  currentSortOrder,
  onSave,
  onClose,
}: GroupSortDialogProps) {
  const [activeTab, setActiveTab] = useState<'group' | 'sort'>('group')
  const [groupBy, setGroupBy] = useState(currentGroupBy)
  const [sortBy, setSortBy] = useState(currentSortBy)
  const [sortOrder, setSortOrder] = useState(currentSortOrder)

  const groupOptions = [
    { value: 'none', label: '无' },
    { value: 'time', label: '时间' },
    { value: 'list', label: '清单' },
    { value: 'tag', label: '标签' },
    { value: 'priority', label: '优先级' },
  ]

  const sortOptions = [
    { value: 'time', label: '时间' },
    { value: 'title', label: '标题' },
    { value: 'tag', label: '标签' },
    { value: 'priority', label: '优先级' },
  ]

  const handleSave = () => {
    onSave(groupBy, sortBy, sortOrder)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">分组与排序</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('group')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition',
              activeTab === 'group'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            分组
          </button>
          <button
            onClick={() => setActiveTab('sort')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition',
              activeTab === 'sort'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            排序
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'group' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-3">选择分组方式</div>
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupBy(option.value as any)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition',
                    groupBy === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  <span>{option.label}</span>
                  {groupBy === option.value && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'sort' && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-3">选择排序方式</div>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition',
                        sortBy === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      )}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-3">排序顺序</div>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={sortOrder === 'desc'}
                    onChange={(e) => setSortOrder(e.target.checked ? 'desc' : 'asc')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">倒序排列</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-3 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

