'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  icon?: React.ReactNode
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
  icon,
}: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    green: 'from-green-50 to-green-100 text-green-600 border-green-200',
    purple: 'from-purple-50 to-purple-100 text-purple-600 border-purple-200',
    orange: 'from-orange-50 to-orange-100 text-orange-600 border-orange-200',
    red: 'from-red-50 to-red-100 text-red-600 border-red-200',
  }

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border-2 transition-transform hover:scale-105`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium opacity-90">{title}</div>
        {icon && <div className="opacity-70">{icon}</div>}
      </div>

      <div className="text-3xl font-bold mb-1">{value}</div>

      {subtitle && (
        <div className="text-xs opacity-75 mt-1">{subtitle}</div>
      )}

      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.isPositive ? (
            <ArrowUp className="w-4 h-4 text-green-600" />
          ) : (
            <ArrowDown className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {Math.abs(trend.value)}%
          </span>
        </div>
      )}
    </div>
  )
}

