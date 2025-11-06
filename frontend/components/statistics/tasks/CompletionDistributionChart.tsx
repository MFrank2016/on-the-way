'use client'

import { PieChart, Pie, ResponsiveContainer } from 'recharts'

interface CompletionDistributionChartProps {
  completionData: {
    completed: number
    onTime: number
    overdue: number
    noDueDate: number
    uncompleted: number
    completionRate: number
  }
}

export default function CompletionDistributionChart({ completionData }: CompletionDistributionChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">完成率分布</h3>
      <div className="flex items-center">
        <div className="flex-1">
          {completionData.completed > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: '按时完成', value: completionData.onTime, fill: '#ef4444' },
                    { name: '逾期完成', value: completionData.overdue, fill: '#3b82f6' },
                    { name: '无日期任务', value: completionData.noDueDate, fill: '#eab308' },
                    { name: '未完成', value: completionData.uncompleted, fill: '#9ca3af' },
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                </Pie>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold"
                  fill="#111827"
                >
                  {completionData.completionRate.toFixed(0)}%
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm"
                  fill="#6b7280"
                >
                  完成率
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 rounded-full border-8 border-gray-100 flex items-center justify-center mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-300">0%</div>
                    <div className="text-sm text-gray-400 mt-1">完成率</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ml-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">{completionData.onTime}</span>
            <span className="text-sm text-gray-600">按时完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">{completionData.overdue}</span>
            <span className="text-sm text-gray-600">逾期完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">{completionData.noDueDate}</span>
            <span className="text-sm text-gray-600">无日期任务</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-sm text-gray-600">{completionData.uncompleted}</span>
            <span className="text-sm text-gray-600">未完成</span>
          </div>
        </div>
      </div>
    </div>
  )
}

