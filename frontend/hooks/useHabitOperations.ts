import { habitAPI } from '@/lib/api'

export function useHabitOperations(loadHabits: () => Promise<void>) {
  const handleCheckHabit = async (habitId: number) => {
    try {
      await habitAPI.checkIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to check habit:', error)
    }
  }

  const handleUncheckHabit = async (habitId: number) => {
    try {
      await habitAPI.cancelCheckIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to uncheck habit:', error)
    }
  }

  return {
    handleCheckHabit,
    handleUncheckHabit,
  }
}

