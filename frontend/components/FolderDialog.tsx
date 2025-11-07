'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Folder } from '@/types'
import EmojiPickerButton from './EmojiPickerButton'
import ColorPicker from './ColorPicker'

interface FolderDialogProps {
  folder?: Folder | null
  folders: Folder[]
  onSave: (folderData: any) => void
  onClose: () => void
}

export default function FolderDialog({ folder, folders, onSave, onClose }: FolderDialogProps) {
  const [name, setName] = useState(folder?.name || '')
  const [icon, setIcon] = useState(folder?.icon || '📁')
  const [color, setColor] = useState(folder?.color || '#3B82F6')

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入文件夹名称')
      return
    }

    const folderData = {
      name: name.trim(),
      icon,
      color,
      sortOrder: folder?.sortOrder || 0,
      isExpanded: folder?.isExpanded ?? true,
    }

    onSave(folderData)
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 头部 */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {folder ? '编辑文件夹' : '添加文件夹'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 图标和名称 */}
          <div className="flex items-center gap-3">
            <EmojiPickerButton value={icon} onChange={setIcon} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名称"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              autoFocus
            />
          </div>

          {/* 颜色选择 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              颜色
            </label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {folder ? '保存' : '添加'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
