import { create } from 'zustand'

export interface FilterConfig {
  type: 'date' | 'list' | 'tag' | 'priority' | 'custom' | 'all'
  label?: string
  listId?: number
  days?: number  // N天内截止
  tagIds?: number[]
  priority?: number
  status?: 'todo' | 'completed' | 'all'
}

interface FilterStore {
  activeFilter: FilterConfig
  customFilters: FilterConfig[]
  
  setFilter: (filter: FilterConfig) => void
  clearFilter: () => void
  addCustomFilter: (filter: FilterConfig) => void
  removeCustomFilter: (index: number) => void
}

// 预设过滤器
export const PRESET_FILTERS = {
  today: { type: 'date' as const, days: 0, label: '今天' },
  tomorrow: { type: 'date' as const, days: 1, label: '明天' },
  week: { type: 'date' as const, days: 7, label: '最近7天' },
  all: { type: 'all' as const, label: '全部任务' },
}

export const useFilterStore = create<FilterStore>((set) => ({
  activeFilter: PRESET_FILTERS.today,
  customFilters: [],
  
  setFilter: (filter) => set({ activeFilter: filter }),
  
  clearFilter: () => set({ activeFilter: PRESET_FILTERS.all }),
  
  addCustomFilter: (filter) => set((state) => ({
    customFilters: [...state.customFilters, filter]
  })),
  
  removeCustomFilter: (index) => set((state) => ({
    customFilters: state.customFilters.filter((_, i) => i !== index)
  })),
}))

