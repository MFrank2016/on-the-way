'use client'

import { Task } from '@/types'
import TaskItem from './TaskItem'
import { ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

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
  // 管理每个分组的展开/收起状态
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // 初始化展开状态：已完成&已放弃分组默认收起，其他分组默认展开
  useEffect(() => {
    setExpandedGroups((prev) => {
      const newState = { ...prev }
      let hasChanges = false
      
      groups.forEach((group) => {
        // 如果之前没有设置过状态，则根据分组类型设置默认值
        if (newState[group.id] === undefined) {
          newState[group.id] = group.id !== 'completed'
          hasChanges = true
        }
      })
      
      return hasChanges ? newState : prev
    })
  }, [groups])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

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
      {groups.map((group) => {
        const isExpanded = expandedGroups[group.id] ?? true
        
        return (
          <div key={group.id} className="space-y-2">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-2 px-2 hover:bg-gray-50 rounded transition"
            >
              <ChevronRight
                className={cn(
                  'w-4 h-4 text-gray-500 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
              <div className="text-sm font-medium text-gray-700">
                {group.label} ({group.tasks.length})
              </div>
              <div className="flex-1 h-px bg-gray-200" />
            </button>

            {/* Tasks */}
            {isExpanded && (
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
            )}
          </div>
        )
      })}
    </div>
  )
}

