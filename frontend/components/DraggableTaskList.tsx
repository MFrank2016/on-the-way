'use client'

import { Task } from '@/types'
import TaskItem from './TaskItem'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DraggableTaskListProps {
  tasks: Task[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onReorder: (tasks: Task[]) => void
}

interface SortableTaskItemProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

function SortableTaskItem({ task, onComplete, onDelete, onEdit }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="group active:cursor-grabbing"
    >
      <TaskItem
        task={task}
        onComplete={onComplete}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  )
}

export default function DraggableTaskList({
  tasks,
  onComplete,
  onDelete,
  onEdit,
  onReorder,
}: DraggableTaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动8px后才开始拖拽，避免点击时误触发
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id.toString() === active.id)
      const newIndex = tasks.findIndex((task) => task.id.toString() === over.id)

      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      onReorder(newTasks)
    }
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((task) => task.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

