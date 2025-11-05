import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      
      // 登录方法 - 同时设置 user 和 token
      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 持久化后的回调，用于初始化认证状态
      onRehydrateStorage: () => (state) => {
        // 恢复数据后，根据 user 和 token 设置 isAuthenticated
        if (state) {
          if (state.user && state.token) {
            state.isAuthenticated = true
          }
          // 标记已完成水合
          state._hasHydrated = true
        }
      },
    }
  )
)

