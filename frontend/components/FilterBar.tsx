'use client'

import { Calendar, Inbox as InboxIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilterStore, PRESET_FILTERS, FilterConfig } from '@/stores/filterStore'
import { List } from '@/types'

interface FilterBarProps {
  lists?: List[]
}

export default function FilterBar({ lists = [] }: FilterBarProps) {
  const { activeFilter, setFilter } = useFilterStore()

  // 找到收集箱
  const inboxList = lists.find(l => l.isDefault || l.type === 'inbox')

  const quickFilters = [
    { ...PRESET_FILTERS.today, icon: Calendar },
    { ...PRESET_FILTERS.tomorrow, icon: Calendar },
    { ...PRESET_FILTERS.week, icon: Calendar },
  ]

  const isFilterActive = (filter: FilterConfig) => {
    return JSON.stringify(activeFilter) === JSON.stringify(filter)
  }

  return (
    <div className="px-3 py-3 border-b border-gray-200">
      {/* 特殊过滤器 */}
      <div className="mb-3">
        <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
          <span>过滤条件</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 快捷过滤器 */}
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
              {active && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                  活跃
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
          </button>
        )}
      </div>
    </div>
  )
}

