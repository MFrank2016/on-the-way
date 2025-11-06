import { useState } from 'react'
import { Check } from 'lucide-react'
import { Habit } from '@/types'

interface CompletedHabitsSectionProps {
  habits: Habit[]
  completedTasksCount: number
  onUncheck: (habitId: number) => void
}

export function CompletedHabitsSection({
  habits,
  completedTasksCount,
  onUncheck,
}: CompletedHabitsSectionProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAllCompleted, setShowAllCompleted] = useState(false)

  if (habits.length === 0) return null

  const displayHabits = showAllCompleted 
    ? habits 
    : habits.slice(0, 5 - Math.min(completedTasksCount, 5))

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowCompleted(!showCompleted)}
        className="w-full text-left text-sm font-medium text-gray-700 mb-3 flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        已完成习惯
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {habits.length}
        </span>
      </button>
      
      {showCompleted && (
        <div className="space-y-2">
          {displayHabits.map((habit) => (
            <div
              key={habit.id}
              className="group flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
            >
              <button
                onClick={() => onUncheck(habit.id)}
                className="flex-shrink-0 w-4 h-4 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </button>
              
              <span className="text-sm flex-1 line-through text-gray-400">{habit.name}</span>
              
              {habit.currentStreak && habit.currentStreak > 0 && (
                <span className="text-xs text-gray-400">
                  🔥 {habit.currentStreak} 天
                </span>
              )}
            </div>
          ))}
          
          {!showAllCompleted && (completedTasksCount + habits.length) > 5 && (
            <button
              onClick={() => setShowAllCompleted(true)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 text-center"
            >
              查看更多
            </button>
          )}
        </div>
      )}
    </div>
  )
}

