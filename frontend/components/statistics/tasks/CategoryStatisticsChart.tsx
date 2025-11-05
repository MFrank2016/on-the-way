'use client'

import { TaskCategoryStats } from '@/types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChevronDown } from 'lucide-react'

interface CategoryStatisticsChartProps {
  categoryData: TaskCategoryStats[]
  categoryType: string
  completedCount: number
  onCategoryTypeChange: (type: string) => void
}

export default function CategoryStatisticsChart({
  categoryData,
  categoryType,
  completedCount,
  onCategoryTypeChange,
}: CategoryStatisticsChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">已完成分类统计</h3>
        <div className="relative">
          <button
            onClick={() => {
              const dropdown = document.getElementById('category-type-dropdown')
              if (dropdown) {
                dropdown.classList.toggle('hidden')
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <span className="text-gray-600">按{categoryType === 'list' ? '清单' : '标签'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <div
            id="category-type-dropdown"
            className="hidden absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[100px]"
          >
            <button
              onClick={() => {
                onCategoryTypeChange('list')
                document.getElementById('category-type-dropdown')?.classList.add('hidden')
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                categoryType === 'list' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
            >
              {categoryType === 'list' && <span className="mr-2">✓</span>}
              按清单
            </button>
            <button
              onClick={() => {
                onCategoryTypeChange('tag')
                document.getElementById('category-type-dropdown')?.classList.add('hidden')
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                categoryType === 'tag' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
            >
              {categoryType === 'tag' && <span className="mr-2">✓</span>}
              按标签
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex-1">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-5xl font-bold"
                  fill="#111827"
                >
                  {completedCount}
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm"
                  fill="#6b7280"
                >
                  完成数量
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-300 mb-2">0</div>
                    <div className="text-sm text-gray-400">完成数量</div>
                  </div>
                </div>
                <p className="text-gray-400 mt-6">暂无数据</p>
              </div>
            </div>
          )}
        </div>
        {categoryData.length > 0 && (
          <div className="ml-8 space-y-3">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-900 font-medium">{item.count}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm">{item.listName.slice(0, 2)}</span>
                  <span className="text-sm text-gray-600">{item.listName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

