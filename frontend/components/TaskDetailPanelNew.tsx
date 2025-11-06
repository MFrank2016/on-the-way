'use client'

import { Task, List, Tag } from '@/types'
import { useState, useMemo, useCallback } from 'react'
import { X, Check, Flag, Calendar, Repeat, Tag as TagIcon, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatDateString, toDateString, toTimeString } from '@/lib/utils'
import { cn } from '@/lib/utils'
import InlineEditableTitle from './InlineEditableTitle'
import RichTextEditor from './RichTextEditor'
import DateTimeReminderPicker from './DateTimeReminderPicker'

interface TaskDetailPanelNewProps {
  task: Task | null
  lists: List[]
  tags: Tag[]
  onClose: () => void
  onUpdate: (taskId: string, data: any) => void
  onDelete: (taskId: string) => void
  onComplete: (taskId: string) => void
}

const priorityOptions = [
  { value: 0, label: '无优先级', color: 'text-gray-400', icon: '🏳️' },
  { value: 1, label: '低优先级', color: 'text-blue-500', icon: '🔵' },
  { value: 2, label: '中优先级', color: 'text-yellow-500', icon: '🟡' },
  { value: 3, label: '高优先级', color: 'text-red-500', icon: '🔴' },
]

export default function TaskDetailPanelNew({ 
  task, 
  lists, 
  tags,
  onClose, 
  onUpdate, 
  onDelete,
  onComplete 
}: TaskDetailPanelNewProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showListMenu, setShowListMenu] = useState(false)
  const [showTagMenu, setShowTagMenu] = useState(false)

  // 防抖保存函数
  const debouncedUpdate = useMemo(() => {
    let timer: NodeJS.Timeout
    return (taskId: string, data: any) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        onUpdate(taskId, data)
      }, 800)
    }
  }, [onUpdate])

  const handleTitleChange = useCallback((title: string) => {
    if (task) {
      debouncedUpdate(task.id.toString(), { title })
    }
  }, [task, debouncedUpdate])

  const handleDescriptionChange = useCallback((description: string) => {
    if (task) {
      debouncedUpdate(task.id.toString(), { description })
    }
  }, [task, debouncedUpdate])

  const handleDateChange = (value: any) => {
    if (task && value) {
      const updateData: any = {
        dueDate: value.date ? toDateString(value.date) : '',
        dueTime: value.time || '',
        reminderTime: '', // 清空提醒时间
        isRecurring: false, // 清空重复任务设置
        recurrenceType: '',
        recurrenceInterval: 1,
        recurrenceWeekdays: '',
        recurrenceMonthDay: 0,
        recurrenceEndDate: '',
      }

      // 如果有重复设置
      if (value.recurrence) {
        updateData.isRecurring = true
        updateData.recurrenceType = value.recurrence.type
        updateData.recurrenceInterval = value.recurrence.interval || 1
        updateData.recurrenceWeekdays = value.recurrence.weekdays ? JSON.stringify(value.recurrence.weekdays) : ''
        updateData.recurrenceMonthDay = value.recurrence.monthDay || 0
        updateData.recurrenceEndDate = value.recurrence.endDate || ''
      }

      onUpdate(task.id.toString(), updateData)
    }
    setShowDatePicker(false)
  }

  const handlePriorityChange = (priority: number) => {
    if (task) {
      onUpdate(task.id.toString(), { priority })
    }
    setShowPriorityMenu(false)
  }

  const handleListChange = (listId: number) => {
    if (task) {
      onUpdate(task.id.toString(), { listId })
    }
    setShowListMenu(false)
  }


  if (!task) {
    return null
  }

  const currentPriority = priorityOptions.find(p => p.value === task.priority) || priorityOptions[0]

  return (
    <aside className="hidden xl:flex w-96 bg-white border-l border-gray-200 h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {/* 复选框 */}
        <button
          onClick={() => onComplete(task.id.toString())}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition',
            task.status === 'completed'
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-500'
          )}
        >
          {task.status === 'completed' && (
            <Check className="w-4 h-4 text-white" />
          )}
        </button>

        {/* 截止日期 */}
        {task.dueDate && (
          <button 
            onClick={() => setShowDatePicker(true)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
          >
            <Calendar className="w-4 h-4 text-red-500" />
            <span>{formatDateString(task.dueDate, task.dueTime)}</span>
          </button>
        )}

        {/* 优先级旗帜 */}
        <div className="relative">
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <Flag className={cn('w-5 h-5', currentPriority.color)} />
          </button>

          {showPriorityMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePriorityChange(option.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <Flag className={cn('w-4 h-4', option.color)} />
                  <span className={option.color}>{option.label}</span>
                  {task.priority === option.value && <Check className="w-4 h-4 ml-auto text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 标题编辑 */}
        <InlineEditableTitle
          value={task.title}
          onChange={handleTitleChange}
          className="text-xl font-semibold"
          placeholder="任务标题"
        />

        {/* 富文本描述编辑 */}
        <div>
          <div className="text-xs text-gray-500 mb-2">描述</div>
          <RichTextEditor
            content={task.description || ''}
            onChange={handleDescriptionChange}
            placeholder="添加描述..."
          />
        </div>

        {/* 日期时间（展开式） */}
        <div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1 text-left">
              <div className="text-xs text-gray-500">日期</div>
              <div className="text-sm text-gray-900">
                {task.dueDate ? formatDateString(task.dueDate, task.dueTime) : '设置日期'}
              </div>
            </div>
          </button>

          {/* 展开式日期时间选择器 */}
          {showDatePicker && (
            <div className="mt-2">
              <DateTimeReminderPicker
                value={{
                  date: task.dueDate ? (() => {
                    const dateStr = task.dueDate
                    const year = parseInt(dateStr.substring(0, 4))
                    const month = parseInt(dateStr.substring(4, 6)) - 1
                    const day = parseInt(dateStr.substring(6, 8))
                    const date = new Date(year, month, day)
                    if (task.dueTime) {
                      const [hours, minutes] = task.dueTime.split(':').map(Number)
                      date.setHours(hours, minutes)
                    }
                    return date
                  })() : undefined,
                  time: task.dueTime || undefined,
                  recurrence: task.isRecurring ? {
                    type: task.recurrenceType as any,
                    interval: task.recurrenceInterval || 1,
                    weekdays: task.recurrenceWeekdays ? JSON.parse(task.recurrenceWeekdays) : undefined,
                    monthDay: task.recurrenceMonthDay || undefined,
                    endDate: task.recurrenceEndDate || undefined,
                  } : undefined,
                }}
                onChange={handleDateChange}
                onClose={() => setShowDatePicker(false)}
              />
            </div>
          )}
        </div>

        {/* 所属清单 */}
        <div className="relative">
          <button
            onClick={() => setShowListMenu(!showListMenu)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="text-xl">{task.list?.icon || '📋'}</span>
            <div className="flex-1 text-left">
              <div className="text-xs text-gray-500">清单</div>
              <div className="text-sm text-gray-900">{task.list?.name || 'Inbox'}</div>
            </div>
          </button>

          {showListMenu && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleListChange(list.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition"
                >
                  <span className="text-lg">{list.icon || '📋'}</span>
                  <span className="flex-1 text-left">{list.name}</span>
                  {task.listId === list.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 标签 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="w-5 h-5 text-gray-400" />
            <div className="text-xs text-gray-500">标签</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.tags && task.tags.map((tag) => (
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
            <button className="text-xs px-2 py-1 text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 rounded hover:border-blue-400 transition">
              + 添加标签
            </button>
          </div>
        </div>

        {/* 创建和完成时间 */}
        <div className="pt-4 border-t border-gray-200 space-y-1">
          <div className="text-xs text-gray-500">
            创建于 {new Date(task.createdAt).toLocaleString('zh-CN')}
          </div>
          {task.completedAt && (
            <div className="text-xs text-gray-500">
              完成于 {task.completedAt}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (confirm('确定要删除这个任务吗？')) {
              onDelete(task.id.toString())
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>删除任务</span>
        </button>
      </div>
    </aside>
  )
}

