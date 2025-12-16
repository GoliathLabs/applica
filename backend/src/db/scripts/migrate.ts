import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { migrateDb } from '../db'
import { logger } from '../../common/logger'

async function runMigrations(): Promise<void> {
  try {
    logger.info('running database migrations...')
    await migrate(migrateDb, {
      migrationsFolder: 'src/db/migrations',
    })
    logger.info('database migrations completed successfully')
  } catch (err) {
    logger.error('migration failed', { err: String(err) })
    process.exit(1)
  }

  process.exit()
}

runMigrations()
