'use client'

import { useState } from 'react'
import { searchAPI } from '@/lib/api'
import { Task } from '@/types'
import { Search, FileText, FolderOpen, Tag, X } from 'lucide-react'
import TaskItem from '@/components/TaskItem'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const response = await searchAPI.search(searchQuery)
      setResults(response.data.data)
    } catch (error) {
      console.error('Failed to search:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    // 实时搜索（可选，也可以等用户按回车）
    if (value.length >= 2) {
      handleSearch(value)
    } else if (value.length === 0) {
      setResults(null)
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults(null)
  }

  const handleCompleteTask = async (taskId: string) => {
    // TODO: 实现完成任务
    console.log('Complete task:', taskId)
  }

  const handleDeleteTask = async (taskId: string) => {
    // TODO: 实现删除任务
    console.log('Delete task:', taskId)
  }

  const handleEditTask = (task: Task) => {
    // TODO: 实现编辑任务
    console.log('Edit task:', task)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 搜索框 */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="搜索任务、标签和清单..."
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition outline-none bg-white text-gray-900 placeholder:text-gray-400"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* 搜索结果 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">搜索中...</div>
        </div>
      ) : results ? (
        <div className="space-y-8">
          {/* 任务结果 */}
          {results.tasks && results.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  任务 ({results.tasks.length})
                </h2>
              </div>
              <div className="space-y-2">
                {results.tasks.map((task: Task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 清单结果 */}
          {results.lists && results.lists.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  清单 ({results.lists.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.lists.map((list: any) => (
                  <div
                    key={list.id}
                    className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: list.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{list.name}</div>
                      <div className="text-sm text-gray-500">{list.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 标签结果 */}
          {results.tags && results.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  标签 ({results.tags.length})
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.tags.map((tag: any) => (
                  <div
                    key={tag.id}
                    className="px-4 py-2 bg-white rounded-full border border-gray-200 hover:shadow-md transition cursor-pointer"
                    style={{ borderColor: tag.color }}
                  >
                    <span className="font-medium" style={{ color: tag.color }}>
                      #{tag.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 无结果 */}
          {(!results.tasks || results.tasks.length === 0) &&
           (!results.lists || results.lists.length === 0) &&
           (!results.tags || results.tags.length === 0) && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-gray-400 text-lg mb-2">未找到相关内容</div>
              <div className="text-gray-500 text-sm">尝试使用其他关键词</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-gray-400 text-lg mb-2">开始搜索</div>
          <div className="text-gray-500 text-sm">输入关键词搜索任务、清单和标签</div>
          
          {/* 搜索提示 */}
          <div className="mt-8 max-w-md mx-auto text-left">
            <h3 className="font-semibold text-gray-900 mb-3">💡 搜索技巧</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 输入任务标题或描述的关键词</li>
              <li>• 搜索清单名称快速跳转</li>
              <li>• 使用标签名查找相关任务</li>
              <li>• 至少输入2个字符开始搜索</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

