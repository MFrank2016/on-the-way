import { create } from 'zustand'

interface PomodoroState {
  isRunning: boolean
  isPaused: boolean
  timeLeft: number // 秒数
  totalTime: number
  currentTaskId: string | null
  currentPomodoroId: string | null
  start: (taskId?: string, duration?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  tick: () => void
  setCurrentPomodoroId: (id: string) => void
}

const DEFAULT_DURATION = 25 * 60 // 25分钟

export const usePomodoroStore = create<PomodoroState>((set) => ({
  isRunning: false,
  isPaused: false,
  timeLeft: DEFAULT_DURATION,
  totalTime: DEFAULT_DURATION,
  currentTaskId: null,
  currentPomodoroId: null,
  start: (taskId, duration = DEFAULT_DURATION) =>
    set({
      isRunning: true,
      isPaused: false,
      timeLeft: duration,
      totalTime: duration,
      currentTaskId: taskId || null,
    }),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  stop: () =>
    set({
      isRunning: false,
      isPaused: false,
      timeLeft: DEFAULT_DURATION,
      totalTime: DEFAULT_DURATION,
      currentTaskId: null,
      currentPomodoroId: null,
    }),
  tick: () =>
    set((state) => {
      if (state.isRunning && !state.isPaused && state.timeLeft > 0) {
        return { timeLeft: state.timeLeft - 1 }
      }
      return state
    }),
  setCurrentPomodoroId: (id) => set({ currentPomodoroId: id }),
}))

