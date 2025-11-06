'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tag as TagIcon, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { tagAPI, taskAPI } from '@/lib/api'
import { Tag, Task, List } from '@/types'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import DraggableTaskList from '@/components/DraggableTaskList'
import TaskDetailPanelNew from '@/components/TaskDetailPanelNew'

export default function TagPage() {
  const params = useParams()
  const router = useRouter()
  const tagId = params.id as string

  const [tag, setTag] = useState<Tag | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    loadData()
  }, [tagId])

  const loadData = async () => {
    try {
      setLoading(true)
      // 获取标签列表
      const tagResponse = await tagAPI.getTags()

      // 从标签列表中找到当前标签
      const allTags = tagResponse.data.data || []
      const findTag = (tags: Tag[]): Tag | null => {
        for (const t of tags) {
          if (t.id.toString() === tagId) return t
          if (t.children) {
            const found = findTag(t.children)
            if (found) return found
          }
        }
        return null
      }
      
      const currentTag = findTag(allTags)
      if (!currentTag) {
        router.push('/today')
        return
      }

      setTag(currentTag)
      setTags(allTags)

      // 获取该标签的任务（使用 taskAPI 的 tagId 参数过滤）
      try {
        const tasksResponse = await taskAPI.getTasks({ tagId: tagId })
        setTasks(tasksResponse.data.data || [])
      } catch (error) {
        console.error('Failed to load tasks for tag:', error)
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to load tag data:', error)
      router.push('/today')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (taskData: any) => {
    try {
      // 自动添加当前标签
      const tagIds = taskData.tagIds || []
      if (!tagIds.includes(Number(tagId))) {
        tagIds.push(Number(tagId))
      }

      await taskAPI.createTask({
        ...taskData,
        tagIds
      })
      loadData()
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskAPI.completeTask(taskId)
      loadData()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskAPI.deleteTask(taskId)
      loadData()
      if (selectedTask?.id.toString() === taskId) {
        setSelectedTask(null)
      }
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await taskAPI.updateTask(taskId, updates)
      loadData()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleReorderTasks = async (taskIds: number[]) => {
    try {
      await taskAPI.reorderTasks(taskIds)
      loadData()
    } catch (error) {
      console.error('Failed to reorder tasks:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">标签不存在</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tag.color || '#6B7280' }}
            />
            <h1 className="text-2xl font-bold text-gray-900">{tag.name}</h1>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {tasks.length} 个任务
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {/* Quick Add */}
          <QuickAddTaskNew
            onAdd={handleAddTask}
            lists={lists}
            tags={tags}
            placeholder="添加任务到此标签..."
          />

          {/* Task List */}
          <DraggableTaskList
            tasks={tasks}
            onComplete={handleCompleteTask}
            onDelete={handleDeleteTask}
            onEdit={(task) => setSelectedTask(task)}
            onUpdateTitle={handleUpdateTask}
            onReorder={handleReorderTasks}
          />

          {tasks.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <TagIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无任务</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanelNew
          task={selectedTask}
          lists={lists}
          tags={tags}
          onClose={() => setSelectedTask(null)}
          onUpdate={(taskId, updates) => {
            handleUpdateTask(taskId, updates)
            setSelectedTask(null)
          }}
          onDelete={(taskId) => {
            handleDeleteTask(taskId)
            setSelectedTask(null)
          }}
          onComplete={handleCompleteTask}
        />
      )}
    </div>
  )
}

