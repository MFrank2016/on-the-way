'use client'

import { usePathname, useRouter } from 'next/navigation'
import { CheckSquare, Calendar, Grid2X2, Timer, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'task', icon: CheckSquare, label: '任务', href: '/today' },
  { id: 'calendar', icon: Calendar, label: '日历', href: '/calendar' },
  { id: 'quadrant', icon: Grid2X2, label: '四象限', href: '/quadrant' },
  { id: 'pomodoro', icon: Timer, label: '番茄', href: '/pomodoro' },
  { id: 'me', icon: User, label: '我的', href: '/settings' },
]

export default function MobileNavBar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/today') {
      return pathname === '/' || pathname?.startsWith('/today') || pathname?.startsWith('/inbox')
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition min-w-0',
                active ? 'text-blue-600' : 'text-gray-600'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

