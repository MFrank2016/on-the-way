'use client'

import { useEffect, useState } from 'react'
import { taskAPI, listAPI } from '@/lib/api'
import { Task, List } from '@/types'
import TaskList from '@/components/TaskList'
import QuickAddTask from '@/components/QuickAddTask'
import TaskDialog from '@/components/TaskDialog'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)

  useEffect(() => {
    loadTasks()
    loadLists()
  }, [])

  const loadLists = async () => {
    try {
      const response = await listAPI.getLists()
      setLists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load lists:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getTasks({ type: 'today' })
      setTasks(response.data.data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTask = async (title: string, description?: string) => {
    try {
      const dueDate = new Date()
      dueDate.setHours(23, 59, 59, 999)
      
      await taskAPI.createTask({ 
        title, 
        description, 
        priority: 0,
        dueDate
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
        await taskAPI.updateTask(editingTask.id, taskData)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">今天</h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      <div className="mb-6">
        <QuickAddTask onAdd={handleAddTask} />
      </div>

      <TaskList
        tasks={tasks}
        onComplete={handleCompleteTask}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
        emptyMessage="今天没有待办事项"
      />

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

