import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadMigrationFiles } from './migration-files.js';

const migration = readFileSync('api/migrations/0001_tenant_properties/migration.sql', 'utf8');
const crmMigration = readFileSync('api/migrations/0002_customer_crm/migration.sql', 'utf8');
const followUpMigration = readFileSync('api/migrations/0003_customer_follow_ups/migration.sql', 'utf8');
const migrationRunner = readFileSync('api/src/database/migrate.ts', 'utf8');
const tenantDbClient = readFileSync('api/src/database/database.service.ts', 'utf8');

describe('initial PostgreSQL migration safety contract', () => {
  it('is additive and refuses to silently drop operational data', () => {
    expect(migration).toMatch(/CREATE TABLE tenants/);
    expect(migration).toMatch(/CREATE TABLE properties/);
    expect(migration).not.toMatch(/\bDROP\s+(TABLE|SCHEMA|TYPE)\b/i);
    expect(migration).toMatch(/properties_tenant_code_uq UNIQUE \(tenant_id, code\)/);
  });

  it('enables and forces tenant RLS for every tenant-owned data table', () => {
    for (const table of ['tenants', 'branches', 'tenant_memberships', 'properties', 'property_audit_log']) {
      expect(migration).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
      expect(migration).toMatch(new RegExp(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`));
    }
    expect(migration).toMatch(/NOBYPASSRLS/);
    expect(tenantDbClient).toMatch(/SET LOCAL ROLE melkino_runtime/);
    expect(migration).toMatch(/current_setting\('app\.tenant_id', true\)/);
    expect(migration).toMatch(/current_setting\('app\.user_id', true\)/);
  });

  it('adds tenant-safe customer CRM tables with forced RLS, auditing, and no hard delete', () => {
    expect(crmMigration).toMatch(/CREATE TABLE customers/);
    expect(crmMigration).toMatch(/CREATE TABLE customer_audit_log/);
    expect(crmMigration).toMatch(/ALTER TABLE customers ENABLE ROW LEVEL SECURITY/);
    expect(crmMigration).toMatch(/ALTER TABLE customers FORCE ROW LEVEL SECURITY/);
    expect(crmMigration).toMatch(/customers_member_select/);
    expect(crmMigration).toMatch(/m\.role <> 'ACCOUNTANT'/);
    expect(crmMigration).toMatch(/REVOKE DELETE ON customers, customer_audit_log/);
    expect(crmMigration).not.toMatch(/\bDROP\s+(TABLE|SCHEMA|TYPE)\b/i);
  });

  it('adds linked follow-up tasks with RLS, constrained completion, and an audit trail', () => {
    expect(followUpMigration).toMatch(/CREATE TABLE follow_ups/);
    expect(followUpMigration).toMatch(/follow_ups_tenant_customer_fk/);
    expect(followUpMigration).toMatch(/follow_ups_tenant_property_fk/);
    expect(followUpMigration).toMatch(/ALTER TABLE follow_ups FORCE ROW LEVEL SECURITY/);
    expect(followUpMigration).toMatch(/follow_up_audit_log/);
    expect(followUpMigration).toMatch(/GRANT UPDATE \(status, completed_at, updated_at\) ON follow_ups/);
    expect(followUpMigration).toMatch(/REVOKE DELETE ON follow_ups, follow_up_audit_log/);
    expect(followUpMigration).not.toMatch(/\bDROP\s+(TABLE|SCHEMA|TYPE)\b/i);
  });

  it('loads the numbered migration folders in order with their SQL files', async () => {
    const files = await loadMigrationFiles('api/migrations');
    expect(files.map((file) => file.id)).toEqual([
      '0001_tenant_properties',
      '0002_customer_crm',
      '0003_customer_follow_ups',
    ]);
    expect(files.every((file) => file.sql.trim().length > 0)).toBe(true);
    expect(migrationRunner).toContain('loadMigrationFiles(migrationsDirectory)');
  });

  it('refuses changed applied checksums', () => {
    expect(migrationRunner).toContain('Applied migration ${migrationId} was edited');
  });

  it('uses exact monetary decimals, explicit currency, and non-destructive archive rules', () => {
    expect(migration).toMatch(/sale_price numeric\(20,0\)/);
    expect(migration).toMatch(/currency currency_code NOT NULL/);
    expect(migration).toMatch(/properties_archive_consistency_ck/);
    expect(migration).toMatch(/ON DELETE RESTRICT/);
    expect(migration).toMatch(/REVOKE DELETE ON tenants, branches, tenant_memberships, properties, property_audit_log/);
  });
});
