import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { loadMigrationFiles } from './migration-files.js';

const connectionString = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('Set MIGRATION_DATABASE_URL to an app-specific PostgreSQL migration role.');

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });
const client = await pool.connect();
let inTransaction = false;
try {
  await client.query('CREATE SCHEMA IF NOT EXISTS melkino_meta');
  await client.query(`CREATE TABLE IF NOT EXISTS melkino_meta.schema_migrations (
    migration_id text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const migrationsDirectory = resolve(process.cwd(), 'api/migrations');
  const migrations = await loadMigrationFiles(migrationsDirectory);

  for (const { id: migrationId, sql: migrationSql } of migrations) {
    const checksum = createHash('sha256').update(migrationSql).digest('hex');
    await client.query('BEGIN');
    inTransaction = true;
    await client.query("SELECT pg_advisory_xact_lock(hashtext('melkino_schema_migrations'))");
    const existing = await client.query('SELECT checksum FROM melkino_meta.schema_migrations WHERE migration_id = $1', [migrationId]);
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration ${migrationId} was edited. Create a new migration instead.`);
      await client.query('COMMIT');
      inTransaction = false;
      console.log(`Migration ${migrationId} already applied.`);
      continue;
    }
    await client.query(migrationSql);
    await client.query('INSERT INTO melkino_meta.schema_migrations(migration_id, checksum) VALUES ($1, $2)', [migrationId, checksum]);
    await client.query('COMMIT');
    inTransaction = false;
    console.log(`Applied migration ${migrationId}.`);
  }
} catch (error) {
  if (inTransaction) await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
