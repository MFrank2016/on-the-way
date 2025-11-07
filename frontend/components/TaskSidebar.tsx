'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import FilterBar from './FilterBar'
import FolderTree from './FolderTree'
import FolderDialog from './FolderDialog'
import ListDialog from './ListDialog'
import FilterDialog from './FilterDialog'
import TagDialog from './TagDialog'
import TagTree from './TagTree'
import { folderAPI, listAPI, tagAPI, taskAPI, filterAPI } from '@/lib/api'
import { Folder, List, Tag, Task, Filter } from '@/types'
import { useFilterStore } from '@/stores/filterStore'
import { useUIStore } from '@/stores/uiStore'
import { useRouter } from 'next/navigation'

export default function TaskSidebar() {
  const router = useRouter()
  const { showTaskSidebar, activeModule } = useUIStore()
  const { activeFilter, setFilter, setCustomFilters } = useFilterStore()
  const [folders, setFolders] = useState<Folder[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [customFilters, setLocalCustomFilters] = useState<Filter[]>([])
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showListDialog, setShowListDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>()
  const [showListsSection, setShowListsSection] = useState(true)
  const [showTagsSection, setShowTagsSection] = useState(true)
  const [showFiltersSection, setShowFiltersSection] = useState(true)
  const [taskCounts, setTaskCounts] = useState({
    all: 0,
    today: 0,
    tomorrow: 0,
    week: 0,
    inbox: 0,
  })

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

  const loadFilters = async () => {
    try {
      const response = await filterAPI.getFilters()
      const filters = response.data.data || []
      setLocalCustomFilters(filters)
      setCustomFilters(filters)
    } catch (error) {
      console.error('Failed to load filters:', error)
    }
  }

  const loadTaskCounts = async () => {
    try {
      // 获取所有待办任务
      const allTodoResponse = await taskAPI.getTasks({ status: 'todo' })
      const allTasks = allTodoResponse.data.data || []
      
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      
      // 计算各类任务数量
      // 今天任务数 = 今天到期的任务 + 逾期的任务
      const overdueCount = allTasks.filter((t: Task) => t.dueDate && t.dueDate < todayDateStr).length
      const todayDueCount = allTasks.filter((t: Task) => t.dueDate === todayDateStr).length
      
      const counts = {
        all: allTasks.length,
        today: overdueCount + todayDueCount, // 今天显示的任务包括逾期任务
        tomorrow: allTasks.filter((t: Task) => t.dueDate === tomorrowDateStr).length,
        week: allTasks.filter((t: Task) => t.dueDate && t.dueDate > todayDateStr && t.dueDate <= weekDateStr).length,
        inbox: allTasks.filter((t: Task) => t.list?.isDefault || t.list?.type === 'inbox').length,
      }
      
      setTaskCounts(counts)
    } catch (error) {
      console.error('Failed to load task counts:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadFolders(),
        loadLists(),
        loadTags(),
        loadFilters(),
        loadTaskCounts(),
      ])
    }
    loadData()
    
    // 监听任务更新事件，刷新任务数量统计
    const handleTaskUpdate = () => {
      loadTaskCounts()
    }
    
    window.addEventListener('taskUpdated', handleTaskUpdate)
    
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 标签相关处理函数
  const handleSaveTag = async (tagData: { name: string; color: string; parentId?: number }) => {
    try {
      if (editingTag) {
        await tagAPI.updateTag(editingTag.id.toString(), tagData)
      } else {
        await tagAPI.createTag(tagData)
      }
      loadTags()
      setShowTagDialog(false)
      setEditingTag(null)
    } catch (error) {
      console.error('Failed to save tag:', error)
    }
  }

  const handleTagClick = (tag: Tag) => {
    setSelectedTagId(tag.id)
    router.push(`/tags/${tag.id}`)
  }

  const handleTagEdit = (tag: Tag) => {
    setEditingTag(tag)
    setShowTagDialog(true)
  }

  const handleTagTogglePin = async (tag: Tag) => {
    try {
      await tagAPI.togglePin(tag.id.toString(), !tag.isPinned)
      loadTags()
    } catch (error) {
      console.error('Failed to toggle pin tag:', error)
    }
  }

  const handleTagAddChild = (parentTag: Tag) => {
    setEditingTag({
      ...parentTag,
      id: 0,
      name: '',
      parentId: parentTag.id,
      color: parentTag.color,
    } as Tag)
    setShowTagDialog(true)
  }

  const handleTagDelete = async (tag: Tag) => {
    if (!confirm(`确定要删除标签"${tag.name}"吗？`)) {
      return
    }

    try {
      await tagAPI.deleteTag(tag.id.toString())
      loadTags()
      if (selectedTagId === tag.id) {
        setSelectedTagId(undefined)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || '删除标签失败'
        : '删除标签失败'
      alert(errorMessage)
      console.error('Failed to delete tag:', error)
    }
  }

  const handleSaveFilter = async (filterData: { name: string; icon?: string; isPinned?: boolean; filterConfig: import('@/types').FilterConfigData }) => {
    try {
      if (editingFilter) {
        await filterAPI.updateFilter(editingFilter.id.toString(), filterData)
      } else {
        await filterAPI.createFilter(filterData)
      }
      loadFilters()
      setShowFilterDialog(false)
      setEditingFilter(null)
    } catch (error) {
      console.error('Failed to save filter:', error)
    }
  }

  // Filter 删除功能（已在 FilterBar 中实现）
  // const handleDeleteFilter = async (filterId: number) => {
  //   try {
  //     await filterAPI.deleteFilter(filterId.toString())
  //     loadFilters()
  //   } catch (error) {
  //     console.error('Failed to delete filter:', error)
  //   }
  // }

  const handleTogglePin = async (filterId: number, isPinned: boolean) => {
    try {
      await filterAPI.togglePin(filterId.toString(), isPinned)
      loadFilters()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const handleFilterClick = (filter: Filter) => {
    setFilter({ type: 'custom', customFilterId: filter.id, label: filter.name })
  }

  // 只在任务模块显示侧边栏
  if (!showTaskSidebar || activeModule !== 'task') {
    return null
  }

  const pinnedFilters = customFilters.filter(f => f.isPinned)

  return (
    <>
      <aside className="hidden lg:flex w-70 bg-white border-r border-gray-200 h-screen flex-col">
        {/* 过滤器栏 */}
        <FilterBar 
          lists={lists} 
          taskCounts={taskCounts}
          pinnedFilters={pinnedFilters}
          onPinnedFilterClick={handleFilterClick}
        />

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
                selectedListId={activeFilter.type === 'list' ? activeFilter.listId : undefined}
                onListClick={(list) => {
                  // 点击清单时设置过滤器并跳转
                  setFilter({ type: 'list', listId: list.id, label: list.name })
                  router.push('/today')
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

          {/* 自定义过滤器区域 */}
          <div className="px-3 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setShowFiltersSection(!showFiltersSection)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <ChevronRight
                  className={cn(
                    'w-3 h-3 transition-transform',
                    showFiltersSection && 'rotate-90'
                  )}
                />
                <span>过滤器</span>
              </button>
              <button
                onClick={() => {
                  setEditingFilter(null)
                  setShowFilterDialog(true)
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
                title="新建过滤器"
              >
                <Plus className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {showFiltersSection && (
              <div className="space-y-1">
                {customFilters.filter(f => !f.isPinned).slice(0, 10).map((filter) => (
                  <div
                    key={filter.id}
                    className="group w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    <button
                      onClick={() => handleFilterClick(filter)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <span className="text-base">{filter.icon || '🔍'}</span>
                      <span className="flex-1">{filter.name}</span>
                    </button>
                    <button
                      onClick={() => handleTogglePin(filter.id, !filter.isPinned)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                      title={filter.isPinned ? '取消置顶' : '置顶'}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                onClick={() => {
                  setEditingTag(null)
                  setShowTagDialog(true)
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
                title="新建标签"
              >
                <Plus className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {showTagsSection && (
              <TagTree
                tags={tags}
                selectedTagId={selectedTagId}
                onTagClick={handleTagClick}
                onTagEdit={handleTagEdit}
                onTagTogglePin={handleTagTogglePin}
                onTagAddChild={handleTagAddChild}
                onTagDelete={handleTagDelete}
              />
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

      {showFilterDialog && (
        <FilterDialog
          filter={editingFilter}
          folders={folders}
          lists={lists}
          tags={tags}
          onSave={handleSaveFilter}
          onClose={() => {
            setShowFilterDialog(false)
            setEditingFilter(null)
          }}
        />
      )}

      {showTagDialog && (
        <TagDialog
          tag={editingTag}
          tags={tags}
          onSave={handleSaveTag}
          onClose={() => {
            setShowTagDialog(false)
            setEditingTag(null)
          }}
        />
      )}
    </>
  )
}

