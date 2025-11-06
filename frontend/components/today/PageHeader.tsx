interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      {subtitle && (
        <p className="text-sm text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  )
}

