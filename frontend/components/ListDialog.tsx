'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { List, Folder } from '@/types'
import { cn } from '@/lib/utils'

interface ListDialogProps {
  list?: List | null
  folders: Folder[]
  onSave: (listData: any) => void
  onClose: () => void
}

const iconOptions = [
  '📋', '📝', '✅', '📌', '🎯', '💼', '🏠', '🎓', 
  '💡', '🎨', '🔧', '📱', '💻', '📚', '🎵', '🏃'
]

const colorOptions = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
  '#8B5CF6', '#EC4899', '#F97316', '#14B8A6', '#06B6D4',
  '#6B7280', '#000000'
]

export default function ListDialog({ list, folders, onSave, onClose }: ListDialogProps) {
  const [name, setName] = useState(list?.name || '')
  const [icon, setIcon] = useState(list?.icon || '📋')
  const [color, setColor] = useState(list?.color || '#3B82F6')
  const [folderId, setFolderId] = useState<number | undefined>(list?.folderId || undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('请输入清单名称')
      return
    }

    onSave({
      name: name.trim(),
      icon,
      color,
      folderId: folderId || null,
      type: 'custom',
      isSystem: false,
      isDefault: false,
    })
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {list ? '编辑清单' : '新建清单'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 清单名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              清单名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入清单名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              autoFocus
            />
          </div>

          {/* 图标选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图标
            </label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map((iconOption) => (
                <button
                  key={iconOption}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-xl rounded-lg border-2 transition',
                    icon === iconOption
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              颜色
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition',
                    color === colorOption
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* 上级文件夹 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上级文件夹（可选）
            </label>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">无（根目录）</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              {list ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

