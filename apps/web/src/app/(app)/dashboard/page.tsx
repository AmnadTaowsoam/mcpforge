'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api, type Run } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { RunStatusBadge } from '../../../components/runs/RunStatusBadge'

interface RunsListResponse {
  data: Run[]
  total: number
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { token, user } = useAuthStore()
  const wsid = user?.wsid

  const { data, isLoading, isError } = useQuery<RunsListResponse>({
    queryKey: ['runs', wsid],
    queryFn: () => api.get<RunsListResponse>(`/workspaces/${wsid}/runs`, token ?? undefined),
    enabled: !!wsid && !!token,
  })

  const runs = data?.data ?? []
  const byStatus = (s: Run['status']) => runs.filter((r) => r.status === s).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link
          href="/runs/new"
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          New Run
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total runs" value={data?.total ?? 0} />
        <StatCard label="Running" value={byStatus('running')} />
        <StatCard label="Completed" value={byStatus('completed')} />
        <StatCard label="Failed" value={byStatus('failed')} />
      </div>

      {/* Runs list */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="text-sm font-medium">Recent runs</h2>
        </div>

        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">Loading…</div>
        )}

        {isError && (
          <div className="px-4 py-8 text-center text-sm text-red-600">
            Failed to load runs. Check your connection.
          </div>
        )}

        {!isLoading && !isError && runs.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-neutral-500 mb-3">No runs yet.</p>
            <Link
              href="/runs/new"
              className="text-sm text-blue-600 hover:underline"
            >
              Create your first run →
            </Link>
          </div>
        )}

        {runs.length > 0 && (
          <ul className="divide-y divide-neutral-100">
            {runs.map((run) => {
              const name = (run.configJson as Record<string, string>)['connectorName'] ?? run.id
              return (
                <li key={run.id} className="flex items-center px-4 py-3 hover:bg-neutral-50 transition-colors">
                  <Link href={`/runs/${run.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString()
                        : 'Not started'}
                    </p>
                  </Link>
                  <RunStatusBadge status={run.status} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
