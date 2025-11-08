'use client'

import { Task } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

interface DraggableCalendarTaskProps {
  task: Task
  taskColor: string
  onTaskClick: (task: Task) => void
}

export default function DraggableCalendarTask({ 
  task, 
  taskColor, 
  onTaskClick 
}: DraggableCalendarTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id.toString(),
    data: {
      type: 'task',
      task
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: `${taskColor}20`,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        'text-[10px] md:text-xs px-1.5 py-0.5 rounded cursor-move transition-all hover:shadow-sm',
        isDragging && 'opacity-50 z-50'
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (!isDragging) {
          onTaskClick(task)
        }
      }}
    >
      <div 
        className="flex items-center justify-between gap-1"
        style={{
          color: taskColor
        }}
      >
        <span className="font-medium truncate flex-1">{task.title}</span>
        {task.dueTime && (
          <span className="text-[9px] md:text-[10px] text-gray-500 flex-shrink-0">
            {task.dueTime}
          </span>
        )}
      </div>
    </div>
  )
}

