'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, Plus } from 'lucide-react'
import { Tag } from '@/types'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onSelect: (tagIds: number[]) => void
  onClose: () => void
  onCreateTag?: (name: string) => Promise<Tag>
}

export default function TagSelector({ tags, selectedTagIds, onSelect, onClose, onCreateTag }: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedTagIds)
  const [creating, setCreating] = useState(false)
  const [showCreateHint, setShowCreateHint] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 扁平化所有标签（包括子标签）
  const flattenTags = (tags: Tag[]): Tag[] => {
    const result: Tag[] = []
    const flatten = (tags: Tag[]) => {
      for (const tag of tags) {
        result.push(tag)
        if (tag.children && tag.children.length > 0) {
          flatten(tag.children)
        }
      }
    }
    flatten(tags)
    return result
  }

  const allTags = flattenTags(tags)

  // 搜索过滤
  const filteredTags = searchQuery
    ? allTags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allTags

  const handleToggleTag = (tagId: number) => {
    if (localSelectedIds.includes(tagId)) {
      setLocalSelectedIds(localSelectedIds.filter(id => id !== tagId))
    } else {
      setLocalSelectedIds([...localSelectedIds, tagId])
    }
  }

  const handleConfirm = () => {
    onSelect(localSelectedIds)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const handleCreateTag = async () => {
    if (!searchQuery.trim() || !onCreateTag) return
    
    setCreating(true)
    try {
      const newTag = await onCreateTag(searchQuery.trim())
      // 自动选中新创建的标签
      setLocalSelectedIds([...localSelectedIds, newTag.id])
      setSearchQuery('')
      setShowCreateHint(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && filteredTags.length === 0 && onCreateTag) {
      e.preventDefault()
      handleCreateTag()
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ESC关闭
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // 显示创建提示
  useEffect(() => {
    if (searchQuery.trim() && filteredTags.length === 0 && onCreateTag) {
      setShowCreateHint(true)
    } else {
      setShowCreateHint(false)
    }
  }, [searchQuery, filteredTags.length, onCreateTag])

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[600px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">选择标签</h2>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索标签..."
              className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {showCreateHint && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              按 Enter 键创建新标签 "{searchQuery}"
            </div>
          )}
        </div>

        {/* Tag List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredTags.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                onCreateTag ? (
                  <div className="space-y-3">
                    <div className="text-gray-400">未找到匹配的标签</div>
                    <button
                      onClick={handleCreateTag}
                      disabled={creating}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      {creating ? '创建中...' : `创建标签 "${searchQuery}"`}
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">未找到匹配的标签</div>
                )
              ) : (
                <div className="text-gray-400">暂无标签</div>
              )}
            </div>
          ) : (
            filteredTags.map((tag) => {
              const isSelected = localSelectedIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  )}
                >
                  {/* Color Dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  />

                  {/* Tag Name */}
                  <span className="flex-1 text-left text-sm text-gray-900">
                    {tag.name}
                  </span>

                  {/* Check Icon */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Selected Count */}
        {localSelectedIds.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              已选择 {localSelectedIds.length} 个标签
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

