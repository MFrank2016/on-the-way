'use client'

import { useEffect, useState } from 'react'
import { taskAPI } from '@/lib/api'
import { Task } from '@/types'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const quadrants = [
  { 
    id: 3, 
    title: '重要且紧急', 
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-100 text-red-800',
    description: '立即处理'
  },
  { 
    id: 2, 
    title: '重要不紧急', 
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100 text-yellow-800',
    description: '计划安排'
  },
  { 
    id: 1, 
    title: '不重要但紧急', 
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    description: '委托他人'
  },
  { 
    id: 0, 
    title: '不重要不紧急', 
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'bg-gray-100 text-gray-800',
    description: '减少或删除'
  },
]

export default function QuadrantPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await taskAPI.getTasks()
      setTasks(response.data.data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
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

  const handleChangePriority = async (taskId: string, priority: number) => {
    try {
      await taskAPI.updatePriority(taskId, priority)
      loadTasks()
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  const getTasksByPriority = (priority: number) => {
    return tasks.filter(t => t.priority === priority && t.status === 'todo')
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="group bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition border border-gray-200">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => handleCompleteTask(task.id)}
          className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm line-clamp-2">
            {task.title}
          </div>
          {task.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {task.description}
            </div>
          )}
          {task.dueDate && (
            <div className="text-xs text-gray-400 mt-1">
              {new Date(task.dueDate).toLocaleDateString('zh-CN')}
            </div>
          )}
        </div>
      </div>
      
      {/* 优先级切换 */}
      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        {[3, 2, 1, 0].map((priority) => (
          <button
            key={priority}
            onClick={() => handleChangePriority(task.id, priority)}
            className={cn(
              'text-xs px-2 py-0.5 rounded',
              task.priority === priority
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {priority === 3 && '重急'}
            {priority === 2 && '重要'}
            {priority === 1 && '紧急'}
            {priority === 0 && '普通'}
          </button>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">四象限</h1>
        <p className="text-gray-600">根据重要性和紧急程度管理任务</p>
      </div>

      {/* 四象限网格 */}
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {quadrants.map((quadrant) => {
          const quadrantTasks = getTasksByPriority(quadrant.id)
          
          return (
            <div
              key={quadrant.id}
              className={cn(
                'rounded-2xl border-2 flex flex-col overflow-hidden',
                quadrant.color
              )}
            >
              {/* 象限头部 */}
              <div className={cn('p-4 border-b-2', quadrant.headerColor)}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg">{quadrant.title}</h3>
                  <span className="text-sm font-medium">
                    {quadrantTasks.length} 个任务
                  </span>
                </div>
                <p className="text-sm opacity-75">{quadrant.description}</p>
              </div>

              {/* 任务列表 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {quadrantTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">暂无任务</p>
                  </div>
                ) : (
                  quadrantTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>

              {/* 添加按钮 */}
              <div className="p-3 border-t">
                <button
                  onClick={() => {/* TODO: 打开添加任务对话框，并设置默认优先级 */}}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-white/50 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加任务</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 说明卡片 */}
      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3">四象限法则</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-red-600">重要且紧急：</span>
            <span className="text-gray-600">需要立即处理的紧急问题</span>
          </div>
          <div>
            <span className="font-medium text-yellow-600">重要不紧急：</span>
            <span className="text-gray-600">需要规划和投入时间的事项</span>
          </div>
          <div>
            <span className="font-medium text-blue-600">不重要但紧急：</span>
            <span className="text-gray-600">可以委托他人处理的事项</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">不重要不紧急：</span>
            <span className="text-gray-600">应该减少或删除的事项</span>
          </div>
        </div>
      </div>
    </div>
  )
}

