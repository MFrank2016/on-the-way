'use client'

import { Task, List } from '@/types'
import { X, Calendar, Clock, Flag, Tag, Repeat } from 'lucide-react'
import { formatDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TaskDetailPanelProps {
  task: Task | null
  lists: List[]
  onClose: () => void
  onUpdate: (taskId: string, data: any) => void
  onDelete: (taskId: string) => void
}

const priorityColors = {
  0: 'text-gray-300',
  1: 'text-blue-500',
  2: 'text-yellow-500',
  3: 'text-red-500',
}

const priorityLabels = {
  0: '无优先级',
  1: '紧急',
  2: '重要',
  3: '紧急重要',
}

export default function TaskDetailPanel({ task, lists, onClose, onUpdate, onDelete }: TaskDetailPanelProps) {
  if (!task) {
    return null
  }

  return (
    <aside className="hidden xl:flex w-96 bg-white border-l border-gray-200 h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">任务详情</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 标题 */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {task.description}
            </p>
          )}
        </div>

        {/* 优先级 */}
        <div className="flex items-center gap-3">
          <Flag className={cn('w-5 h-5', priorityColors[task.priority as keyof typeof priorityColors])} />
          <div>
            <div className="text-xs text-gray-500">优先级</div>
            <div className="text-sm text-gray-900">
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </div>
          </div>
        </div>

        {/* 截止日期 */}
        {task.dueDate && (
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">截止日期</div>
              <div className="text-sm text-gray-900">
                {formatDateString(task.dueDate, task.dueTime)}
              </div>
            </div>
          </div>
        )}

        {/* 提醒时间 */}
        {task.reminderTime && (
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">提醒时间</div>
              <div className="text-sm text-gray-900">{task.reminderTime}</div>
            </div>
          </div>
        )}

        {/* 所属清单 */}
        {task.list && (
          <div className="flex items-center gap-3">
            <span className="text-xl">{task.list.icon || '📋'}</span>
            <div>
              <div className="text-xs text-gray-500">所属清单</div>
              <div className="text-sm text-gray-900">{task.list.name}</div>
            </div>
          </div>
        )}

        {/* 标签 */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-gray-400" />
              <div className="text-xs text-gray-500">标签</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                    color: tag.color || '#6b7280'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 重复规则 */}
        {task.isRecurring && (
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">重复</div>
              <div className="text-sm text-gray-900">
                {task.recurrenceType}
              </div>
            </div>
          </div>
        )}

        {/* 创建时间 */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            创建于 {new Date(task.createdAt).toLocaleString('zh-CN')}
          </div>
          {task.completedAt && (
            <div className="text-xs text-gray-500 mt-1">
              完成于 {task.completedAt}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => onDelete(task.id.toString())}
          className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
        >
          删除任务
        </button>
      </div>
    </aside>
  )
}

