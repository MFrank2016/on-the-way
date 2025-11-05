'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import FilterBar from './FilterBar'
import FolderTree from './FolderTree'
import FolderDialog from './FolderDialog'
import ListDialog from './ListDialog'
import { folderAPI, listAPI, tagAPI } from '@/lib/api'
import { Folder, List, Tag } from '@/types'
import { useFilterStore } from '@/stores/filterStore'
import { useUIStore } from '@/stores/uiStore'

export default function TaskSidebar() {
  const { showTaskSidebar, activeModule } = useUIStore()
  const { setFilter } = useFilterStore()
  const [folders, setFolders] = useState<Folder[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showListDialog, setShowListDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [showListsSection, setShowListsSection] = useState(true)
  const [showTagsSection, setShowTagsSection] = useState(true)

  const loadFolders = async () => {
    try {
      const response = await folderAPI.getFolders()
      setFolders(response.data.data || [])
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const loadLists = async () => {
    try {
      const response = await listAPI.getLists()
      setLists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load lists:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await tagAPI.getTags()
      setTags(response.data.data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadFolders(),
        loadLists(),
        loadTags(),
      ])
    }
    loadData()
  }, [])

  const handleSaveFolder = async (folderData: { name: string; color?: string; parentId?: number; icon?: string }) => {
    try {
      if (editingFolder) {
        await folderAPI.updateFolder(editingFolder.id.toString(), folderData)
      } else {
        await folderAPI.createFolder(folderData)
      }
      loadFolders()
      setShowFolderDialog(false)
      setEditingFolder(null)
    } catch (error) {
      console.error('Failed to save folder:', error)
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      await folderAPI.deleteFolder(folder.id.toString())
      loadFolders()
      loadLists()
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  const handleSaveList = async (listData: { name: string; icon?: string; color?: string; folderId?: number | null; type?: string; isSystem?: boolean; isDefault?: boolean }) => {
    try {
      if (editingList) {
        await listAPI.updateList(editingList.id.toString(), listData)
      } else {
        await listAPI.createList(listData)
      }
      loadLists()
      setShowListDialog(false)
      setEditingList(null)
    } catch (error) {
      console.error('Failed to save list:', error)
    }
  }

  const handleDeleteList = async (list: List) => {
    try {
      await listAPI.deleteList(list.id.toString())
      loadLists()
    } catch (error) {
      console.error('Failed to delete list:', error)
    }
  }

  const handleToggleExpand = async (folderId: string) => {
    try {
      await folderAPI.toggleExpand(folderId)
      loadFolders()
    } catch (error) {
      console.error('Failed to toggle folder:', error)
    }
  }

  // 只在任务模块显示侧边栏
  if (!showTaskSidebar || activeModule !== 'task') {
    return null
  }

  return (
    <>
      <aside className="hidden lg:flex w-70 bg-white border-r border-gray-200 h-screen flex-col">
        {/* 过滤器栏 */}
        <FilterBar lists={lists} />

        {/* 清单区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-3">
            {/* 清单标题 */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowListsSection(!showListsSection)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    showListsSection && 'rotate-90'
                  )}
                />
                <span>清单</span>
                <span className="text-xs text-gray-500">
                  已使用 {lists.length}/69
                </span>
              </button>
              <button
                onClick={() => {
                  setEditingList(null)
                  setShowListDialog(true)
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
                title="新建清单或文件夹"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 文件夹和清单树 */}
            {showListsSection && (
              <FolderTree
                folders={folders}
                lists={lists}
                onListClick={(list) => {
                  // 点击清单时设置过滤器并跳转
                  setFilter({ type: 'list', listId: list.id, label: list.name })
                  // 可以选择跳转到today页面或保持当前页面
                }}
                onFolderEdit={(folder) => {
                  setEditingFolder(folder)
                  setShowFolderDialog(true)
                }}
                onFolderDelete={handleDeleteFolder}
                onListEdit={(list) => {
                  setEditingList(list)
                  setShowListDialog(true)
                }}
                onListDelete={handleDeleteList}
                onToggleExpand={handleToggleExpand}
              />
            )}
          </div>

          {/* 过滤器区域 */}
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">过滤器</div>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <span>📅</span>
              <span>今日工作</span>
            </button>
          </div>

          {/* 标签区域 */}
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowTagsSection(!showTagsSection)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    showTagsSection && 'rotate-90'
                  )}
                />
                <span>标签</span>
              </button>
              <button
                className="p-1 hover:bg-gray-100 rounded transition"
                title="新建标签"
              >
                <Plus className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {showTagsSection && (
              <div className="space-y-1">
                {tags.slice(0, 5).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilter({ type: 'tag', tagIds: [tag.id], label: tag.name })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    <TagIcon className="w-3 h-3" style={{ color: tag.color }} />
                    <span className="flex-1 text-left">{tag.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 系统过滤器 */}
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <span>✅</span>
                <span>已完成</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <span>❌</span>
                <span>已放弃</span>
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <span>🗑️</span>
                <span>垃圾桶</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Dialogs */}
      {showFolderDialog && (
        <FolderDialog
          folder={editingFolder}
          folders={folders}
          onSave={handleSaveFolder}
          onClose={() => {
            setShowFolderDialog(false)
            setEditingFolder(null)
          }}
        />
      )}

      {showListDialog && (
        <ListDialog
          list={editingList}
          folders={folders}
          onSave={handleSaveList}
          onClose={() => {
            setShowListDialog(false)
            setEditingList(null)
          }}
        />
      )}
    </>
  )
}

