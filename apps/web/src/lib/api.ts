const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4300'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = opts
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/v1${path}`, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ title: res.statusText }))) as { title?: string }
    throw new ApiError(res.status, body.title ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
  del: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
}

// ─── Domain types (UI subset) ─────────────────────────────────────────────────
export interface Run {
  id: string
  projectId: string
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled'
  triggerType: string
  configJson: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  failureCode: string | null
  failureMessage: string | null
}

export interface Finding {
  id: string
  runId: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  title: string
  body: string
  status: 'open' | 'acknowledged' | 'resolved'
  suggestedFix: string | null
}

export interface Artifact {
  id: string
  runId: string
  artifactType: string
  path: string
  contentRef: string | null
  checksum: string | null
  validationStatus: string
}

export interface ReviewEvent {
  id: string
  runId: string
  reviewerUserId: string
  decision: 'approved' | 'rejected' | 'needs_revision'
  notes: string | null
  createdAt: string
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  status: string
}

export interface Workspace {
  id: string
  name: string
  plan: string
}

export interface LoginResponse {
  token: string
  workspaceId: string
  userId: string
}
