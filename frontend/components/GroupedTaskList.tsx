'use client'

import { Task } from '@/types'
import TaskItem from './TaskItem'

interface TaskGroup {
  id: string
  label: string
  tasks: Task[]
  sortOrder: number
}

interface GroupedTaskListProps {
  groups: TaskGroup[]
  selectedTaskId?: string
  onComplete: (taskId: string) => void
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
  onUpdateTitle: (taskId: string, title: string) => void
  onAbandon?: (taskId: string) => void
}

export default function GroupedTaskList({
  groups,
  selectedTaskId,
  onComplete,
  onDelete,
  onEdit,
  onUpdateTitle,
  onAbandon,
}: GroupedTaskListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">暂无任务</div>
        <div className="text-gray-500 text-sm">点击上方按钮添加新任务</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          {/* Group Header */}
          <div className="flex items-center gap-2 px-2">
            <div className="text-sm font-medium text-gray-700">
              {group.label} ({group.tasks.length})
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {group.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onUpdateTitle={onUpdateTitle}
                onAbandon={onAbandon}
                isSelected={task.id.toString() === selectedTaskId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

