// 简单的Tabs组件实现（用于统计页面）
export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const TabsList = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const TabsTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>
export const TabsContent = ({ children, ...props }: any) => <div {...props}>{children}</div>

