'use client'

import { Task, List } from '@/types'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import DraggableCalendarTask from './DraggableCalendarTask'
import { formatDateToApiString } from '@/lib/calendar-utils'
import { taskAPI } from '@/lib/api'

interface DroppableDateCellProps {
  date: Date
  children: React.ReactNode
}

function DroppableDateCell({ date, children }: DroppableDateCellProps) {
  const dateStr = formatDateToApiString(date)
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
    data: {
      type: 'date-cell',
      date
    }
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        'h-full transition-all',
        isOver && 'ring-2 ring-blue-400 ring-inset bg-blue-50'
      )}
    >
      {children}
    </div>
  )
}

interface DraggableCalendarProps {
  weeks: Date[][]
  tasks: Task[]
  lists: List[]
  currentMonth: Date
  onTaskClick: (task: Task) => void
  onTasksUpdate: () => void
  getTasksForDate: (date: Date) => Task[]
  getTaskColor: (task: Task) => string
  renderDateCell: (
    day: Date,
    dayIndex: number,
    weekIndex: number,
    dayTasks: Task[],
    renderTasksFn: (tasks: Task[]) => React.ReactNode
  ) => React.ReactNode
}

export default function DraggableCalendar({
  weeks,
  tasks,
  lists,
  currentMonth,
  onTaskClick,
  onTasksUpdate,
  getTasksForDate,
  getTaskColor,
  renderDateCell
}: DraggableCalendarProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // 配置传感器：桌面端3px激活，移动端长按1秒激活
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 移动3px后才开始拖拽
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 1000, // 长按1秒激活
        tolerance: 5, // 移动容差5px
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = active.data.current?.task as Task
    if (task) {
      setActiveTask(task)
    }
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const task = active.data.current?.task as Task
    const targetDateStr = over.id as string

    if (!task || !targetDateStr) return

    // 如果拖拽到同一日期，不做任何操作
    if (task.dueDate === targetDateStr) return

    // 乐观更新：先更新本地状态
    const oldDueDate = task.dueDate
    task.dueDate = targetDateStr

    try {
      // 调用API更新任务
      await taskAPI.updateTask(task.id, {
        dueDate: targetDateStr,
        dueTime: task.dueTime // 保留原有时间
      })
      
      // 刷新任务列表
      onTasksUpdate()
    } catch (error) {
      console.error('Failed to update task:', error)
      // 如果失败，回滚本地状态
      task.dueDate = oldDueDate
      alert('更新任务失败，请重试')
      onTasksUpdate()
    }
  }, [onTasksUpdate])

  // 渲染可拖拽的任务
  const renderDraggableTasks = useCallback((dayTasks: Task[]) => {
    const visibleTasks = dayTasks.slice(0, 3)
    
    return (
      <>
        {visibleTasks.map((task) => {
          const taskColor = getTaskColor(task)
          return (
            <DraggableCalendarTask
              key={task.id}
              task={task}
              taskColor={taskColor}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </>
    )
  }, [getTaskColor, onTaskClick])

  // 获取所有任务ID用于SortableContext
  const taskIds = tasks.map(t => t.id.toString())

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={taskIds} strategy={rectSortingStrategy}>
        <div className="flex-1 flex flex-col bg-white">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex-1 grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((day, dayIndex) => {
                const dateStr = formatDateToApiString(day)
                const dayTasks = getTasksForDate(day)
                
                return (
                  <DroppableDateCell key={dateStr} date={day}>
                    {renderDateCell(day, dayIndex, weekIndex, dayTasks, renderDraggableTasks)}
                  </DroppableDateCell>
                )
              })}
            </div>
          ))}
        </div>
      </SortableContext>

      {/* 拖拽预览 */}
      <DragOverlay>
        {activeTask ? (
          <div
            className="text-xs px-3 py-2 rounded-md shadow-xl border-2 cursor-move"
            style={{
              backgroundColor: 'white',
              borderColor: getTaskColor(activeTask),
              color: getTaskColor(activeTask)
            }}
          >
            <span className="font-medium">{activeTask.title}</span>
            {activeTask.dueTime && (
              <span className="ml-2 text-gray-500">{activeTask.dueTime}</span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

