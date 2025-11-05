'use client'

import { ArrowLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MobileHeader() {
  const router = useRouter()

  return (
    <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-blue-600">On The Way</h1>
          <p className="text-xs text-gray-500">时间管理助手</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/search')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="搜索"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => router.push('/today')}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            aria-label="返回今日待办"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回</span>
          </button>
        </div>
      </div>
    </header>
  )
}

