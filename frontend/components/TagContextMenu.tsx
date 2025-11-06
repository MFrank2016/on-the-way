'use client'

import { useEffect, useRef } from 'react'
import { Edit2, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { Tag } from '@/types'

interface TagContextMenuProps {
  tag: Tag
  position: { x: number; y: number }
  onEdit: () => void
  onTogglePin: () => void
  onAddChild: () => void
  onDelete: () => void
  onClose: () => void
}

export default function TagContextMenu({
  tag,
  position,
  onEdit,
  onTogglePin,
  onAddChild,
  onDelete,
  onClose
}: TagContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // 调整菜单位置，确保不超出屏幕
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = position.x
      let adjustedY = position.y

      if (position.x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      if (position.y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [position])

  const menuItems = [
    {
      icon: Edit2,
      label: '编辑',
      onClick: () => {
        onEdit()
        onClose()
      }
    },
    {
      icon: tag.isPinned ? PinOff : Pin,
      label: tag.isPinned ? '取消置顶' : '置顶',
      onClick: () => {
        onTogglePin()
        onClose()
      }
    },
    {
      icon: Plus,
      label: '添加子标签',
      onClick: () => {
        onAddChild()
        onClose()
      }
    },
    {
      icon: Trash2,
      label: '删除',
      onClick: () => {
        onDelete()
        onClose()
      },
      className: 'text-red-600 hover:bg-red-50'
    }
  ]

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item, index) => {
        const Icon = item.icon
        return (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              item.className || 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

