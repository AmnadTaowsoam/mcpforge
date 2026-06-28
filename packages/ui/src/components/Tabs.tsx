import React, { useState } from 'react'

export interface Tab {
  key: string
  label: string
  badge?: number
  disabled?: boolean
}

interface Props {
  tabs: Tab[]
  activeKey?: string
  onChange?: (key: string) => void
  className?: string
  children?: React.ReactNode
}

export function Tabs({ tabs, activeKey, onChange, className = '' }: Props) {
  const [internal, setInternal] = useState(tabs[0]?.key ?? '')
  const active = activeKey ?? internal

  function select(key: string) {
    setInternal(key)
    onChange?.(key)
  }

  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <nav className="-mb-px flex gap-0" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && select(tab.key)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2
                transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'}
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-xs bg-neutral-100 text-neutral-600">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
