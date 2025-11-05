import { create } from 'zustand'
import { Task, List } from '@/types'

interface TaskState {
  tasks: Task[]
  lists: List[]
  selectedList: string | null
  setTasks: (tasks: Task[]) => void
  setLists: (lists: List[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, task: Partial<Task>) => void
  deleteTask: (id: string) => void
  setSelectedList: (listId: string | null) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  lists: [],
  selectedList: null,
  setTasks: (tasks) => set({ tasks }),
  setLists: (lists) => set({ lists }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  setSelectedList: (listId) => set({ selectedList: listId }),
}))

