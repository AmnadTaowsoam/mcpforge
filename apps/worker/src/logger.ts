import pino from 'pino'
import type { Logger } from 'pino'

export type { Logger }

let _logger: Logger | undefined

export function getLogger(): Logger {
  if (!_logger) {
    const level = process.env['LOG_LEVEL'] ?? 'info'
    _logger = pino({
      level,
      base: { service: 'mcpforge-worker' },
      timestamp: pino.stdTimeFunctions.isoTime,
      transport:
        process.env['NODE_ENV'] === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    })
  }
  return _logger
}
