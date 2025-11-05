'use client'

import { useState } from 'react'
import { Folder } from '@/types'

interface FolderDialogProps {
  folder?: Folder | null
  folders: Folder[]
  onSave: (folderData: any) => void
  onClose: () => void
}

export default function FolderDialog({ folder, folders, onSave, onClose }: FolderDialogProps) {
  const [name, setName] = useState(folder?.name || '')
  const [parentId, setParentId] = useState<string | undefined>(folder?.parentId)
  const [color, setColor] = useState(folder?.color || '#3B82F6')
  const [icon, setIcon] = useState(folder?.icon || '📁')

  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#6B7280', // gray
  ]

  const icons = ['📁', '📂', '📋', '📌', '🎯', '🎨', '💼', '🏠', '🎓', '💡', '🔖', '⭐']

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入文件夹名称')
      return
    }

    const folderData = {
      name: name.trim(),
      parentId: parentId || null,
      color,
      icon,
      sortOrder: folder?.sortOrder || 0,
      isExpanded: folder?.isExpanded ?? true,
    }

    onSave(folderData)
  }

  // 过滤出可用的父文件夹（不能选择自己作为父文件夹）
  const availableParentFolders = folders.filter(f => f.id !== folder?.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 头部 */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {folder ? '编辑文件夹' : '新建文件夹'}
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
        <div className="p-6 space-y-4">
          {/* 名称 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入文件夹名称"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* 父文件夹 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">父文件夹</label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无（顶层）</option>
              {availableParentFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon} {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 图标 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">图标</label>
            <div className="grid grid-cols-6 gap-2">
              {icons.map((iconOption) => (
                <button
                  key={iconOption}
                  onClick={() => setIcon(iconOption)}
                  className={`p-3 text-2xl rounded-md transition-colors ${
                    icon === iconOption
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">颜色</label>
            <div className="grid grid-cols-8 gap-2">
              {colors.map((colorOption) => (
                <button
                  key={colorOption}
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === colorOption ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600 mb-2">预览</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className="font-medium" style={{ color }}>
                {name || '文件夹名称'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {folder ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

