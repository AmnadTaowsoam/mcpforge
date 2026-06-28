'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  sub: string
  wsid: string
  role: string
  email?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setToken: (token: string) => void
  clear: () => void
}

function decodePayload(token: string): AuthUser | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token, user: decodePayload(token) }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'mcpforge-auth' },
  ),
)
