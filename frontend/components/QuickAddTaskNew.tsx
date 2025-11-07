'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Calendar, ChevronDown, Flag, Tag as TagIcon, List as ListIcon, Clock } from 'lucide-react'
import DateTimePicker from './DateTimePicker'
import RecurrencePicker, { RecurrenceRule } from './RecurrencePicker'
import { toDateString, toTimeString } from '@/lib/utils'

interface QuickAddTaskProps {
  onAdd: (data: {
    title: string
    dueDate?: string  // 格式：20251105
    dueTime?: string  // 格式：18:20
    priority?: number
    tagIds?: number[]
    listId?: number
    recurrence?: RecurrenceRule
  }) => Promise<void>
  placeholder?: string
  lists?: any[]
  tags?: any[]
  defaultDueDate?: Date
  defaultListId?: number
  compact?: boolean  // 精简模式，用于看板等空间有限的场景
  onCancel?: () => void  // 取消回调，用于精简模式
}

export default function QuickAddTask({ 
  onAdd, 
  placeholder = '添加任务...', 
  lists = [], 
  tags = [], 
  defaultDueDate,
  defaultListId,
  compact = false,
  onCancel
}: QuickAddTaskProps) {
  const [isExpanded, setIsExpanded] = useState(compact) // 精简模式下默认展开
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showRecurrence, setShowRecurrence] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultDueDate)
  const [hasTime, setHasTime] = useState(false) // 是否设置了时间
  const [priority, setPriority] = useState(0)
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [selectedList, setSelectedList] = useState<number | undefined>(defaultListId)
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const moreOptionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && compact && onCancel) {
      onCancel()
    }
  }

  // 当 defaultDueDate 变化时更新内部状态
  useEffect(() => {
    setDueDate(defaultDueDate)
  }, [defaultDueDate])

  // 当 defaultListId 变化时更新内部状态
  useEffect(() => {
    setSelectedList(defaultListId)
  }, [defaultListId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false)
      }
    }

    if (showMoreOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMoreOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onAdd({
        title,
        dueDate: dueDate ? toDateString(dueDate) : undefined,
        dueTime: (dueDate && hasTime) ? toTimeString(dueDate) : undefined,
        priority,
        tagIds: selectedTags,
        listId: selectedList,
        recurrence: recurrence || undefined,
      })
      
      // Reset
      setTitle('')
      setDueDate(defaultDueDate)
      setHasTime(false)
      setPriority(0)
      setSelectedTags([])
      setSelectedList(defaultListId)
      setRecurrence(null)
      setIsExpanded(false)
      setShowMoreOptions(false)
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setLoading(false)
    }
  }

  const priorityColors = {
    0: 'text-gray-300',
    1: 'text-blue-500',
    2: 'text-yellow-500',
    3: 'text-red-500',
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 w-full border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition text-gray-600 text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>{placeholder}</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative bg-white rounded-lg border border-blue-400 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Priority Flag */}
        <button
          type="button"
          onClick={() => setPriority((priority + 1) % 4)}
          className="flex-shrink-0"
        >
          <Flag className={`w-4 h-4 ${priorityColors[priority as keyof typeof priorityColors]}`} />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="任务名称"
          className="flex-1 text-sm outline-none text-gray-900 placeholder:text-gray-400"
        />

        {/* Date Picker Icon */}
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`flex-shrink-0 p-1 rounded hover:bg-gray-100 ${dueDate ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* More Options */}
        <div className="relative" ref={moreOptionsRef}>
          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {showMoreOptions && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* Priority Selection */}
              <div className="px-3 py-2">
                <div className="text-xs text-gray-600 mb-2">优先级</div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1 px-2 text-xs rounded ${
                        priority === p ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Flag className={`w-3 h-3 mx-auto ${priorityColors[p as keyof typeof priorityColors]}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Selection */}
              {tags.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600 mb-2">标签</div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          if (selectedTags.includes(tag.id)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag.id))
                          } else {
                            setSelectedTags([...selectedTags, tag.id])
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* List Selection */}
              {lists.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-100">
                  <div className="text-xs text-gray-600 mb-2">清单</div>
                  <select
                    value={selectedList || ''}
                    onChange={(e) => setSelectedList(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">默认收件箱</option>
                    {lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recurrence */}
              <div className="px-3 py-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRecurrence(!showRecurrence)}
                  className="w-full text-left text-xs text-gray-600 hover:text-blue-600"
                >
                  {recurrence ? `重复: ${recurrence.type}` : '设置重复'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit - 精简模式下隐藏 */}
        {!compact && (
          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="flex-shrink-0 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '添加中' : '添加'}
          </button>
        )}

        {/* Cancel - 精简模式下隐藏 */}
        {!compact && (
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false)
              setTitle('')
              setDueDate(defaultDueDate)
              setHasTime(false)
              setPriority(0)
              setSelectedTags([])
              setSelectedList(defaultListId)
              setRecurrence(null)
            }}
            className="flex-shrink-0 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition"
          >
            取消
          </button>
        )}
      </div>

      {/* Date Picker Popup */}
      {showDatePicker && (
        <div className="absolute right-0 top-full mt-1 z-50">
          <DateTimePicker
            value={dueDate}
            onChange={(date, hasTimeValue) => {
              setDueDate(date)
              setHasTime(hasTimeValue || false)
              setShowDatePicker(false)
            }}
            onClose={() => setShowDatePicker(false)}
            initialHasTime={hasTime}
          />
        </div>
      )}

      {/* Recurrence Picker Popup */}
      {showRecurrence && (
        <div className="absolute right-0 top-full mt-1 z-50">
          <RecurrencePicker
            value={recurrence || undefined}
            onChange={(rule) => {
              setRecurrence(rule)
              setShowRecurrence(false)
            }}
            onClose={() => setShowRecurrence(false)}
          />
        </div>
      )}
    </form>
  )
}

