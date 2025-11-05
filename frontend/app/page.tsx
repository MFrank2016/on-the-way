'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // 等待 zustand 恢复数据后再检查认证状态
    if (!_hasHydrated) return

    if (isAuthenticated) {
      router.push('/today')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">加载中...</div>
    </div>
  )
}
