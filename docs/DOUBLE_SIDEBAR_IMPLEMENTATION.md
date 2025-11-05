# 双侧边栏界面重构完成文档

## 完成时间
2025年11月5日

## 实施概述
成功实现了现代化的双侧边栏界面，包含左侧图标导航、中间任务管理侧边栏、移动端底部导航和抽屉菜单。

## 架构设计

### 桌面端布局（三栏）
```
┌────────┬─────────────┬──────────────────┐
│  图标  │ 任务侧边栏   │   主内容区域      │
│  导航  │ (可收缩)    │                  │
│  64px │   280px    │     flex-1       │
└────────┴─────────────┴──────────────────┘
```

### 移动端布局
```
┌──────────────────────────────┐
│        主内容区域              │
│                              │
│                              │
├──────────────────────────────┤
│      底部导航栏 (固定)         │
└──────────────────────────────┘
```

## 核心组件实现

### 1. IconSidebar（左侧图标导航）
**文件**: `frontend/components/IconSidebar.tsx`

**功能**:
- 7个主要功能图标：任务、日历、四象限、番茄、习惯、搜索、倒数日
- 选中状态：蓝色背景 + 左侧蓝色边框指示器
- Hover tooltip 提示
- 点击任务图标切换任务侧边栏显示/隐藏

**设计规范**:
- 宽度：64px (w-16)
- 图标尺寸：24px (w-6 h-6)
- 间距：gap-2
- 圆角：rounded-lg

**特性**:
- ✅ 悬停显示tooltip
- ✅ 左侧激活指示器
- ✅ 平滑过渡动画
- ✅ 桌面端显示（lg:flex）

### 2. TaskSidebar（中间任务侧边栏）
**文件**: `frontend/components/TaskSidebar.tsx`

**结构**:
1. **过滤器区域** (顶部)
   - FilterBar 组件
   - 快捷过滤器：今天、明天、最近7天、收集箱

2. **清单区域** (中间)
   - 标题：清单 + 已使用数量 + ➕ 按钮
   - FolderTree 组件（树形结构）
   - 文件夹和清单管理

3. **过滤器区域** (中下)
   - 今日工作
   - 自定义过滤器

4. **标签区域** (下方)
   - 标签列表
   - 点击筛选任务
   - ➕ 创建新标签

5. **系统过滤器** (底部)
   - 已完成
   - 已放弃
   - 垃圾桶

**设计规范**:
- 宽度：280px (w-70)
- 只在任务模块显示
- 可收起/展开（通过 useUIStore）

### 3. FilterBar（过滤器栏）
**文件**: `frontend/components/FilterBar.tsx`

**功能**:
- 特殊过滤器下拉选择
- 快捷过滤器按钮：今天、明天、最近7天
- 收集箱快捷入口
- 激活状态显示

**过滤器类型**:
```typescript
interface FilterConfig {
  type: 'date' | 'list' | 'tag' | 'priority' | 'custom' | 'all'
  label?: string
  listId?: number
  days?: number
  tagIds?: number[]
  priority?: number
  status?: 'todo' | 'completed' | 'all'
}
```

### 4. ListDialog（清单对话框）
**文件**: `frontend/components/ListDialog.tsx`

**功能**:
- 清单名称输入
- 图标选择（16个emoji）
- 颜色选择（12种颜色）
- 上级文件夹选择
- 创建/编辑模式

**设计**:
- 模态对话框
- 图标网格：8列
- 颜色网格：6列
- 表单验证

### 5. MobileNavBar（移动端底部导航）
**文件**: `frontend/components/MobileNavBar.tsx`

**导航项**:
1. 任务 (CheckSquare)
2. 日历 (Calendar)
3. 四象限 (Grid2X2)
4. 番茄 (Timer)
5. 我的 (User)

**设计**:
- 固定底部 (fixed bottom-0)
- z-index: 40
- 选中状态：蓝色文字
- 桌面端隐藏 (lg:hidden)

### 6. MobileDrawer（移动端抽屉侧边栏）
**文件**: `frontend/components/MobileDrawer.tsx`

**功能**:
- 从左侧滑出的抽屉菜单
- 显示 TaskSidebar 内容
- 遮罩层点击关闭
- 阻止背景滚动

**动画**:
- 滑入/滑出：300ms
- transform: translateX
- 遮罩渐变：opacity

## 状态管理

### uiStore (`frontend/stores/uiStore.ts`)

**状态**:
```typescript
interface UIStore {
  showTaskSidebar: boolean      // 任务侧边栏显示状态
  activeModule: string           // 当前激活模块
  showMobileMenu: boolean        // 移动端菜单显示状态
  toggleTaskSidebar: () => void
  setShowTaskSidebar: (show: boolean) => void
  setActiveModule: (module: string) => void
  toggleMobileMenu: () => void
  setShowMobileMenu: (show: boolean) => void
}
```

**持久化**: 使用 zustand persist 中间件

### filterStore (`frontend/stores/filterStore.ts`)

**状态**:
```typescript
interface FilterStore {
  activeFilter: FilterConfig     // 当前激活的过滤器
  customFilters: FilterConfig[]  // 自定义过滤器列表
  setFilter: (filter: FilterConfig) => void
  clearFilter: () => void
  addCustomFilter: (filter: FilterConfig) => void
  removeCustomFilter: (index: number) => void
}
```

**预设过滤器**:
- 今天: `{ type: 'date', days: 0 }`
- 明天: `{ type: 'date', days: 1 }`
- 最近7天: `{ type: 'date', days: 7 }`

## Layout重构 (`frontend/app/(main)/layout.tsx`)

### 新布局结构
```tsx
<div className="flex h-screen bg-gray-50">
  {/* 左侧图标导航栏 */}
  <IconSidebar />
  
  {/* 中间任务侧边栏（仅任务模块） */}
  <TaskSidebar />
  
  {/* 主内容区域 */}
  <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
    {children}
  </main>
  
  {/* 移动端底部导航 */}
  <MobileNavBar />
  
  {/* 移动端抽屉 */}
  <MobileDrawer />
  
  {/* 提醒通知 */}
  <ReminderNotification />
</div>
```

### 响应式设计
- **桌面端** (lg+): 显示图标栏 + 任务侧边栏
- **移动端** (<lg): 隐藏侧边栏，显示底部导航

## 响应式断点

| 断点 | 宽度 | 布局 |
|------|------|------|
| sm | <640px | 移动端：底部导航 |
| md | 640-1024px | 平板：底部导航 |
| lg | 1024px+ | 桌面端：双侧边栏 |

## 交互流程

### 桌面端
1. 用户点击左侧图标导航
2. 点击"任务"图标 → 切换任务侧边栏显示/隐藏
3. 点击其他图标 → 跳转对应页面
4. 在任务侧边栏中选择过滤器 → 更新主内容
5. 点击清单 → 显示该清单的任务

### 移动端
1. 底部导航切换模块
2. 点击菜单按钮 → 打开抽屉侧边栏
3. 抽屉中显示完整的任务侧边栏
4. 点击遮罩或关闭按钮 → 关闭抽屉

## 视觉设计

### 配色方案
- **主色**: Blue 600 (#2563EB)
- **次要色**: Gray 100-900
- **激活状态**: Blue 50 背景 + Blue 600 文字
- **悬停状态**: Gray 100 背景

### 间距规范
- **外边距**: p-2, p-3, p-4
- **内边距**: px-3 py-2
- **间隙**: gap-2, gap-3
- **圆角**: rounded-lg

### 阴影效果
- **边框**: border-gray-200
- **卡片**: shadow-sm
- **对话框**: shadow-xl

## 新增文件清单

### 组件 (7个)
1. ✅ `frontend/components/IconSidebar.tsx` - 图标导航栏
2. ✅ `frontend/components/TaskSidebar.tsx` - 任务侧边栏
3. ✅ `frontend/components/FilterBar.tsx` - 过滤器栏
4. ✅ `frontend/components/ListDialog.tsx` - 清单对话框
5. ✅ `frontend/components/MobileNavBar.tsx` - 移动端底部导航
6. ✅ `frontend/components/MobileDrawer.tsx` - 移动端抽屉

### 状态管理 (2个)
7. ✅ `frontend/stores/uiStore.ts` - UI状态管理
8. ✅ `frontend/stores/filterStore.ts` - 过滤器状态管理

### 修改文件 (1个)
9. ✅ `frontend/app/(main)/layout.tsx` - 主布局重构

## 功能特性

### ✅ 图标导航
- 7个主要功能入口
- Tooltip提示
- 激活指示器
- 模块切换

### ✅ 任务侧边栏
- 过滤器快捷入口
- 清单树形结构
- 标签管理
- 系统过滤器

### ✅ 过滤系统
- 预设过滤器（今天、明天、7天）
- 自定义过滤器
- 清单筛选
- 标签筛选

### ✅ 清单管理
- 创建/编辑清单
- 图标选择（16个）
- 颜色选择（12种）
- 文件夹归属

### ✅ 移动端适配
- 底部导航栏（5个主要功能）
- 抽屉侧边栏（完整功能）
- 响应式布局
- 触摸友好

## 后续集成任务

### 需要在各页面集成过滤器
- [ ] Today 页面集成过滤器
- [ ] Inbox 页面集成过滤器
- [ ] Calendar 页面适配新布局
- [ ] Quadrant 页面适配新布局
- [ ] 其他页面适配

### 需要实现的后端支持
- [ ] 高级过滤器API（多条件组合）
- [ ] 自定义过滤器保存
- [ ] 清单图标和颜色保存

## 优势总结

### 🎨 用户体验
- 简洁的图标导航
- 清晰的信息层级
- 快速的功能切换
- 一致的交互模式

### 📱 移动友好
- 底部导航易于触达
- 抽屉菜单完整功能
- 响应式完美适配

### ⚡ 性能优化
- 按需加载侧边栏
- 状态持久化
- 平滑动画过渡

### 🔧 可维护性
- 组件职责清晰
- 状态管理统一
- 代码结构清晰
- 易于扩展

## 总结
成功完成了双侧边栏界面的完整重构，实现了现代化、高效、美观的用户界面，为后续功能开发奠定了坚实基础。

