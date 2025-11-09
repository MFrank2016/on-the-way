'use client'

import { useState, useEffect, useRef } from 'react'
import { Task, List, RecurrenceRule } from '@/types'
import DateTimePicker from './DateTimePicker'
import RecurrencePicker from './RecurrencePicker'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { fromDateString, fromTimeString, fromDateTimeString, toDateString, toTimeString, combineDateAndTime } from '@/lib/utils'

interface TaskDialogProps {
  task?: Task | null
  lists: List[]
  onSave: (taskData: any) => void
  onClose: () => void
}

export default function TaskDialog({ task, lists, onSave, onClose }: TaskDialogProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [listId, setListId] = useState(
    task?.listId || 
    lists.find(l => l.isDefault)?.id || 
    lists[0]?.id || 
    ''
  )
  const [priority, setPriority] = useState(task?.priority || 0)
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    if (!task?.dueDate) return undefined
    const date = fromDateString(task.dueDate)
    if (!date) return undefined
    
    // 如果有时间，合并时间
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number)
      date.setHours(hours, minutes)
    }
    return date
  })
  const [hasTime, setHasTime] = useState(!!task?.dueTime) // 是否设置了时间
  const [reminderTime, setReminderTime] = useState<Date | undefined>(
    task?.reminderTime ? fromDateTimeString(task.reminderTime) || undefined : undefined
  )
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    task?.isRecurring ? {
      type: task.recurrenceType as any,
      interval: task.recurrenceInterval || 1,
      weekdays: task.recurrenceWeekdays ? JSON.parse(task.recurrenceWeekdays) : undefined,
      monthDay: task.recurrenceMonthDay,
      lunarDate: task.recurrenceLunarDate,
      endDate: task.recurrenceEndDate,
    } : null
  )

  const [showDuePicker, setShowDuePicker] = useState(false)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false)
  const [showReminderOptions, setShowReminderOptions] = useState(false)

  const duePickerRef = useRef<HTMLDivElement>(null)
  const reminderPickerRef = useRef<HTMLDivElement>(null)
  const reminderOptionsRef = useRef<HTMLDivElement>(null)

  // ESC键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDuePicker) setShowDuePicker(false)
        else if (showReminderPicker) setShowReminderPicker(false)
        else if (showReminderOptions) setShowReminderOptions(false)
        else if (showRecurrencePicker) setShowRecurrencePicker(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [showDuePicker, showReminderPicker, showReminderOptions, showRecurrencePicker])

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (duePickerRef.current && !duePickerRef.current.contains(e.target as Node)) {
        setShowDuePicker(false)
      }
      if (reminderPickerRef.current && !reminderPickerRef.current.contains(e.target as Node)) {
        setShowReminderPicker(false)
      }
      if (reminderOptionsRef.current && !reminderOptionsRef.current.contains(e.target as Node)) {
        setShowReminderOptions(false)
      }
    }
    
    if (showDuePicker || showReminderPicker || showReminderOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDuePicker, showReminderPicker, showReminderOptions])

  const priorityOptions = [
    { value: 0, label: '不重要不紧急', color: 'bg-gray-100 text-gray-700' },
    { value: 1, label: '不重要但紧急', color: 'bg-yellow-100 text-yellow-700' },
    { value: 2, label: '重要不紧急', color: 'bg-blue-100 text-blue-700' },
    { value: 3, label: '重要且紧急', color: 'bg-red-100 text-red-700' },
  ]

  const reminderQuickOptions = [
    { label: '准时', offset: 0 },
    { label: '提前5分钟', offset: 5 },
    { label: '提前30分钟', offset: 30 },
    { label: '提前1小时', offset: 60 },
    { label: '提前1天', offset: 1440 },
  ]

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入任务标题')
      return
    }

    if (!listId) {
      alert('请选择清单')
      return
    }

    const taskData: any = {
      title: title.trim(),
      description,
      listId,
      priority,
      dueDate: dueDate ? toDateString(dueDate) : '',
      dueTime: (dueDate && hasTime) ? toTimeString(dueDate) : '',
      reminderTime: reminderTime ? combineDateAndTime(toDateString(reminderTime), toTimeString(reminderTime)) : '',
      isRecurring: !!recurrenceRule,
      recurrenceType: '',
      recurrenceInterval: 1,
      recurrenceWeekdays: '',
      recurrenceMonthDay: 0,
      recurrenceLunarDate: '',
      recurrenceEndDate: '',
    }

    if (recurrenceRule) {
      taskData.recurrenceType = recurrenceRule.type
      taskData.recurrenceInterval = recurrenceRule.interval || 1
      taskData.recurrenceWeekdays = recurrenceRule.weekdays ? JSON.stringify(recurrenceRule.weekdays) : ''
      taskData.recurrenceMonthDay = recurrenceRule.monthDay || 0
      taskData.recurrenceLunarDate = recurrenceRule.lunarDate || ''
      taskData.recurrenceEndDate = recurrenceRule.endDate || ''
    }

    onSave(taskData)
  }

  const handleQuickReminder = (offsetMinutes: number) => {
    if (dueDate) {
      const reminder = new Date(dueDate)
      reminder.setMinutes(reminder.getMinutes() - offsetMinutes)
      setReminderTime(reminder)
      setShowReminderOptions(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ width: '640px', maxWidth: '95vw' }}>
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? '编辑任务' : '新建任务'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 标题 */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="任务标题"
              className="w-full px-4 py-3 text-lg text-gray-700 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* 描述 */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加描述..."
              rows={3}
              className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 清单选择 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">清单</label>
            <div className="relative">
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem',
                  paddingRight: '2.5rem'
                }}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.icon} {list.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 优先级 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">优先级</label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPriority(option.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    priority === option.value
                      ? option.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 截止时间 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">截止时间</label>
            <div
              onClick={() => setShowDuePicker(!showDuePicker)}
              className="w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm text-gray-700">
                {dueDate ? format(dueDate, hasTime ? 'yyyy年MM月dd日 HH:mm' : 'yyyy年MM月dd日', { locale: zhCN }) : '设置截止时间'}
              </span>
              {dueDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDueDate(undefined)
                    setHasTime(false)
                    setReminderTime(undefined)
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {showDuePicker && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-10" onClick={() => setShowDuePicker(false)}>
                <div ref={duePickerRef} onClick={(e) => e.stopPropagation()}>
                  <DateTimePicker
                    value={dueDate}
                    onChange={(date, hasTimeValue) => {
                      setDueDate(date)
                      setHasTime(hasTimeValue || false)
                      setShowDuePicker(false)
                    }}
                    onClose={() => setShowDuePicker(false)}
                    initialHasTime={hasTime}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 提醒时间 */}
          {dueDate && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">提醒时间</label>
              <div
                onClick={() => setShowReminderOptions(!showReminderOptions)}
                className="w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm text-gray-700">
                  {reminderTime ? format(reminderTime, 'yyyy年MM月dd日 HH:mm', { locale: zhCN }) : '设置提醒'}
                </span>
                {reminderTime && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setReminderTime(undefined)
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {showReminderOptions && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-10" onClick={() => setShowReminderOptions(false)}>
                  <div ref={reminderOptionsRef} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64">
                    <div className="space-y-2">
                      {reminderQuickOptions.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => handleQuickReminder(option.offset)}
                          className="w-full px-4 py-2.5 text-sm text-left text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowReminderOptions(false)
                          setShowReminderPicker(true)
                        }}
                        className="w-full px-4 py-2.5 text-sm text-left rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium"
                      >
                        自定义时间
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showReminderPicker && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-10" onClick={() => setShowReminderPicker(false)}>
                  <div ref={reminderPickerRef} onClick={(e) => e.stopPropagation()}>
                    <DateTimePicker
                      value={reminderTime}
                      onChange={(date) => {
                        setReminderTime(date)
                        setShowReminderPicker(false)
                      }}
                      onClose={() => setShowReminderPicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 重复模式 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">重复</label>
            <div
              onClick={() => setShowRecurrencePicker(true)}
              className="w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm text-gray-700">
                {recurrenceRule ? `${getRecurrenceLabel(recurrenceRule)}` : '不重复'}
              </span>
              {recurrenceRule && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRecurrenceRule(null)
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {showRecurrencePicker && (
              <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-[60] p-4">
                <RecurrencePicker
                  value={recurrenceRule || undefined}
                  onChange={(rule) => {
                    setRecurrenceRule(rule)
                    setShowRecurrencePicker(false)
                  }}
                  onClose={() => setShowRecurrencePicker(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {task ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getRecurrenceLabel(rule: RecurrenceRule): string {
  const typeLabels: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
    workday: '工作日',
    holiday: '节假日',
    lunar_monthly: '农历每月',
    lunar_yearly: '农历每年',
    custom: '自定义',
  }

  const label = typeLabels[rule.type] || '重复'
  if (rule.interval > 1) {
    return `每${rule.interval}${label.replace('每', '')}`
  }
  return label
}

