'use client'

import { useState, useEffect } from 'react'
import { Filter, FilterConfigData, List, Tag, Folder } from '@/types'
import { X, Filter as FilterIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterDialogProps {
  filter?: Filter | null
  folders?: Folder[]
  lists?: List[]
  tags?: Tag[]
  onSave: (data: { name: string; icon?: string; isPinned?: boolean; filterConfig: FilterConfigData }) => void
  onClose: () => void
}

export default function FilterDialog({ filter, folders = [], lists = [], tags = [], onSave, onClose }: FilterDialogProps) {
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic')
  const [name, setName] = useState(filter?.name || '')
  const [icon, setIcon] = useState(filter?.icon || '')
  
  // 过滤条件
  const [selectedLists, setSelectedLists] = useState<number[]>(filter?.filterConfig.listIds || [])
  const [selectedTags, setSelectedTags] = useState<number[]>(filter?.filterConfig.tagIds || [])
  const [dateType, setDateType] = useState<string>(filter?.filterConfig.dateType || 'all')
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>(filter?.filterConfig.priorities || [])
  const [contentKeyword, setContentKeyword] = useState(filter?.filterConfig.contentKeyword || '')
  const [taskType, setTaskType] = useState(filter?.filterConfig.taskType || 'all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filterConfig: FilterConfigData = {
      listIds: selectedLists.length > 0 ? selectedLists : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
      dateType: dateType !== 'all' ? dateType as any : undefined,
      priorities: selectedPriorities.length > 0 ? selectedPriorities : undefined,
      contentKeyword: contentKeyword || undefined,
      taskType: taskType !== 'all' ? taskType as any : undefined,
    }

    onSave({
      name,
      icon,
      filterConfig,
    })
  }

  const toggleList = (listId: number) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const togglePriority = (priority: number) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    )
  }

  const priorityLabels: Record<number, string> = {
    0: '无',
    1: '低',
    2: '中',
    3: '高',
  }

  const dateOptions = [
    { value: 'all', label: '所有' },
    { value: 'noDate', label: '无日期' },
    { value: 'overdue', label: '已过期' },
    { value: 'today', label: '今天' },
    { value: 'tomorrow', label: '明天' },
  ]

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {filter ? '编辑过滤器' : '添加过滤器'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('basic')}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition',
                mode === 'basic'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              普通
            </button>
            <button
              type="button"
              onClick={() => setMode('advanced')}
              className={cn(
                'px-4 py-2 text-sm rounded-lg transition',
                mode === 'advanced'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              高级
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              <FilterIcon className="w-4 h-4 inline mr-2" />
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          {/* Lists */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">清单</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {lists.map((list) => (
                  <label key={list.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedLists.includes(list.id)}
                      onChange={() => toggleList(list.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-900">{list.icon} {list.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedLists.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                已选择 {selectedLists.length} 个清单
              </div>
            )}
          </div>

          {/* Tags */}
          {mode === 'advanced' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">标签</label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-full transition',
                        selectedTags.includes(tag.id)
                          ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  已选择 {selectedTags.length} 个标签
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">日期</label>
            <div className="border border-gray-300 rounded-lg p-3">
              <div className="space-y-2">
                {dateOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="radio"
                      name="dateType"
                      value={option.value}
                      checked={dateType === option.value}
                      onChange={(e) => setDateType(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">优先级</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePriority(priority)}
                  className={cn(
                    'flex-1 py-2 text-sm rounded-lg transition',
                    selectedPriorities.includes(priority)
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  )}
                >
                  {priorityLabels[priority]}
                </button>
              ))}
            </div>
          </div>

          {/* Content Keyword */}
          {mode === 'advanced' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">内容包含</label>
              <input
                type="text"
                value={contentKeyword}
                onChange={(e) => setContentKeyword(e.target.value)}
                placeholder="输入任务关键词"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Task Type */}
          {mode === 'advanced' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">任务类型</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: '所有' },
                  { value: 'task', label: '任务' },
                  { value: 'note', label: '笔记' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTaskType(option.value)}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg transition',
                      taskType === option.value
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

