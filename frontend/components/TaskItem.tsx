'use client'

import { Task } from '@/types'
import { useState, useRef, useEffect } from 'react'
import { Check, Clock, Tag, Trash2, Edit, Flag } from 'lucide-react'
import { formatDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onUpdateTitle?: (id: string, title: string) => void
  isSelected?: boolean
}

const priorityColors = {
  0: 'text-gray-300',
  1: 'text-blue-500',
  2: 'text-yellow-500',
  3: 'text-red-500',
}

export default function TaskItem({ task, onComplete, onDelete, onEdit, onUpdateTitle, isSelected = false }: TaskItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  // 同步任务标题变化
  useEffect(() => {
    setTempTitle(task.title)
  }, [task.title])

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTitle(true)
  }

  const handleTitleSave = () => {
    const trimmed = tempTitle.trim()
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle?.(task.id.toString(), trimmed)
    } else if (!trimmed) {
      setTempTitle(task.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setTempTitle(task.title)
      setIsEditingTitle(false)
    }
  }

  return (
    <div
      onClick={() => !isEditingTitle && onEdit(task)}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 bg-white rounded-lg border transition hover:shadow-sm cursor-pointer',
        task.status === 'completed' ? 'border-gray-200 bg-gray-50' : 'border-gray-200',
        isSelected && 'ring-2 ring-blue-500 bg-blue-50'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onComplete(task.id.toString())
        }}
        className={cn(
          'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition',
          task.status === 'completed'
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 hover:border-blue-500'
        )}
      >
        {task.status === 'completed' && (
          <Check className="w-3 h-3 text-white" />
        )}
      </button>

      {/* Priority Flag */}
      {task.priority > 0 && (
        <Flag className={cn('w-3.5 h-3.5 flex-shrink-0', priorityColors[task.priority as keyof typeof priorityColors])} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isEditingTitle ? (
          <input
            ref={inputRef}
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm outline-none bg-transparent border-b border-blue-500 text-gray-900"
          />
        ) : (
          <span 
            onClick={handleTitleClick}
            className={cn(
              'text-sm flex-1 hover:text-blue-600 transition',
          task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
            )}
          >
          {task.title}
          </span>
        )}

        {/* Meta - 移到末尾 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ 
                    backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                    color: tag.color || '#6b7280'
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* List */}
          {task.list && (
            <span className="text-xs text-gray-500 hidden md:inline">
              {task.list.name}
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDateString(task.dueDate, task.dueTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id.toString())
          }}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

