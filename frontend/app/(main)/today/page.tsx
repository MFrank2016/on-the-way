'use client'

import { useEffect, useState } from 'react'
import { taskAPI, listAPI, habitAPI, tagAPI } from '@/lib/api'
import { Task, List, Habit, Tag } from '@/types'
import CrossListDraggable from '@/components/CrossListDraggable'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import TaskDialog from '@/components/TaskDialog'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function TodayPage() {
  const [todoTasks, setTodoTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [todayHabits, setTodayHabits] = useState<Habit[]>([])
  const [completedHabits, setCompletedHabits] = useState<Habit[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

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
      // 今日待办（未完成）
      const todoResponse = await taskAPI.getTasks({ type: 'today', status: 'todo' })
      setTodoTasks(todoResponse.data.data || [])
      
      // 今日已完成
      const completedResponse = await taskAPI.getTasks({ type: 'today', status: 'completed' })
      setCompletedTasks(completedResponse.data.data || [])
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
    dueDate?: Date
    priority?: number
    tagIds?: number[]
    listId?: number
  }) => {
    try {
      const dueDate = data.dueDate || new Date()
      dueDate.setHours(23, 59, 59, 999)
      
      await taskAPI.createTask({ 
        ...data,
        dueDate,
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
    setEditingTask(task)
    setShowTaskDialog(true)
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
    <div className="max-w-4xl mx-auto p-6">
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
        onReorderTodo={handleReorderTodo}
        onReorderCompleted={handleReorderCompleted}
        onMoveToCompleted={handleMoveToCompleted}
        onMoveToTodo={handleMoveToTodo}
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
  )
}

