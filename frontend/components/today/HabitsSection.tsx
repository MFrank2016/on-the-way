import { useState } from 'react'
import { Habit } from '@/types'

interface HabitsSectionProps {
  habits: Habit[]
  onCheck: (habitId: number) => void
}

export function HabitsSection({ habits, onCheck }: HabitsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (habits.length === 0) return null

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-sm font-medium text-gray-700 mb-3 flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        习惯打卡
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {habits.length}
        </span>
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="group flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition"
            >
              <button
                onClick={() => onCheck(habit.id)}
                className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center transition"
              >
              </button>
              
              <span className="text-sm text-gray-900 flex-1">{habit.name}</span>
              
              {habit.currentStreak && habit.currentStreak > 0 && (
                <span className="text-xs text-gray-500">
                  🔥 {habit.currentStreak} 天
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

