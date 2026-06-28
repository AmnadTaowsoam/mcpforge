import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@mcpforge/ui'],
  // @mcpforge/domain uses node:crypto (release-packager). Mark as server-external
  // so it is never bundled into client/edge chunks — only runs in Node.js.
  serverExternalPackages: ['@mcpforge/domain'],
}

export default config
