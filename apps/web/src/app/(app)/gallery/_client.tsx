'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExampleConnector } from '@mcpforge/domain'
import { useAuthStore } from '../../../store/auth'
import { api, type Run } from '../../../lib/api'
import clsx from 'clsx'

const TAG_COLORS: Record<string, string> = {
  payments: 'bg-blue-50 text-blue-700',
  developer: 'bg-purple-50 text-purple-700',
  communication: 'bg-green-50 text-green-700',
  ai: 'bg-pink-50 text-pink-700',
  database: 'bg-orange-50 text-orange-700',
  default: 'bg-neutral-100 text-neutral-600',
}

function ExampleCard({
  example,
  onUse,
  loading,
}: {
  example: ExampleConnector
  onUse: (ex: ExampleConnector) => void
  loading: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{example.label}</h3>
        <p className="text-xs text-neutral-500 mt-1">{example.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {example.tags.map((tag) => (
          <span
            key={tag}
            className={clsx(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              TAG_COLORS[tag] ?? TAG_COLORS['default'],
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="capitalize">{example.context.outputLanguage}</span>
        <span>·</span>
        <span>{example.context.connectorType}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={() => setExpanded((x) => !x)}
          className="flex-1 py-1.5 rounded border border-neutral-200 text-xs hover:bg-neutral-50 transition-colors"
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
        <button
          onClick={() => onUse(example)}
          disabled={loading}
          className="flex-1 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Use template
        </button>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 pt-3 text-xs space-y-1">
          <p className="text-neutral-400 font-medium">CLI equivalent:</p>
          <code className="block bg-neutral-50 rounded px-2 py-1.5 font-mono text-neutral-700 break-all">
            mcpforge generate --name {example.context.connectorName} --type {example.context.connectorType} --lang {example.context.outputLanguage}
          </code>
          {example.context.features.length > 0 && (
            <p className="text-neutral-500">Features: {example.context.features.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function GalleryClient({ examples }: { examples: readonly ExampleConnector[] }) {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = examples.filter(
    (e) =>
      !filter ||
      e.label.toLowerCase().includes(filter.toLowerCase()) ||
      e.tags.some((t) => t.includes(filter.toLowerCase())),
  )

  async function handleUse(example: ExampleConnector) {
    if (!token || !user?.wsid) return router.push('/login')
    setLoading(example.id)
    try {
      const run = await api.post<Run>(
        `/workspaces/${user.wsid}/runs`,
        {
          projectId: user.wsid,
          triggerType: 'manual',
          config: { ...example.context, aiProvider: 'mock', aiModel: 'mock' },
          inputs: [],
        },
        token,
      )
      router.push(`/runs/${run.id}`)
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Example gallery</h1>
        <span className="text-xs text-neutral-500">{examples.length} templates</span>
      </div>

      <input
        type="search"
        placeholder="Filter by name or tag…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtered.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">No examples match your filter.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((ex) => (
          <ExampleCard
            key={ex.id}
            example={ex}
            onUse={handleUse}
            loading={loading === ex.id}
          />
        ))}
      </div>
    </div>
  )
}
