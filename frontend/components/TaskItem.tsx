'use client'

import { Task } from '@/types'
import { Check, Clock, Tag, Trash2, Edit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

const priorityColors = {
  0: 'bg-gray-100 text-gray-600', // 不重要不紧急
  1: 'bg-blue-100 text-blue-600', // 不重要但紧急
  2: 'bg-yellow-100 text-yellow-600', // 重要不紧急
  3: 'bg-red-100 text-red-600', // 重要且紧急
}

const priorityLabels = {
  0: '无',
  1: '紧急',
  2: '重要',
  3: '紧急重要',
}

export default function TaskItem({ task, onComplete, onDelete, onEdit }: TaskItemProps) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 bg-white rounded-lg border transition hover:shadow-md',
        task.status === 'completed' ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onComplete(task.id)}
        className={cn(
          'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition',
          task.status === 'completed'
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 hover:border-blue-500'
        )}
      >
        {task.status === 'completed' && (
          <Check className="w-3 h-3 text-white" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-medium',
          task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
        )}>
          {task.title}
        </div>
        
        {task.description && (
          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
            {task.description}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-2">
          {/* Priority */}
          {task.priority > 0 && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              priorityColors[task.priority as keyof typeof priorityColors]
            )}>
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
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
            <span className="text-xs text-gray-500">
              📋 {task.list.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

