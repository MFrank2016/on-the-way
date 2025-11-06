'use client'

import { useState } from 'react'
import { ChevronRight, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tag } from '@/types'
import TagContextMenu from './TagContextMenu'

interface TagTreeProps {
  tags: Tag[]
  selectedTagId?: number
  onTagClick: (tag: Tag) => void
  onTagEdit: (tag: Tag) => void
  onTagTogglePin: (tag: Tag) => void
  onTagAddChild: (parentTag: Tag) => void
  onTagDelete: (tag: Tag) => void
}

interface TagNodeProps {
  tag: Tag
  level: number
  selectedTagId?: number
  onTagClick: (tag: Tag) => void
  onTagEdit: (tag: Tag) => void
  onTagTogglePin: (tag: Tag) => void
  onTagAddChild: (parentTag: Tag) => void
  onTagDelete: (tag: Tag) => void
}

function TagNode({
  tag,
  level,
  selectedTagId,
  onTagClick,
  onTagEdit,
  onTagTogglePin,
  onTagAddChild,
  onTagDelete
}: TagNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  const hasChildren = tag.children && tag.children.length > 0
  const isSelected = selectedTagId === tag.id

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTagClick(tag)
  }

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronRight
              className={cn(
                'w-3 h-3 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Tag Icon with Color */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: tag.color || '#6B7280' }}
        />

        {/* Tag Name */}
        <span className="flex-1 text-sm truncate">
          {tag.name}
        </span>

        {/* Pin Indicator */}
        {tag.isPinned && (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {tag.children!.map((child) => (
            <TagNode
              key={child.id}
              tag={child}
              level={level + 1}
              selectedTagId={selectedTagId}
              onTagClick={onTagClick}
              onTagEdit={onTagEdit}
              onTagTogglePin={onTagTogglePin}
              onTagAddChild={onTagAddChild}
              onTagDelete={onTagDelete}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <TagContextMenu
          tag={tag}
          position={contextMenu}
          onEdit={() => onTagEdit(tag)}
          onTogglePin={() => onTagTogglePin(tag)}
          onAddChild={() => onTagAddChild(tag)}
          onDelete={() => onTagDelete(tag)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

export default function TagTree({
  tags,
  selectedTagId,
  onTagClick,
  onTagEdit,
  onTagTogglePin,
  onTagAddChild,
  onTagDelete
}: TagTreeProps) {
  // 只显示顶层标签
  const rootTags = tags.filter(tag => !tag.parentId)

  if (rootTags.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-gray-500">
        暂无标签
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {rootTags.map((tag) => (
        <TagNode
          key={tag.id}
          tag={tag}
          level={0}
          selectedTagId={selectedTagId}
          onTagClick={onTagClick}
          onTagEdit={onTagEdit}
          onTagTogglePin={onTagTogglePin}
          onTagAddChild={onTagAddChild}
          onTagDelete={onTagDelete}
        />
      ))}
    </div>
  )
}

