export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-graphite mb-2">MCPForge</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Create production-ready MCP server templates from a single command.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Open Dashboard
        </a>
      </div>
    </main>
  )
}
