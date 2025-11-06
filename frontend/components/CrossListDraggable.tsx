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
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'

interface CrossListDraggableProps {
  todoTasks: Task[]
  completedTasks: Task[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onUpdateTitle?: (id: string, title: string) => void
  onReorderTodo: (tasks: Task[]) => void
  onReorderCompleted: (tasks: Task[]) => void
  onMoveToCompleted: (taskId: string) => void
  onMoveToTodo: (taskId: string) => void
  selectedTaskId?: string
}

interface SortableTaskItemProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onUpdateTitle?: (id: string, title: string) => void
  isSelected?: boolean
}

function SortableTaskItem({ task, onComplete, onDelete, onEdit, onUpdateTitle, isSelected }: SortableTaskItemProps) {
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
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="active:cursor-grabbing"
    >
      <TaskItem
        task={task}
        onComplete={onComplete}
        onDelete={onDelete}
        onEdit={onEdit}
        onUpdateTitle={onUpdateTitle}
        isSelected={isSelected}
      />
    </div>
  )
}

export default function CrossListDraggable({
  todoTasks,
  completedTasks,
  onComplete,
  onDelete,
  onEdit,
  onUpdateTitle,
  onReorderTodo,
  onReorderCompleted,
  onMoveToCompleted,
  onMoveToTodo,
  selectedTaskId,
}: CrossListDraggableProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localTodoTasks, setLocalTodoTasks] = useState(todoTasks)
  const [localCompletedTasks, setLocalCompletedTasks] = useState(completedTasks)
  // 记录拖拽开始时任务所在的列表
  const [dragStartContainer, setDragStartContainer] = useState<'todo' | 'completed' | null>(null)

  // 当props更新时同步本地状态
  useEffect(() => {
    setLocalTodoTasks(todoTasks)
  }, [todoTasks])

  useEffect(() => {
    setLocalCompletedTasks(completedTasks)
  }, [completedTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 移动3px后才开始拖拽，快速响应的同时避免点击误触发
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id.toString()
    setActiveId(activeId)
    
    // 记录任务开始时所在的列表
    if (localTodoTasks.some(t => t.id.toString() === activeId)) {
      setDragStartContainer('todo')
    } else if (localCompletedTasks.some(t => t.id.toString() === activeId)) {
      setDragStartContainer('completed')
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // 检查是否在不同容器之间拖拽
    const activeInTodo = localTodoTasks.some(t => t.id.toString() === activeId)
    const activeInCompleted = localCompletedTasks.some(t => t.id.toString() === activeId)
    const overInTodo = overId === 'todo-droppable' || localTodoTasks.some(t => t.id.toString() === overId)
    const overInCompleted = overId === 'completed-droppable' || localCompletedTasks.some(t => t.id.toString() === overId)

    // 从待办拖到已完成（且还未在已完成列表中）
    if (activeInTodo && overInCompleted && !activeInCompleted) {
      const task = localTodoTasks.find(t => t.id.toString() === activeId)
      if (task) {
        // 更新任务状态为已完成
        const updatedTask = {
          ...task,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        }
        setLocalTodoTasks(localTodoTasks.filter(t => t.id.toString() !== activeId))
        setLocalCompletedTasks([...localCompletedTasks, updatedTask])
      }
    }

    // 从已完成拖到待办（且还未在待办列表中）
    if (activeInCompleted && overInTodo && !activeInTodo) {
      const task = localCompletedTasks.find(t => t.id.toString() === activeId)
      if (task) {
        // 更新任务状态为待办
        const updatedTask = {
          ...task,
          status: 'todo' as const,
          completedAt: undefined,
        }
        setLocalCompletedTasks(localCompletedTasks.filter(t => t.id.toString() !== activeId))
        setLocalTodoTasks([...localTodoTasks, updatedTask])
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      setDragStartContainer(null)
      return
    }

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // 判断任务当前在哪个列表（拖拽结束后的位置）
    const taskInTodo = localTodoTasks.some(t => t.id.toString() === activeId)
    const taskInCompleted = localCompletedTasks.some(t => t.id.toString() === activeId)

    // 判断目标位置
    const overInTodo = overId === 'todo-droppable' || localTodoTasks.some(t => t.id.toString() === overId)
    const overInCompleted = overId === 'completed-droppable' || localCompletedTasks.some(t => t.id.toString() === overId)

    // 同一列表内排序
    if (taskInTodo && overInTodo && dragStartContainer === 'todo') {
      const oldIndex = localTodoTasks.findIndex(t => t.id.toString() === activeId)
      const newIndex = localTodoTasks.findIndex(t => t.id.toString() === overId)
      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(localTodoTasks, oldIndex, newIndex)
        setLocalTodoTasks(newTasks)
        onReorderTodo(newTasks)
      }
    } else if (taskInCompleted && overInCompleted && dragStartContainer === 'completed') {
      const oldIndex = localCompletedTasks.findIndex(t => t.id.toString() === activeId)
      const newIndex = localCompletedTasks.findIndex(t => t.id.toString() === overId)
      if (oldIndex !== newIndex) {
        const newTasks = arrayMove(localCompletedTasks, oldIndex, newIndex)
        setLocalCompletedTasks(newTasks)
        onReorderCompleted(newTasks)
      }
    }

    // 跨列表移动：使用拖拽开始时的容器判断
    if (dragStartContainer === 'todo' && taskInCompleted) {
      // 从待办移动到已完成
      onMoveToCompleted(activeId)
    } else if (dragStartContainer === 'completed' && taskInTodo) {
      // 从已完成移动到待办
      onMoveToTodo(activeId)
    }

    // 重置拖拽开始容器
    setDragStartContainer(null)
  }

  const activeTask = activeId 
    ? [...localTodoTasks, ...localCompletedTasks].find(t => t.id.toString() === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* 待办列表 */}
      {localTodoTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            今日待办
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {localTodoTasks.length}
            </span>
          </h2>
          <SortableContext
            id="todo-droppable"
            items={localTodoTasks.map(t => t.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localTodoTasks.map((task) => (
                <SortableTaskItem
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
          </SortableContext>
        </div>
      )}

      {/* 已完成列表 */}
      {localCompletedTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            已完成
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {localCompletedTasks.length}
            </span>
          </h2>
          <SortableContext
            id="completed-droppable"
            items={localCompletedTasks.map(t => t.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localCompletedTasks.map((task) => (
                <SortableTaskItem
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
          </SortableContext>
        </div>
      )}

      {/* 拖拽预览 */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskItem
              task={activeTask}
              onComplete={() => {}}
              onDelete={() => {}}
              onEdit={() => {}}
              onUpdateTitle={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

