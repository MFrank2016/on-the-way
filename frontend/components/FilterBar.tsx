'use client'

import { Calendar, Inbox as InboxIcon, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilterStore, PRESET_FILTERS, FilterConfig } from '@/stores/filterStore'
import { List, Filter } from '@/types'

interface TaskCounts {
  all?: number
  today?: number
  tomorrow?: number
  week?: number
  inbox?: number
  [key: string]: number | undefined
}

interface FilterBarProps {
  lists?: List[]
  taskCounts?: TaskCounts
  pinnedFilters?: Filter[]
  onPinnedFilterClick?: (filter: Filter) => void
}

export default function FilterBar({ lists = [], taskCounts = {}, pinnedFilters = [], onPinnedFilterClick }: FilterBarProps) {
  const { activeFilter, setFilter } = useFilterStore()

  // 找到收集箱
  const inboxList = lists.find(l => l.isDefault || l.type === 'inbox')

  const quickFilters = [
    { ...PRESET_FILTERS.all, icon: Folder, count: taskCounts.all },
    { ...PRESET_FILTERS.today, icon: Calendar, count: taskCounts.today },
    { ...PRESET_FILTERS.tomorrow, icon: Calendar, count: taskCounts.tomorrow },
    { ...PRESET_FILTERS.week, icon: Calendar, count: taskCounts.week },
  ]

  const isFilterActive = (filter: FilterConfig) => {
    return JSON.stringify(activeFilter) === JSON.stringify(filter)
  }

  const isCustomFilterActive = (filter: Filter) => {
    return activeFilter.customFilterId === filter.id
  }

  return (
    <div className="px-3 py-3 border-b border-gray-200">
      {/* 置顶过滤器区域 */}
      {pinnedFilters.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-2 px-1">置顶过滤器</div>
          <div className="space-y-1">
            {pinnedFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onPinnedFilterClick?.(filter)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm',
                  isCustomFilterActive(filter)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className="text-base">{filter.icon || '🔍'}</span>
                <span className="flex-1 text-left">{filter.name}</span>
                {taskCounts[`filter_${filter.id}`] !== undefined && taskCounts[`filter_${filter.id}`]! > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {taskCounts[`filter_${filter.id}`]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 基础过滤器 */}
      <div className="space-y-1">
        {quickFilters.map((filter) => {
          const Icon = filter.icon
          const active = isFilterActive(filter)
          
          return (
            <button
              key={filter.label}
              onClick={() => setFilter(filter)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm',
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{filter.label}</span>
              {filter.count !== undefined && filter.count > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {filter.count}
                </span>
              )}
            </button>
          )
        })}

        {/* 收集箱 */}
        {inboxList && (
          <button
            onClick={() => setFilter({ type: 'list', listId: inboxList.id, label: '收集箱' })}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm',
              activeFilter.type === 'list' && activeFilter.listId === inboxList.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <InboxIcon className="w-4 h-4" />
            <span className="flex-1 text-left">收集箱</span>
            {taskCounts.inbox !== undefined && taskCounts.inbox > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {taskCounts.inbox}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

