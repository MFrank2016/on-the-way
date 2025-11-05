import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  showTaskSidebar: boolean
  activeModule: string
  showMobileMenu: boolean
  toggleTaskSidebar: () => void
  setShowTaskSidebar: (show: boolean) => void
  setActiveModule: (module: string) => void
  toggleMobileMenu: () => void
  setShowMobileMenu: (show: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      showTaskSidebar: true,
      activeModule: 'task',
      showMobileMenu: false,
      
      toggleTaskSidebar: () => set((state) => ({ 
        showTaskSidebar: !state.showTaskSidebar 
      })),
      
      setShowTaskSidebar: (show) => set({ showTaskSidebar: show }),
      
      setActiveModule: (module) => set({ 
        activeModule: module,
        // 只有任务模块显示侧边栏
        showTaskSidebar: module === 'task'
      }),
      
      toggleMobileMenu: () => set((state) => ({ 
        showMobileMenu: !state.showMobileMenu 
      })),
      
      setShowMobileMenu: (show) => set({ showMobileMenu: show }),
    }),
    {
      name: 'ui-storage',
    }
  )
)

