import type { FindingSeverity } from '@mcpforge/domain'
import React from 'react'

const SEVERITY_STYLES: Record<FindingSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border border-red-200',
  high: 'bg-orange-100 text-orange-800 border border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  low: 'bg-blue-100 text-blue-800 border border-blue-200',
  info: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
}

interface Props {
  severity: FindingSeverity
  className?: string
}

export function SeverityBadge({ severity, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_STYLES[severity]} ${className}`}
    >
      {severity}
    </span>
  )
}
