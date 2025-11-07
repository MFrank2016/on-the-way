import { useState } from 'react'
import { taskAPI } from '@/lib/api'
import { Task } from '@/types'

interface UseTaskOperationsProps {
  todoTasks: Task[]
  completedTasks: Task[]
  overdueTasks: Task[]
  setTodoTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setCompletedTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setOverdueTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  loadTasks: () => Promise<void>
  loadTaskCounts: () => Promise<void>
}

export function useTaskOperations({
  todoTasks,
  completedTasks,
  overdueTasks,
  setTodoTasks,
  setCompletedTasks,
  setOverdueTasks,
  loadTasks,
  loadTaskCounts,
}: UseTaskOperationsProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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
      loadTaskCounts()
      
      // 触发全局任务更新事件，通知侧边栏刷新统计数据
      window.dispatchEvent(new CustomEvent('taskUpdated'))
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    const taskToComplete = [...todoTasks, ...overdueTasks].find(t => t.id.toString() === taskId)
    const taskToUncomplete = completedTasks.find(t => t.id.toString() === taskId && t.status === 'completed')
    
    if (taskToComplete) {
      setTodoTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      setOverdueTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      const completedTask = {
        ...taskToComplete,
        status: 'completed' as const,
        completedAt: new Date().toISOString().replace(/[-:T]/g, '').split('.')[0],
      }
      setCompletedTasks(prev => [completedTask, ...prev])
    } else if (taskToUncomplete) {
      setCompletedTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      const todoTask = {
        ...taskToUncomplete,
        status: 'todo' as const,
        completedAt: undefined,
      }
      setTodoTasks(prev => [todoTask, ...prev])
    }
    
    try {
      await taskAPI.completeTask(taskId)
      loadTaskCounts()
      
      // 触发全局任务更新事件，通知侧边栏刷新统计数据
      window.dispatchEvent(new CustomEvent('taskUpdated'))
    } catch (error) {
      console.error('Failed to complete task:', error)
      loadTasks()
    }
  }

  const handleAbandonTask = async (taskId: string) => {
    const taskToAbandon = [...todoTasks, ...overdueTasks].find(t => t.id.toString() === taskId)
    const taskToRestore = completedTasks.find(t => t.id.toString() === taskId && t.status === 'abandoned')
    
    if (taskToAbandon) {
      setTodoTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      setOverdueTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      const abandonedTask = {
        ...taskToAbandon,
        status: 'abandoned' as const,
        completedAt: new Date().toISOString().replace(/[-:T]/g, '').split('.')[0],
      }
      setCompletedTasks(prev => [abandonedTask, ...prev])
    } else if (taskToRestore) {
      setCompletedTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      const todoTask = {
        ...taskToRestore,
        status: 'todo' as const,
        completedAt: undefined,
      }
      setTodoTasks(prev => [todoTask, ...prev])
    }
    
    try {
      await taskAPI.abandonTask(taskId)
      loadTaskCounts()
      
      // 触发全局任务更新事件，通知侧边栏刷新统计数据
      window.dispatchEvent(new CustomEvent('taskUpdated'))
    } catch (error) {
      console.error('Failed to abandon task:', error)
      loadTasks()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskAPI.deleteTask(taskId)
      loadTasks()
      loadTaskCounts()
      
      // 触发全局任务更新事件，通知侧边栏刷新统计数据
      window.dispatchEvent(new CustomEvent('taskUpdated'))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
  }

  const handleUpdateTitle = async (taskId: string, title: string) => {
    // 保存旧数据用于回滚
    const oldTodoTasks = [...todoTasks]
    const oldCompletedTasks = [...completedTasks]
    const oldOverdueTasks = [...overdueTasks]
    const oldSelectedTask = selectedTask
    
    // 立即更新前端显示（乐观更新）
    const updateTaskTitle = (task: Task) => 
      task.id.toString() === taskId ? { ...task, title } : task
    
    setTodoTasks(prev => prev.map(updateTaskTitle))
    setCompletedTasks(prev => prev.map(updateTaskTitle))
    setOverdueTasks(prev => prev.map(updateTaskTitle))
    
    // 如果更新的是当前选中的任务，立即更新 selectedTask
    if (selectedTask && selectedTask.id.toString() === taskId) {
      setSelectedTask({ ...selectedTask, title })
    }
    
    try {
      // 发送请求到后端
      await taskAPI.updateTask(taskId, { title })
    } catch (error) {
      console.error('Failed to update task title:', error)
      // 请求失败，回滚到旧数据
      setTodoTasks(oldTodoTasks)
      setCompletedTasks(oldCompletedTasks)
      setOverdueTasks(oldOverdueTasks)
      setSelectedTask(oldSelectedTask)
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
      await loadTasks()
      loadTaskCounts()
    } catch (error) {
      console.error('Failed to move task to completed:', error)
      loadTasks()
    }
  }

  const handleMoveToTodo = async (taskId: string) => {
    try {
      await taskAPI.completeTask(taskId)
      await loadTasks()
      loadTaskCounts()
    } catch (error) {
      console.error('Failed to move task to todo:', error)
      loadTasks()
    }
  }

  const handleUpdateTask = async (taskId: string, data: any) => {
    // 保存旧数据用于回滚
    const oldTodoTasks = [...todoTasks]
    const oldCompletedTasks = [...completedTasks]
    const oldOverdueTasks = [...overdueTasks]
    const oldSelectedTask = selectedTask
    
    // 立即更新前端显示（乐观更新）
    const updateTaskData = (task: Task) => {
      if (task.id.toString() === taskId) {
        return { ...task, ...data }
      }
      return task
    }
    
    setTodoTasks(prev => prev.map(updateTaskData))
    setCompletedTasks(prev => prev.map(updateTaskData))
    setOverdueTasks(prev => prev.map(updateTaskData))
    
    // 如果更新的是当前选中的任务，立即更新 selectedTask
    if (selectedTask && selectedTask.id.toString() === taskId) {
      setSelectedTask({ ...selectedTask, ...data })
    }
    
    try {
      // 发送请求到后端
      const response = await taskAPI.updateTask(taskId, data)
      const updatedTask = response.data.data
      
      // 使用后端返回的完整数据更新 selectedTask
      if (selectedTask && selectedTask.id.toString() === taskId) {
        setSelectedTask(updatedTask)
      }
      
      // 某些更新（如日期、清单等）可能影响任务分组，需要重新加载
      if (data.dueDate !== undefined || data.listId !== undefined) {
        await loadTasks()
        loadTaskCounts()
        
        // 触发全局任务更新事件，通知侧边栏刷新统计数据
        window.dispatchEvent(new CustomEvent('taskUpdated'))
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      // 请求失败，回滚到旧数据
      setTodoTasks(oldTodoTasks)
      setCompletedTasks(oldCompletedTasks)
      setOverdueTasks(oldOverdueTasks)
      setSelectedTask(oldSelectedTask)
    }
  }

  return {
    selectedTask,
    setSelectedTask,
    handleAddTask,
    handleCompleteTask,
    handleAbandonTask,
    handleDeleteTask,
    handleEditTask,
    handleUpdateTitle,
    handleReorderTodo,
    handleReorderCompleted,
    handleMoveToCompleted,
    handleMoveToTodo,
    handleUpdateTask,
  }
}

