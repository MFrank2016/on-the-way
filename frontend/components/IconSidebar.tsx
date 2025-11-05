'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  CheckSquare, 
  Calendar, 
  Grid2X2,
  Timer,
  Heart,
  Search,
  Clock,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconSidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
}

const navigationItems = [
  { id: 'task', icon: CheckSquare, label: '任务', href: '/today' },
  { id: 'calendar', icon: Calendar, label: '日历', href: '/calendar' },
  { id: 'quadrant', icon: Grid2X2, label: '四象限', href: '/quadrant' },
  { id: 'pomodoro', icon: Timer, label: '番茄', href: '/pomodoro' },
  { id: 'habit', icon: Heart, label: '习惯', href: '/habits' },
  { id: 'search', icon: Search, label: '搜索', href: '/search' },
  { id: 'countdown', icon: Clock, label: '倒数日', href: '/countdowns' },
  { id: 'statistics', icon: BarChart3, label: '统计', href: '/statistics' },
]

export default function IconSidebar({ activeModule, onModuleChange }: IconSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = (item: typeof navigationItems[0]) => {
    if (item.id === 'task') {
      // 任务模块：设置模块并跳转
      onModuleChange('task')
      router.push(item.href)
    } else {
      // 其他模块：关闭任务侧边栏并跳转
      onModuleChange(item.id)
      router.push(item.href)
    }
  }

  const isActive = (item: typeof navigationItems[0]) => {
    if (item.id === 'task') {
      return pathname?.startsWith('/today') || 
             pathname?.startsWith('/inbox') || 
             pathname === '/'
    }
    return pathname?.startsWith(item.href)
  }

  return (
    <aside className="hidden lg:flex w-16 bg-white border-r border-gray-200 flex-col items-center py-4 gap-2">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        
        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => handleClick(item)}
              className={cn(
                'relative w-12 h-12 flex items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {/* 左侧激活指示器 */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
              <Icon className="w-6 h-6" />
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {item.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          </div>
        )
      })}
    </aside>
  )
}

