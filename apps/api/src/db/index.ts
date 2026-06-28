import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getEnv } from '@mcpforge/config'
import * as schema from './schema.js'

export type DbClient = ReturnType<typeof drizzle<typeof schema>>

let _pool: Pool | undefined
let _db: DbClient | undefined

export function getPool(): Pool {
  if (!_pool) {
    const env = getEnv()
    _pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return _pool
}

export function getDb(): DbClient {
  if (!_db) {
    _db = drizzle(getPool(), { schema })
  }
  return _db
}

export async function closeDb(): Promise<void> {
  await _pool?.end()
  _pool = undefined
  _db = undefined
}

export { schema }
