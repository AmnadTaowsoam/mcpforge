import React from 'react'

export interface TimelineEvent {
  id: string
  label: string
  description?: string
  timestamp: Date
  variant?: 'default' | 'success' | 'warning' | 'error'
  icon?: React.ReactNode
}

const VARIANT_DOT: Record<string, string> = {
  default: 'bg-neutral-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

interface Props {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className = '' }: Props) {
  return (
    <ol className={`relative border-l border-neutral-200 ${className}`}>
      {events.map((ev) => {
        const dotClass = VARIANT_DOT[ev.variant ?? 'default'] ?? VARIANT_DOT['default']!
        return (
          <li key={ev.id} className="mb-6 ml-4">
            <div
              className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full border-2 border-white ${dotClass}`}
              aria-hidden="true"
            />
            {ev.icon && (
              <span className="absolute -left-4 mt-0.5 text-base">{ev.icon}</span>
            )}
            <time className="mb-1 text-xs font-normal leading-none text-neutral-400">
              {ev.timestamp.toLocaleString()}
            </time>
            <h3 className="text-sm font-semibold text-neutral-900">{ev.label}</h3>
            {ev.description && (
              <p className="text-xs text-neutral-600 mt-0.5">{ev.description}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
