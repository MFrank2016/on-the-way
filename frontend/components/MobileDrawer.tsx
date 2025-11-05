'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import TaskSidebar from './TaskSidebar'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black transition-opacity z-40',
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 w-80 bg-white transform transition-transform duration-300 z-50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - 复用 TaskSidebar 的内容 */}
        <div className="flex-1 overflow-y-auto">
          <TaskSidebar />
        </div>
      </div>
    </>
  )
}

