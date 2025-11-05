# 认证状态持久化修复总结

## 问题描述
每次刷新页面都需要重新登录，用户的登录状态无法保持。

## 根本原因
Zustand 的 `persist` 中间件恢复数据是**异步**的，但应用组件在数据恢复完成之前就开始检查 `isAuthenticated` 状态。此时 `isAuthenticated` 还是初始值 `false`，导致立即跳转到登录页。

## 修复方案

### 1. 添加水合状态追踪 (`frontend/stores/authStore.ts`)
- 添加 `_hasHydrated` 状态来追踪 zustand 是否已完成数据恢复
- 在 `onRehydrateStorage` 回调中：
  - 根据恢复的 `user` 和 `token` 自动设置 `isAuthenticated`
  - 标记 `_hasHydrated = true`
- 添加统一的 `login` 方法，确保 user、token 和 isAuthenticated 同时更新

### 2. 更新 API 拦截器 (`frontend/lib/api.ts`)
- 请求拦截器从 zustand store 获取 token，而不是直接从 localStorage
- 响应拦截器在 401 错误时调用 store 的 `logout` 方法

### 3. 更新布局和页面组件
- `frontend/app/(main)/layout.tsx`: 等待 `_hasHydrated` 完成后再检查认证
- `frontend/app/page.tsx`: 等待 `_hasHydrated` 完成后再跳转
- `frontend/app/login/page.tsx`: 使用统一的 `login` 方法
- `frontend/app/register/page.tsx`: 使用统一的 `login` 方法

## 数据流程

```
用户登录
    ↓
login(user, token)
    ├─ 设置 user
    ├─ 设置 token  
    └─ 设置 isAuthenticated = true
    ↓
zustand persist 自动保存到 localStorage
    ↓
用户刷新页面
    ↓
zustand persist 开始恢复数据（异步）
    ├─ _hasHydrated = false
    └─ 组件显示"加载中..."
    ↓
onRehydrateStorage 回调触发
    ├─ 恢复 user 和 token
    ├─ 自动设置 isAuthenticated = true
    └─ 设置 _hasHydrated = true
    ↓
组件检测到 _hasHydrated = true
    ├─ isAuthenticated = true → 显示内容
    └─ isAuthenticated = false → 跳转登录页
```

## 测试步骤

### 1. 清除缓存（可选，确保干净的测试环境）
```
1. 打开浏览器开发者工具 (F12)
2. Application → Storage → Clear site data
```

### 2. 注册/登录测试
```
1. 访问 http://localhost:3000/login
2. 输入邮箱和密码
3. 点击登录
4. ✅ 应该成功跳转到 /today 页面
```

### 3. 刷新页面测试
```
1. 在任意页面（如 /today、/habits、/statistics）
2. 按 F5 或 Ctrl+R 刷新页面
3. ✅ 应该保持登录状态，不跳转到登录页
4. ✅ 页面内容正常显示
```

### 4. 关闭浏览器重新打开测试
```
1. 完全关闭浏览器
2. 重新打开并访问 http://localhost:3000
3. ✅ 应该自动跳转到 /today（如果之前已登录）
4. ✅ 不需要重新登录
```

### 5. 检查 localStorage
```
1. 开发者工具 → Application → Local Storage
2. 查看 auth-storage 项
3. ✅ 应该包含以下内容：
   {
     "state": {
       "user": {...},
       "token": "...",
       "isAuthenticated": true,
       "_hasHydrated": true
     },
     "version": 0
   }
```

### 6. 测试登出功能
```
1. 在侧边栏或设置中点击"退出登录"
2. ✅ 应该清除认证状态
3. ✅ 跳转到登录页
4. ✅ localStorage 中的 auth-storage 被清除
```

## 修改的文件列表
- ✅ `frontend/stores/authStore.ts` - 添加水合状态追踪
- ✅ `frontend/lib/api.ts` - 更新拦截器
- ✅ `frontend/app/(main)/layout.tsx` - 等待水合完成
- ✅ `frontend/app/page.tsx` - 等待水合完成
- ✅ `frontend/app/login/page.tsx` - 使用统一 login 方法
- ✅ `frontend/app/register/page.tsx` - 使用统一 login 方法

## 注意事项
1. `_hasHydrated` 以下划线开头，表示这是内部状态，不应该被持久化
2. 所有需要认证的页面都应该等待 `_hasHydrated` 完成后再进行认证检查
3. token 的有效期为 7 天（后端设置），过期后会自动跳转到登录页

