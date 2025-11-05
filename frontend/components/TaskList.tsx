'use client'

import { Task } from '@/types'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  emptyMessage?: string
}

export default function TaskList({
  tasks,
  onComplete,
  onDelete,
  onEdit,
  emptyMessage = '暂无任务'
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">{emptyMessage}</div>
        <div className="text-gray-500 text-sm">点击上方按钮添加新任务</div>
      </div>
    )
  }

  // 按状态分组
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      {/* 待办任务 */}
      {todoTasks.length > 0 && (
        <div className="space-y-2">
          {todoTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {/* 已完成任务 */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="text-sm font-medium text-gray-500">
              已完成 ({completedTasks.length})
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

