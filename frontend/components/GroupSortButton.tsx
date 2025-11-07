'use client'

import { useState, useRef, useEffect } from 'react'
import { ListFilter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import GroupSortDialog from './GroupSortDialog'

interface GroupSortButtonProps {
  currentGroupBy: 'none' | 'time' | 'list' | 'tag' | 'priority'
  currentSortBy: 'time' | 'title' | 'tag' | 'priority'
  currentSortOrder: 'asc' | 'desc'
  onSave: (groupBy: string, sortBy: string, sortOrder: string) => void
}

export default function GroupSortButton({
  currentGroupBy,
  currentSortBy,
  currentSortOrder,
  onSave,
}: GroupSortButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const groupLabels: Record<string, string> = {
    none: '无',
    time: '时间',
    list: '清单',
    tag: '标签',
    priority: '优先级',
  }

  const sortLabels: Record<string, string> = {
    time: '时间',
    title: '标题',
    tag: '标签',
    priority: '优先级',
  }

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

  const handleGroupClick = () => {
    setShowDropdown(false)
    setShowDialog(true)
  }

  const handleSortClick = () => {
    setShowDropdown(false)
    setShowDialog(true)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <ListFilter className="w-4 h-4" />
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Group Section */}
          <div className="px-3 py-2 border-b border-gray-200">
            <button
              onClick={handleGroupClick}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 px-2 py-1.5 rounded transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">分组</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-900">
                  {groupLabels[currentGroupBy]}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 -rotate-90" />
              </div>
            </button>
          </div>

          {/* Sort Section */}
          <div className="px-3 py-2">
            <button
              onClick={handleSortClick}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 px-2 py-1.5 rounded transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">排序</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-900">
                  {sortLabels[currentSortBy]}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 -rotate-90" />
              </div>
            </button>
            
            {/* Sort Order Hint */}
            {currentSortOrder === 'desc' && (
              <div className="px-2 mt-1">
                <span className="text-xs text-gray-500">倒序排列</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <GroupSortDialog
          currentGroupBy={currentGroupBy}
          currentSortBy={currentSortBy}
          currentSortOrder={currentSortOrder}
          onSave={onSave}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  )
}

