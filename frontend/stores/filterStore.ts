import { create } from 'zustand'
import { Filter } from '@/types'

export interface FilterConfig {
  type: 'date' | 'list' | 'tag' | 'priority' | 'custom' | 'all'
  label?: string
  listId?: number
  days?: number  // N天内截止
  tagIds?: number[]
  priority?: number
  status?: 'todo' | 'completed' | 'all'
  customFilterId?: number  // 自定义过滤器ID
}

interface FilterStore {
  activeFilter: FilterConfig
  customFilters: Filter[]
  
  setFilter: (filter: FilterConfig) => void
  clearFilter: () => void
  setCustomFilters: (filters: Filter[]) => void
  addCustomFilter: (filter: Filter) => void
  updateCustomFilter: (id: number, filter: Filter) => void
  removeCustomFilter: (id: number) => void
}

// 预设过滤器 - 简化为基础选项
export const PRESET_FILTERS = {
  all: { type: 'all' as const, label: '所有' },
  today: { type: 'date' as const, days: 0, label: '今天' },
  tomorrow: { type: 'date' as const, days: 1, label: '明天' },
  week: { type: 'date' as const, days: 7, label: '最近7天' },
}

export const useFilterStore = create<FilterStore>((set) => ({
  activeFilter: PRESET_FILTERS.all,
  customFilters: [],
  
  setFilter: (filter) => set({ activeFilter: filter }),
  
  clearFilter: () => set({ activeFilter: PRESET_FILTERS.all }),
  
  setCustomFilters: (filters) => set({ customFilters: filters }),
  
  addCustomFilter: (filter) => set((state) => ({
    customFilters: [...state.customFilters, filter]
  })),
  
  updateCustomFilter: (id, filter) => set((state) => ({
    customFilters: state.customFilters.map((f) => (f.id === id ? filter : f))
  })),
  
  removeCustomFilter: (id) => set((state) => ({
    customFilters: state.customFilters.filter((f) => f.id !== id)
  })),
}))

