import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@mcpforge/ui', '@mcpforge/domain'],
}

export default config
