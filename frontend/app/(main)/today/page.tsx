'use client'

import { useEffect, useState } from 'react'
import { taskAPI, listAPI, habitAPI, tagAPI } from '@/lib/api'
import { Task, List, Habit, Tag } from '@/types'
import CrossListDraggable from '@/components/CrossListDraggable'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import TaskDialog from '@/components/TaskDialog'
import TaskDetailPanelNew from '@/components/TaskDetailPanelNew'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useFilterStore } from '@/stores/filterStore'

export default function TodayPage() {
  const { activeFilter } = useFilterStore()
  const [todoTasks, setTodoTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [todayHabits, setTodayHabits] = useState<Habit[]>([])
  const [completedHabits, setCompletedHabits] = useState<Habit[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // 监听过滤器变化
  useEffect(() => {
    loadTasks()
  }, [activeFilter])

  const loadData = async () => {
    try {
      await Promise.all([
        loadTasks(),
        loadHabits(),
        loadLists(),
        loadTags(),
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
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

  const loadTasks = async () => {
    try {
      let todoParams: any = { status: 'todo' }
      
      // 根据过滤器设置查询参数
      if (activeFilter.type === 'date') {
        if (activeFilter.days === 0) {
          todoParams.type = 'today'
        } else if (activeFilter.days === 1) {
          todoParams.type = 'tomorrow'
        } else if (activeFilter.days === 7) {
          todoParams.type = 'week'
        }
      } else if (activeFilter.type === 'list' && activeFilter.listId) {
        todoParams.listId = activeFilter.listId
      } else {
        // 默认显示今日
        todoParams.type = 'today'
      }
      
      // 今日待办（未完成）
      const todoResponse = await taskAPI.getTasks(todoParams)
      setTodoTasks(todoResponse.data.data || [])
      
      // 今日已完成（只显示今天完成的任务）
      const allCompletedResponse = await taskAPI.getTasks({ status: 'completed' })
      const allCompleted = allCompletedResponse.data.data || []
      
      // 筛选今日完成的任务（completedAt 的日期部分等于今天）
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '') // 20251105
      const todayCompleted = allCompleted.filter((task: any) => {
        if (!task.completedAt) return false
        const completedDate = task.completedAt.substring(0, 8) // 取前8位
        return completedDate === todayDateStr
      })
      
      setCompletedTasks(todayCompleted)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadHabits = async () => {
    try {
      // 今日待打卡的习惯
      const response = await habitAPI.getTodayHabits()
      const habits = response.data.data || []
      
      // 分离未完成和已完成
      setTodayHabits(habits.filter((h: Habit) => !h.checkedToday))
      setCompletedHabits(habits.filter((h: Habit) => h.checkedToday))
    } catch (error) {
      console.error('Failed to load habits:', error)
    }
  }

  const handleAddTask = async (data: {
    title: string
    dueDate?: string
    dueTime?: string
    priority?: number
    tagIds?: number[]
    listId?: number
  }) => {
    try {
      await taskAPI.createTask({ 
        ...data,
        priority: data.priority || 0,
      })
      loadTasks()
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskAPI.completeTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskAPI.deleteTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    // 点击任务直接显示详情面板（桌面端）或对话框（移动端）
    setSelectedTask(task)
  }

  const handleUpdateTitle = async (taskId: string, title: string) => {
    try {
      await taskAPI.updateTask(taskId, { title })
      loadTasks()
    } catch (error) {
      console.error('Failed to update task title:', error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask.id.toString(), taskData)
      } else {
        await taskAPI.createTask(taskData)
      }
      loadTasks()
      setShowTaskDialog(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleCheckHabit = async (habitId: number) => {
    try {
      await habitAPI.checkIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to check habit:', error)
    }
  }

  const handleUncheckHabit = async (habitId: number) => {
    try {
      await habitAPI.cancelCheckIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to uncheck habit:', error)
    }
  }

  const handleReorderTodo = async (newTasks: Task[]) => {
    setTodoTasks(newTasks)
    try {
      const taskIds = newTasks.map(task => task.id)
      await taskAPI.reorderTasks(taskIds)
    } catch (error) {
      console.error('Failed to reorder todo tasks:', error)
      loadTasks()
    }
  }

  const handleReorderCompleted = async (newTasks: Task[]) => {
    setCompletedTasks(newTasks)
    try {
      const taskIds = newTasks.map(task => task.id)
      await taskAPI.reorderTasks(taskIds)
    } catch (error) {
      console.error('Failed to reorder completed tasks:', error)
      loadTasks()
    }
  }

  const handleMoveToCompleted = async (taskId: string) => {
    try {
      await taskAPI.completeTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('Failed to move task to completed:', error)
      loadTasks()
    }
  }

  const handleMoveToTodo = async (taskId: string) => {
    try {
      // 通过完成接口切换状态（再次调用会取消完成）
      await taskAPI.completeTask(taskId)
      loadTasks()
    } catch (error) {
      console.error('Failed to move task to todo:', error)
      loadTasks()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const totalCompleted = completedTasks.length + completedHabits.length

  return (
    <div className="flex h-full">
      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">今天</h1>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('zh-CN', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>

          {/* Quick Add */}
          <div className="mb-4">
            <QuickAddTaskNew onAdd={handleAddTask} lists={lists} tags={tags} />
          </div>

          {/* 跨列表拖拽区域 */}
          <CrossListDraggable
            todoTasks={todoTasks}
            completedTasks={completedTasks}
            onComplete={handleCompleteTask}
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
            onUpdateTitle={handleUpdateTitle}
            onReorderTodo={handleReorderTodo}
            onReorderCompleted={handleReorderCompleted}
            onMoveToCompleted={handleMoveToCompleted}
            onMoveToTodo={handleMoveToTodo}
            selectedTaskId={selectedTask?.id.toString()}
          />

          {/* 习惯打卡 */}
          {todayHabits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                习惯打卡
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {todayHabits.length}
                </span>
              </h2>
              <div className="space-y-2">
                {todayHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="group flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition"
                  >
                    <button
                      onClick={() => handleCheckHabit(habit.id)}
                      className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center transition"
                    >
                    </button>
                    
                    <span className="text-sm flex-1">{habit.name}</span>
                    
                    {habit.currentStreak && habit.currentStreak > 0 && (
                      <span className="text-xs text-gray-500">
                        🔥 {habit.currentStreak} 天
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 已完成的习惯 */}
          {completedHabits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                已完成习惯
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {completedHabits.length}
                </span>
              </h2>
              <div className="space-y-2">
                {completedHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="group flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                  >
                    <button
                      onClick={() => handleUncheckHabit(habit.id)}
                      className="flex-shrink-0 w-4 h-4 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    
                    <span className="text-sm flex-1 line-through text-gray-400">{habit.name}</span>
                    
                    {habit.currentStreak && habit.currentStreak > 0 && (
                      <span className="text-xs text-gray-400">
                        🔥 {habit.currentStreak} 天
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {todoTasks.length === 0 && todayHabits.length === 0 && completedTasks.length === 0 && completedHabits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">今天还没有待办事项</p>
            </div>
          )}

          {/* Task Dialog */}
          {showTaskDialog && (
            <TaskDialog
              task={editingTask}
              lists={lists}
              onSave={handleSaveTask}
              onClose={() => {
                setShowTaskDialog(false)
                setEditingTask(null)
              }}
            />
          )}
        </div>
      </div>

      {/* Task Detail Panel (右侧固定) */}
      <TaskDetailPanelNew
        task={selectedTask}
        lists={lists}
        tags={tags}
        onClose={() => setSelectedTask(null)}
        onUpdate={(taskId, data) => {
          taskAPI.updateTask(taskId, data)
          loadTasks()
        }}
        onDelete={(taskId) => {
          handleDeleteTask(taskId)
          setSelectedTask(null)
        }}
        onComplete={handleCompleteTask}
      />
    </div>
  )
}

