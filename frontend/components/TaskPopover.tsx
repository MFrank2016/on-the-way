'use client'

import { Task, List } from '@/types'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TaskPopoverProps {
  tasks: Task[]
  lists: List[]
  anchorElement: HTMLElement | null
  onClose: () => void
  onTaskClick?: (task: Task) => void
}

export default function TaskPopover({ 
  tasks, 
  lists, 
  anchorElement, 
  onClose,
  onTaskClick 
}: TaskPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [anchorElement, onClose])

  // 计算悬浮框位置
  const getPosition = () => {
    if (!anchorElement) return { top: 0, left: 0 }

    const rect = anchorElement.getBoundingClientRect()
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width
    }
  }

  const position = getPosition()

  // 获取任务的清单颜色
  const getTaskColor = (task: Task) => {
    const taskList = lists.find(l => l.id === task.listId)
    return taskList?.color || '#3B82F6'
  }

  if (!anchorElement || tasks.length === 0) return null

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black bg-opacity-10 z-40" onClick={onClose} />
      
      {/* 悬浮框 */}
      <div
        ref={popoverRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxWidth: '400px'
        }}
      >
        <div className="p-3 space-y-2">
          {tasks.map((task) => {
            const taskColor = getTaskColor(task)
            const taskList = lists.find(l => l.id === task.listId)
            
            return (
              <div
                key={task.id}
                className={cn(
                  'p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50',
                  'border-l-2'
                )}
                style={{
                  borderLeftColor: taskColor
                }}
                onClick={() => {
                  onTaskClick?.(task)
                  onClose()
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 break-words">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {taskList && (
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${taskColor}20`,
                            color: taskColor
                          }}
                        >
                          {taskList.icon} {taskList.name}
                        </span>
                      )}
                      {task.dueTime && (
                        <span className="text-xs text-gray-500">
                          {task.dueTime}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.priority > 0 && (
                    <div className={cn(
                      'flex-shrink-0 w-1.5 h-1.5 rounded-full',
                      task.priority === 3 && 'bg-red-500',
                      task.priority === 2 && 'bg-yellow-500',
                      task.priority === 1 && 'bg-blue-500'
                    )} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

