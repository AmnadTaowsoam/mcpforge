'use client'
import { useQuery } from '@tanstack/react-query'
import { api, type Workspace } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

interface WorkspaceMember {
  id: string
  email: string
  displayName: string
  role: string
  createdAt: string
}

export default function SettingsPage() {
  const { token, user } = useAuthStore()

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', user?.wsid],
    queryFn: () => api.get<Workspace>(`/workspaces/${user?.wsid}`, token ?? undefined),
    enabled: !!token && !!user?.wsid,
  })

  const { data: members } = useQuery<WorkspaceMember[]>({
    queryKey: ['members', user?.wsid],
    queryFn: () => api.get<WorkspaceMember[]>(`/workspaces/${user?.wsid}/members`, token ?? undefined),
    enabled: !!token && !!user?.wsid,
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Workspace info */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="text-sm font-medium">Workspace</h2>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Name</span>
            <span className="font-medium">{workspace?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Plan</span>
            <span className="font-medium capitalize">{workspace?.plan ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">ID</span>
            <span className="font-mono text-xs text-neutral-400">{user?.wsid}</span>
          </div>
        </div>
      </div>

      {/* Your profile */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="text-sm font-medium">Your profile</h2>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Role</span>
            <span className="font-medium capitalize">{user?.role ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">User ID</span>
            <span className="font-mono text-xs text-neutral-400">{user?.sub}</span>
          </div>
        </div>
      </div>

      {/* Members */}
      {members && members.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-medium">Members ({members.length})</h2>
          </div>
          <ul className="divide-y divide-neutral-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center px-4 py-3 gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium shrink-0">
                  {m.displayName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.displayName}</p>
                  <p className="text-xs text-neutral-500 truncate">{m.email}</p>
                </div>
                <span className="text-xs text-neutral-500 capitalize">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
