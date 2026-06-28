'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { use } from 'react'
import { api, type Run, type Finding, type Artifact } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'
import { RunStatusBadge } from '../../../../components/runs/RunStatusBadge'
import clsx from 'clsx'

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-700 bg-red-50',
  high: 'text-orange-700 bg-orange-50',
  medium: 'text-yellow-700 bg-yellow-50',
  low: 'text-blue-700 bg-blue-50',
  info: 'text-neutral-600 bg-neutral-100',
}

interface ExportBundle {
  run: Run
  artifacts: Artifact[]
  findings: Finding[]
  summary: { artifactCount: number; findingCount: number; criticalFindings: number; latestDecision?: string }
}

export default function WorkbenchPage(props: { params: Promise<{ runId: string }> }) {
  const { runId } = use(props.params)
  const { token, user } = useAuthStore()
  const qc = useQueryClient()

  const { data: exportData, isLoading } = useQuery<ExportBundle>({
    queryKey: ['run-export', runId],
    queryFn: () =>
      api.get<ExportBundle>(
        `/workspaces/${user?.wsid}/runs/${runId}/export`,
        token ?? undefined,
      ),
    enabled: !!token && !!user?.wsid,
    refetchInterval: (query) => {
      const status = query.state.data?.run.status
      return status === 'running' ? 3000 : false
    },
  })

  const startMutation = useMutation({
    mutationFn: () =>
      api.post<Run>(
        `/workspaces/${user?.wsid}/runs/${runId}/start`,
        {},
        token ?? undefined,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['run-export', runId] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post<Run>(
        `/workspaces/${user?.wsid}/runs/${runId}/cancel`,
        {},
        token ?? undefined,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['run-export', runId] }),
  })

  const run = exportData?.run
  const artifacts = exportData?.artifacts ?? []
  const findings = exportData?.findings ?? []
  const summary = exportData?.summary

  if (isLoading) {
    return <div className="text-sm text-neutral-500 p-4">Loading…</div>
  }

  if (!run) {
    return <div className="text-sm text-red-600 p-4">Run not found.</div>
  }

  const config = run.configJson as Record<string, string>

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-xs text-neutral-400 hover:text-neutral-600">Dashboard</Link>
            <span className="text-xs text-neutral-300">/</span>
            <span className="text-xs text-neutral-600 font-medium">{config['connectorName'] ?? runId}</span>
          </div>
          <h1 className="text-xl font-semibold">{config['connectorName'] ?? 'Run'}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{run.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <RunStatusBadge status={run.status} />
          {run.status === 'ready' && (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Start
            </button>
          )}
          {run.status === 'running' && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="px-3 py-1.5 rounded border border-neutral-300 text-xs hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          {run.status === 'completed' && (
            <Link
              href={`/runs/${runId}/review`}
              className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700"
            >
              Review
            </Link>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500">Artifacts</p>
            <p className="text-lg font-semibold">{summary.artifactCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500">Findings</p>
            <p className="text-lg font-semibold">{summary.findingCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-3">
            <p className="text-xs text-neutral-500">Critical</p>
            <p className={clsx('text-lg font-semibold', summary.criticalFindings > 0 ? 'text-red-600' : 'text-neutral-900')}>
              {summary.criticalFindings}
            </p>
          </div>
        </div>
      )}

      {/* Artifacts */}
      {artifacts.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-medium">Artifacts</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {artifacts.map((a) => (
              <li key={a.id} className="flex items-center px-4 py-2.5 gap-3">
                <code className="text-xs bg-neutral-100 rounded px-1.5 py-0.5 font-mono">{a.artifactType}</code>
                <span className="text-sm text-neutral-700 flex-1">{a.path}</span>
                <span className={clsx('text-xs', a.validationStatus === 'valid' ? 'text-green-600' : 'text-red-600')}>
                  {a.validationStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-medium">Findings</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {findings.map((f) => (
              <li key={f.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium mt-0.5', SEVERITY_COLOR[f.severity] ?? SEVERITY_COLOR.info)}>
                    {f.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{f.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{f.body}</p>
                    {f.suggestedFix && (
                      <p className="text-xs text-blue-600 mt-1">Fix: {f.suggestedFix}</p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{f.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {run.failureMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-medium text-red-700 mb-1">Failure: {run.failureCode}</p>
          <p className="text-sm text-red-600">{run.failureMessage}</p>
        </div>
      )}
    </div>
  )
}
