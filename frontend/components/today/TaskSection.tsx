import { useState } from 'react'
import TaskItem from '@/components/TaskItem'
import { Task } from '@/types'

interface TaskSectionProps {
  title: string
  tasks: Task[]
  selectedTaskId?: string
  onComplete: (taskId: string) => void
  onDelete: (taskId: string) => void
  onEdit: (task: Task) => void
  onUpdateTitle: (taskId: string, title: string) => void
  icon?: React.ReactNode
  defaultExpanded?: boolean
  countColor?: string
}

export function TaskSection({
  title,
  tasks,
  selectedTaskId,
  onComplete,
  onDelete,
  onEdit,
  onUpdateTitle,
  icon,
  defaultExpanded = true,
  countColor = 'bg-gray-100 text-gray-600',
}: TaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (tasks.length === 0) return null

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-sm font-medium text-gray-700 mb-3 flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {icon}
        {title}
        <span className={`text-xs px-2 py-0.5 rounded-full ${countColor}`}>
          {tasks.length}
        </span>
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              onUpdateTitle={onUpdateTitle}
              isSelected={selectedTaskId === task.id.toString()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

