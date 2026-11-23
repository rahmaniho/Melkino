import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema.js';

export type TenantScope = { userId: string; tenantId: string };
type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool?: Pool;
  db!: Database;

  onModuleInit(): void {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required. Refusing to start an API without a PostgreSQL connection.');
    this.pool = new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10), connectionTimeoutMillis: 5_000 });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async ping(): Promise<void> {
    if (!this.pool) throw new Error('Database pool is not initialized.');
    await this.pool.query('SELECT 1');
  }

  async withIdentity<T>(userId: string, callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE melkino_runtime'));
      await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`);
      return callback(tx);
    });
  }

  async withTenant<T>(scope: TenantScope, callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql.raw('SET LOCAL ROLE melkino_runtime'));
      await tx.execute(sql`select set_config('app.user_id', ${scope.userId}, true)`);
      await tx.execute(sql`select set_config('app.tenant_id', ${scope.tenantId}, true)`);
      return callback(tx);
    });
  }
}
