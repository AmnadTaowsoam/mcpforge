'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth'
import clsx from 'clsx'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/runs/new', label: 'New Run' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clear } = useAuthStore()

  function handleLogout() {
    clear()
    router.push('/login')
  }

  return (
    <aside className="w-56 flex-none bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-5 py-4 border-b border-neutral-200">
        <span className="font-semibold text-sm text-neutral-900">MCPForge</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center px-3 py-2 rounded text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-neutral-200">
        <p className="px-3 text-xs text-neutral-500 truncate mb-1">{user?.email ?? user?.sub}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
