'use client'

import { useState } from 'react'
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(folders.filter(f => f.isExpanded).map(f => f.id))
  )
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    item: Folder | List
    type: 'folder' | 'list'
  } | null>(null)

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
    onToggleExpand?.(folderId)
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

  // 递归渲染文件夹树
  const renderFolder = (folder: Folder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const folderLists = lists.filter(l => l.folderId === folder.id)
    const subFolders = folders.filter(f => f.parentId === folder.id)

    return (
      <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
        {/* 文件夹项 */}
        <div
          className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
          onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-lg">{folder.icon}</span>
          <span
            className="flex-1 text-sm font-medium truncate"
            style={{ color: folder.color }}
            onClick={() => onFolderClick?.(folder)}
          >
            {folder.name}
          </span>
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {(subFolders.length + folderLists.length)}
          </span>
        </div>

        {/* 子文件夹和清单 */}
        {isExpanded && (
          <div className="ml-2">
            {/* 渲染子文件夹 */}
            {subFolders.map(subFolder => renderFolder(subFolder, level + 1))}
            
            {/* 渲染清单 */}
            {folderLists.map(list => {
              const isSelected = selectedListId === list.id
              return (
                <div
                  key={list.id}
                  className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  style={{ marginLeft: `${(level + 1) * 16 + 20}px` }}
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

  // 根级别文件夹
  const rootFolders = folders.filter(f => !f.parentId)
  // 不属于任何文件夹的清单
  const orphanLists = lists.filter(l => !l.folderId)

  return (
    <>
      <div className="space-y-0.5">
        {/* 渲染根文件夹 */}
        {rootFolders.map(folder => renderFolder(folder))}

        {/* 渲染独立清单 */}
        {orphanLists.map(list => {
          const isSelected = selectedListId === list.id
          return (
            <div
              key={list.id}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
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

