'use client'

import { Task, List, Tag } from '@/types'
import { Clock, Tag as TagIcon, ListTodo, Plus } from 'lucide-react'
import { formatDateString, cn } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'
import QuickAddTaskNew from './QuickAddTaskNew'

interface TaskGroup {
  id: string
  label: string
  tasks: Task[]
  sortOrder: number
}

interface KanbanViewProps {
  groups: TaskGroup[]
  lists: List[]
  tags: Tag[]
  onTaskClick: (task: Task) => void
  onComplete: (taskId: string) => void
  onAddTask: (data: any) => Promise<void>
  showDetail: boolean
  currentListId?: number // 当前清单视图的ID，用于在清单视图中创建任务
}

export default function KanbanView({
  groups,
  lists,
  tags,
  onTaskClick,
  onComplete,
  onAddTask,
  showDetail,
  currentListId,
}: KanbanViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [activeAddGroup, setActiveAddGroup] = useState<string | null>(null)

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在空白区域按下时才启用拖动
    if (e.target === containerRef.current) {
      setIsDragging(true)
      setStartX(e.pageX - (containerRef.current?.offsetLeft || 0))
      setScrollLeft(containerRef.current?.scrollLeft || 0)
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing'
      }
    }
  }

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - (containerRef.current.offsetLeft || 0)
    const walk = (x - startX) * 1.5 // 滚动速度倍数
    containerRef.current.scrollLeft = scrollLeft - walk
  }

  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    setIsDragging(false)
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  // 处理鼠标离开容器
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab'
      }
    }
  }

  // 清理事件监听器
  useEffect(() => {
    return () => {
      setIsDragging(false)
    }
  }, [])

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">暂无任务</div>
        <div className="text-gray-500 text-sm">点击上方按钮添加新任务</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'kanban-scrollbar',
        'flex gap-4 overflow-x-auto pb-4',
        isDragging ? 'select-none cursor-grabbing' : 'cursor-grab'
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#D1D5DB #F3F4F6',
      }}
    >
      {groups.map((group) => (
        <div
          key={group.id}
          className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-3 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          {/* Group Header */}
          <div className="flex items-center justify-between mb-3 px-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">
                {group.label}
              </h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                {group.tasks.length}
              </span>
            </div>
            <button
              onClick={() => setActiveAddGroup(group.id)}
              className="p-1 hover:bg-white rounded transition-colors text-gray-500 hover:text-gray-700"
              title="添加任务"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add Task */}
          {activeAddGroup === group.id && (
            <div className="mb-2 flex-shrink-0">
              <QuickAddTaskNew
                onAdd={async (data) => {
                  // 根据分组类型智能设置任务属性
                  const enhancedData = { ...data }
                  
                  // 如果是按优先级分组，设置对应的优先级
                  if (group.id.startsWith('priority-')) {
                    const priority = parseInt(group.id.replace('priority-', ''))
                    enhancedData.priority = priority
                  }
                  
                  // 如果是按清单分组，设置对应清单的ID
                  if (group.id.startsWith('list-')) {
                    const listId = parseInt(group.id.replace('list-', ''))
                    enhancedData.listId = listId
                  } else if (currentListId) {
                    // 如果在清单视图中（但不是按清单分组），使用当前清单ID
                    enhancedData.listId = currentListId
                  }
                  
                  await onAddTask(enhancedData)
                  setActiveAddGroup(null)
                }}
                onCancel={() => setActiveAddGroup(null)}
                lists={lists}
                tags={tags}
                placeholder="添加任务..."
                compact={true}
              />
            </div>
          )}

          {/* Task Cards - 可滚动区域 */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-1 kanban-column-scrollbar">
            {group.tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                lists={lists}
                tags={tags}
                onClick={() => onTaskClick(task)}
                onComplete={() => onComplete(task.id.toString())}
                showDetail={showDetail}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface KanbanCardProps {
  task: Task
  lists: List[]
  tags: Tag[]
  onClick: () => void
  onComplete: () => void
  showDetail: boolean
}

const priorityColors = {
  0: 'border-gray-200',
  1: 'border-l-4 border-l-blue-500',
  2: 'border-l-4 border-l-yellow-500',
  3: 'border-l-4 border-l-red-500',
}

function KanbanCard({ task, lists, tags, onClick, onComplete, showDetail }: KanbanCardProps) {
  const taskList = lists.find((l) => l.id === task.listId)
  const taskTags = task.tags || []

  const isOverdue = () => {
    if (!task.dueDate || task.status !== 'todo') return false
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return task.dueDate < today
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer',
        task.status === 'completed' && 'opacity-60',
        priorityColors[task.priority as keyof typeof priorityColors]
      )}
    >
      {/* Checkbox and Title */}
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComplete()
          }}
          className={cn(
            'flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center transition',
            task.status === 'completed'
              ? 'bg-blue-600 border-blue-600'
              : 'border-gray-300 hover:border-blue-500'
          )}
        >
          {task.status === 'completed' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm font-medium break-words',
              task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
            )}
          >
            {task.title}
          </div>
        </div>
      </div>

      {/* Description (if showDetail) */}
      {showDetail && task.description && (
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-1.5">
        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className={cn(
              isOverdue() ? 'text-red-500 font-medium' : 'text-gray-600'
            )}>
              {formatDateString(task.dueDate)}
              {task.dueTime && ` ${task.dueTime}`}
            </span>
          </div>
        )}

        {/* List */}
        {taskList && (
          <div className="flex items-center gap-1.5 text-xs">
            <ListTodo className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">
              {taskList.icon} {taskList.name}
            </span>
          </div>
        )}

        {/* Tags */}
        {taskTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <div className="flex gap-1 flex-wrap">
              {taskTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

