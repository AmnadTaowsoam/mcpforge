import clsx from 'clsx'

type Status = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled'

const COLORS: Record<Status, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  ready: 'bg-blue-50 text-blue-700',
  running: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
}

export function RunStatusBadge({ status }: { status: Status }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', COLORS[status])}>
      {status}
    </span>
  )
}
