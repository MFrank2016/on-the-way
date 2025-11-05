'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Inbox, 
  Calendar, 
  Target,
  BarChart3,
  Timer,
  Grid2X2,
  Heart,
  Clock,
  Search,
  Plus,
  FolderPlus,
  ListPlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import FolderTree from './FolderTree'
import FolderDialog from './FolderDialog'
import { folderAPI, listAPI } from '@/lib/api'
import { Folder, List } from '@/types'

const menuItems = [
  { icon: CheckSquare, label: '今日待办', href: '/today' },
  { icon: Inbox, label: '收集箱', href: '/inbox' },
  { icon: Calendar, label: '日历', href: '/calendar' },
  { icon: Grid2X2, label: '四象限', href: '/quadrant' },
  { icon: Timer, label: '番茄专注', href: '/pomodoro' },
  { icon: BarChart3, label: '统计', href: '/statistics' },
  { icon: Heart, label: '习惯打卡', href: '/habits' },
  { icon: Clock, label: '倒数日', href: '/countdowns' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [folders, setFolders] = useState<Folder[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showListDialog, setShowListDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [showListsSection, setShowListsSection] = useState(true)

  useEffect(() => {
    loadFolders()
    loadLists()
  }, [])

  const loadFolders = async () => {
    try {
      const response = await folderAPI.getFolders()
      setFolders(response.data.data || [])
    } catch (error) {
      console.error('Failed to load folders:', error)
    }
  }

  const loadLists = async () => {
    try {
      const response = await listAPI.getLists()
      setLists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load lists:', error)
    }
  }

  const handleSaveFolder = async (folderData: any) => {
    try {
      if (editingFolder) {
        await folderAPI.updateFolder(editingFolder.id, folderData)
      } else {
        await folderAPI.createFolder(folderData)
      }
      loadFolders()
      setShowFolderDialog(false)
      setEditingFolder(null)
    } catch (error) {
      console.error('Failed to save folder:', error)
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    try {
      await folderAPI.deleteFolder(folder.id)
      loadFolders()
      loadLists() // 重新加载清单，因为可能有清单被移出
    } catch (error) {
      console.error('Failed to delete folder:', error)
    }
  }

  const handleToggleExpand = async (folderId: string) => {
    try {
      await folderAPI.toggleExpand(folderId)
      loadFolders()
    } catch (error) {
      console.error('Failed to toggle folder:', error)
    }
  }

  const handleDeleteList = async (list: List) => {
    try {
      await listAPI.deleteList(list.id)
      loadLists()
    } catch (error) {
      console.error('Failed to delete list:', error)
    }
  }

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 h-screen flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">On The Way</h1>
          <p className="text-sm text-gray-500 mt-1">时间管理助手</p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <Link href="/search">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">搜索任务、清单...</span>
            </div>
          </Link>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* 主菜单 */}
          <div className="px-2 space-y-1 mb-6">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition cursor-pointer',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* 清单与文件夹 */}
          <div className="px-2">
            <div className="flex items-center justify-between px-2 mb-2">
              <button
                onClick={() => setShowListsSection(!showListsSection)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showListsSection ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                清单
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingFolder(null)
                    setShowFolderDialog(true)
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="新建文件夹"
                >
                  <FolderPlus className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    setEditingList(null)
                    setShowListDialog(true)
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="新建清单"
                >
                  <ListPlus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {showListsSection && (
              <div className="mt-2">
                <FolderTree
                  folders={folders}
                  lists={lists}
                  onFolderEdit={(folder) => {
                    setEditingFolder(folder)
                    setShowFolderDialog(true)
                  }}
                  onFolderDelete={handleDeleteFolder}
                  onListEdit={(list) => {
                    setEditingList(list)
                    setShowListDialog(true)
                  }}
                  onListDelete={handleDeleteList}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">用户</div>
              <div className="text-xs text-gray-500">查看个人资料</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 文件夹对话框 */}
      {showFolderDialog && (
        <FolderDialog
          folder={editingFolder}
          folders={folders}
          onSave={handleSaveFolder}
          onClose={() => {
            setShowFolderDialog(false)
            setEditingFolder(null)
          }}
        />
      )}

      {/* 清单对话框（简化版，可以后续完善） */}
      {showListDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingList ? '编辑清单' : '新建清单'}
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              清单管理功能开发中...
            </p>
            <button
              onClick={() => {
                setShowListDialog(false)
                setEditingList(null)
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  )
}
