'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { List, Folder } from '@/types'
import EmojiPickerButton from './EmojiPickerButton'
import ColorPicker from './ColorPicker'
import ViewTypeSelector from './ViewTypeSelector'
import FolderDialog from './FolderDialog'

interface ListDialogProps {
  list?: List | null
  folders: Folder[]
  onSave: (listData: any) => void
  onClose: () => void
  onFoldersUpdate?: () => void
}

export default function ListDialog({ list, folders, onSave, onClose, onFoldersUpdate }: ListDialogProps) {
  const [name, setName] = useState(list?.name || '')
  const [icon, setIcon] = useState(list?.icon || '📋')
  const [color, setColor] = useState(list?.color || '#3B82F6')
  const [viewType, setViewType] = useState<'list' | 'kanban' | 'timeline'>(list?.viewType || 'list')
  const [folderId, setFolderId] = useState<number | undefined>(list?.folderId || undefined)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders)

  // 当 folders prop 更新时，同步更新本地状态
  useEffect(() => {
    setLocalFolders(folders)
  }, [folders])

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
      viewType,
      folderId: folderId || null,
      type: 'custom',
      isSystem: false,
      isDefault: false,
    })
  }

  const handleFolderSave = async (folderData: any) => {
    try {
      // 调用 API 创建文件夹
      const { folderAPI } = await import('@/lib/api')
      const response = await folderAPI.createFolder(folderData)
      
      // 创建成功后更新文件夹列表
      setShowFolderDialog(false)
      if (onFoldersUpdate) {
        await onFoldersUpdate()
      }
      
      // 自动选中新创建的文件夹
      if (response.data.data?.id) {
        setFolderId(response.data.data.id)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert('创建文件夹失败')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {list ? '编辑清单' : '添加清单'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                颜色
              </label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            {/* 视图类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                视图
              </label>
              <ViewTypeSelector value={viewType} onChange={setViewType} />
            </div>

            {/* 文件夹选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                文件夹
              </label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">无</option>
                {localFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowFolderDialog(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                + 添加文件夹
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {list ? '保存' : '添加'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 文件夹创建对话框 */}
      {showFolderDialog && (
        <FolderDialog
          folders={localFolders}
          onSave={handleFolderSave}
          onClose={() => setShowFolderDialog(false)}
        />
      )}
    </>
  )
}
