'use client'

import { Task } from '@/types'

interface TodayTasksPanelProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export default function TodayTasksPanel({ tasks, onTaskClick }: TodayTasksPanelProps) {
  if (tasks.length === 0) {
    return null
  }

  return (
    <div className="md:hidden bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">今天</h3>
      <div className="space-y-2">
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => onTaskClick(task)}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors"
          >
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-gray-300"
              readOnly
              checked={false}
            />
            <div className="flex-1">
              <div className="text-sm text-gray-900">{task.title}</div>
            </div>
            {task.dueTime && (
              <span className="text-xs text-orange-500 font-medium">{task.dueTime}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

