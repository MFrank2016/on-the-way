'use client'

import { cn } from '@/lib/utils'
import { List, Columns3, Clock } from 'lucide-react'

interface ViewTypeSelectorProps {
  value: 'list' | 'kanban' | 'timeline'
  onChange: (viewType: 'list' | 'kanban' | 'timeline') => void
}

export default function ViewTypeSelector({ value, onChange }: ViewTypeSelectorProps) {
  const viewTypes = [
    {
      value: 'list' as const,
      label: '列表视图',
      icon: List,
      disabled: false
    },
    {
      value: 'kanban' as const,
      label: '看板视图',
      icon: Columns3,
      disabled: true, // PRO 功能
      pro: true
    },
    {
      value: 'timeline' as const,
      label: '时间线视图',
      icon: Clock,
      disabled: false
    }
  ]

  return (
    <div className="flex gap-2">
      {viewTypes.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => !type.disabled && onChange(type.value)}
            disabled={type.disabled}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition',
              value === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300',
              type.disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={type.disabled ? 'PRO 功能' : type.label}
          >
            <Icon className={cn(
              'w-6 h-6',
              value === type.value ? 'text-blue-600' : 'text-gray-600'
            )} />
            <span className={cn(
              'text-xs',
              value === type.value ? 'text-blue-600 font-medium' : 'text-gray-600'
            )}>
              {type.label}
            </span>
            {type.pro && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                PRO
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

