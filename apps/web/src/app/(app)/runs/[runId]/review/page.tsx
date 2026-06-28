'use client'
import { useState, use, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { api, type ReviewEvent } from '../../../../../lib/api'
import { useAuthStore } from '../../../../../store/auth'
import clsx from 'clsx'

type Decision = 'approved' | 'rejected' | 'needs_revision'

const DECISION_STYLES: Record<Decision, string> = {
  approved: 'border-green-500 bg-green-50 text-green-700',
  rejected: 'border-red-500 bg-red-50 text-red-700',
  needs_revision: 'border-yellow-500 bg-yellow-50 text-yellow-700',
}

export default function ReviewPage(props: { params: Promise<{ runId: string }> }) {
  const { runId } = use(props.params)
  const { token, user } = useAuthStore()
  const router = useRouter()
  const [decision, setDecision] = useState<Decision>('approved')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: reviews } = useQuery<ReviewEvent[]>({
    queryKey: ['reviews', runId],
    queryFn: () =>
      api.get<ReviewEvent[]>(
        `/workspaces/${user?.wsid}/runs/${runId}/reviews`,
        token ?? undefined,
      ),
    enabled: !!token && !!user?.wsid,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post<ReviewEvent>(
        `/workspaces/${user?.wsid}/runs/${runId}/review`,
        { decision, notes: notes.trim() || null },
        token ?? undefined,
      ),
    onSuccess: () => router.push(`/runs/${runId}`),
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to submit review'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submitMutation.mutate()
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <Link href={`/runs/${runId}`} className="text-xs text-neutral-400 hover:text-neutral-600">
          ← Back to run
        </Link>
        <h1 className="text-xl font-semibold mt-2">Submit review</h1>
      </div>

      {/* Prior reviews */}
      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-medium">Prior reviews ({reviews.length})</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {reviews.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={clsx(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      DECISION_STYLES[r.decision],
                    )}
                  >
                    {r.decision}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                {r.notes && <p className="text-xs text-neutral-600">{r.notes}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review form */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">Decision</label>
            <div className="flex gap-3">
              {(['approved', 'needs_revision', 'rejected'] as Decision[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecision(d)}
                  className={clsx(
                    'flex-1 py-2 rounded border-2 text-xs font-medium capitalize transition-colors',
                    decision === d
                      ? DECISION_STYLES[d]
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                  )}
                >
                  {d.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observations, required changes, or approval rationale…"
              className="w-full px-3 py-2 rounded border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  )
}
