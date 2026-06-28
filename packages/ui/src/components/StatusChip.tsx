import type { RunStatus } from '@mcpforge/domain'
import React from 'react'

const STATUS_STYLES: Record<RunStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-800',
  ready: 'bg-blue-100 text-blue-800',
  running: 'bg-blue-50 text-blue-700 animate-pulse',
  needs_input: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-neutral-200 text-neutral-600',
}

interface Props {
  status: RunStatus
  className?: string
}

export function StatusChip({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
