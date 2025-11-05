'use client'

import { BarChart3 } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
}

export default function EmptyState({
  icon,
  title = '暂无数据',
  description = '开始使用应用后，这里将显示你的统计数据',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-gray-400">
        {icon || <BarChart3 className="w-16 h-16" />}
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  )
}

