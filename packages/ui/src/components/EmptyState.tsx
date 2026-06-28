import React from 'react'

interface Props {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <span className="text-neutral-400 text-xl">○</span>
      </div>
      <h3 className="text-base font-medium text-neutral-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
