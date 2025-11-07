'use client'

import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Folder, List } from '@/types'

interface FolderTreeProps {
  folders: Folder[]
  lists: List[]
  selectedListId?: number
  onFolderClick?: (folder: Folder) => void
  onListClick?: (list: List) => void
  onFolderEdit?: (folder: Folder) => void
  onFolderDelete?: (folder: Folder) => void
  onListEdit?: (list: List) => void
  onListDelete?: (list: List) => void
  onToggleExpand?: (folderId: string) => void
}

export default function FolderTree({
  folders,
  lists,
  selectedListId,
  onFolderClick,
  onListClick,
  onFolderEdit,
  onFolderDelete,
  onListEdit,
  onListDelete,
  onToggleExpand,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
    new Set(folders.filter(f => f.isExpanded).map(f => f.id))
  )

  // 调试：打印 lists 数据
  useEffect(() => {
    console.log('FolderTree lists updated:', lists.map(l => ({ id: l.id, name: l.name, todoCount: l.todoCount })))
  }, [lists])
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: Folder | List
    type: 'folder' | 'list'
  } | null>(null)

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
    onToggleExpand?.(folderId.toString())
  }

  const handleContextMenu = (e: React.MouseEvent, item: Folder | List, type: 'folder' | 'list') => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  // 渲染单个文件夹（平级结构）
  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders.has(folder.id)
    const folderLists = lists.filter(l => l.folderId === folder.id)

    return (
      <div key={folder.id}>
        {/* 文件夹项 */}
        <div
          className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
          onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <ChevronRight
              className={cn(
                'w-4 h-4 text-gray-500 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
          <span className="text-lg">{folder.icon}</span>
          <span
            className="flex-1 text-sm font-medium truncate"
            style={{ color: folder.color }}
            onClick={() => onFolderClick?.(folder)}
          >
            {folder.name}
          </span>
          {(folder.todoCount ?? 0) > 0 && (
            <span className="text-xs text-gray-500 font-medium">
              {folder.todoCount}
            </span>
          )}
        </div>

        {/* 文件夹下的清单 */}
        {isExpanded && folderLists.length > 0 && (
          <div className="ml-6">
            {folderLists.map(list => {
              const isSelected = selectedListId === list.id
              return (
                <div
                  key={list.id}
                  className={cn(
                    'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                    isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                  )}
                  onClick={() => onListClick?.(list)}
                  onContextMenu={(e) => handleContextMenu(e, list, 'list')}
                >
                  <span className="text-base">{list.icon}</span>
                  <span
                    className="flex-1 text-sm truncate font-medium"
                    style={{ color: isSelected ? undefined : list.color }}
                  >
                    {list.name}
                  </span>
                  {(list.todoCount ?? 0) > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                      {list.todoCount}
                    </span>
                  )}
                  {list.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      默认
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // 不属于任何文件夹的清单
  const orphanLists = lists.filter(l => !l.folderId)

  return (
    <>
      <div className="space-y-0.5">
        {/* 渲染所有文件夹（平级） */}
        {folders.map(folder => renderFolder(folder))}

        {/* 渲染独立清单 */}
        {orphanLists.map(list => {
          const isSelected = selectedListId === list.id
          return (
            <div
              key={list.id}
              className={cn(
                'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              )}
              onClick={() => onListClick?.(list)}
              onContextMenu={(e) => handleContextMenu(e, list, 'list')}
            >
              <span className="text-base ml-6">{list.icon}</span>
              <span
                className="flex-1 text-sm truncate font-medium"
                style={{ color: isSelected ? undefined : list.color }}
              >
                {list.name}
              </span>
              {(list.todoCount ?? 0) > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {list.todoCount}
                </span>
              )}
              {list.isDefault && (
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                  默认
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'folder' ? (
              <>
                <button
                  onClick={() => {
                    onFolderEdit?.(contextMenu.item as Folder)
                    closeContextMenu()
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定要删除这个文件夹吗？其中的清单将被移到顶层。')) {
                      onFolderDelete?.(contextMenu.item as Folder)
                    }
                    closeContextMenu()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors"
                >
                  删除
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onListEdit?.(contextMenu.item as List)
                    closeContextMenu()
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                >
                  编辑
                </button>
                {!(contextMenu.item as List).isSystem && (
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这个清单吗？')) {
                        onListDelete?.(contextMenu.item as List)
                      }
                      closeContextMenu()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 transition-colors"
                  >
                    删除
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
