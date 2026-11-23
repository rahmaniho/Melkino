import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

type QueryResult = { rows: Array<Record<string, unknown>>; rowCount: number | null };
const tenantA = '11111111-1111-4111-8111-111111111111';
const tenantB = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const branchA1 = '22222222-2222-4222-8222-222222222222';
const branchA2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const branchB1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const agentA = '33333333-3333-4333-8333-333333333333';
const agentB = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ownerA = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const accountantA = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
let db: PGlite;

async function asRuntime<T>(userId: string, tenantId: string, action: () => Promise<T>): Promise<T> {
  await db.exec('BEGIN');
  try {
    await db.exec('SET LOCAL ROLE melkino_runtime');
    await db.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    await db.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await action();
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

describe('PostgreSQL tenant RLS integration (PGlite)', () => {
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(await readFile('api/migrations/0001_tenant_properties/migration.sql', 'utf8'));
    await db.exec(await readFile('api/migrations/0002_customer_crm/migration.sql', 'utf8'));
    await db.exec(await readFile('api/migrations/0003_customer_follow_ups/migration.sql', 'utf8'));
    await db.exec(`
      INSERT INTO tenants(id,name) VALUES ('${tenantA}','Agency A'),('${tenantB}','Agency B');
      INSERT INTO branches(id,tenant_id,name) VALUES
        ('${branchA1}','${tenantA}','Branch A1'),('${branchA2}','${tenantA}','Branch A2'),('${branchB1}','${tenantB}','Branch B1');
      INSERT INTO tenant_memberships(tenant_id,user_id,branch_id,role) VALUES
        ('${tenantA}','${agentA}','${branchA1}','AGENT'),
        ('${tenantA}','${ownerA}',NULL,'OWNER'),
        ('${tenantA}','${accountantA}','${branchA1}','ACCOUNTANT'),
        ('${tenantB}','${agentB}','${branchB1}','AGENT');
      INSERT INTO properties(tenant_id,branch_id,code,title,address,type,transaction_type,area_sqm,sale_price,currency,assigned_to,created_by) VALUES
        ('${tenantA}','${branchA1}','ML-A-OWN','Agent A own','A1 address','APARTMENT','SALE',100,100000,'IRT','${agentA}','${agentA}'),
        ('${tenantA}','${branchA1}','ML-A-OTHER','Other agent','A1 address','APARTMENT','SALE',100,100000,'IRT','${agentB}','${agentA}'),
        ('${tenantA}','${branchA2}','ML-A-BRANCH','Other branch','A2 address','APARTMENT','SALE',100,100000,'IRT','${agentA}','${agentA}'),
        ('${tenantB}','${branchB1}','ML-B-OWN','Other tenant','B1 address','APARTMENT','SALE',100,100000,'IRT','${agentA}','${agentA}');
      INSERT INTO customers(tenant_id,branch_id,code,full_name,phone,kind,currency,assigned_to,created_by) VALUES
        ('${tenantA}','${branchA1}','CU-A-OWN','Agent A customer','09120000001','BUYER','IRT','${agentA}','${agentA}'),
        ('${tenantA}','${branchA1}','CU-A-OTHER','Other agent customer','09120000002','SELLER','IRT','${agentB}','${agentA}'),
        ('${tenantA}','${branchA2}','CU-A-BRANCH','Other branch customer','09120000003','TENANT','IRT','${agentA}','${agentA}'),
        ('${tenantB}','${branchB1}','CU-B-OTHER','Other tenant customer','09120000004','LANDLORD','IRT','${agentA}','${agentA}');
      INSERT INTO follow_ups(tenant_id,branch_id,customer_id,property_id,code,title,kind,due_at,assigned_to,created_by) VALUES
        ('${tenantA}','${branchA1}',(SELECT id FROM customers WHERE code='CU-A-OWN'),(SELECT id FROM properties WHERE code='ML-A-OWN'),'FU-A-OWN','Call own customer','CALL','2026-11-23T10:00:00Z','${agentA}','${agentA}'),
        ('${tenantA}','${branchA1}',(SELECT id FROM customers WHERE code='CU-A-OTHER'),(SELECT id FROM properties WHERE code='ML-A-OTHER'),'FU-A-OTHER','Other agent task','MEETING','2026-11-24T10:00:00Z','${agentB}','${agentA}'),
        ('${tenantA}','${branchA2}',(SELECT id FROM customers WHERE code='CU-A-BRANCH'),NULL,'FU-A-BRANCH','Other branch task','REMINDER','2026-11-25T10:00:00Z','${agentA}','${agentA}'),
        ('${tenantB}','${branchB1}',(SELECT id FROM customers WHERE code='CU-B-OTHER'),NULL,'FU-B-OTHER','Other tenant task','CALL','2026-11-26T10:00:00Z','${agentB}','${agentB}');
    `);
  });

  afterEach(async () => { await db.close(); });

  it('limits an agent to assigned properties in their authenticated tenant and branch', async () => {
    const visible = await asRuntime(agentA, tenantA, () => db.query('SELECT code FROM properties ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['ML-A-OWN']);

    const crossTenant = await asRuntime(agentA, tenantB, () => db.query('SELECT code FROM properties ORDER BY code')) as QueryResult;
    expect(crossTenant.rows).toHaveLength(0);
  });

  it('lets an agency owner see all branches in their tenant but never another tenant', async () => {
    const visible = await asRuntime(ownerA, tenantA, () => db.query('SELECT code FROM properties ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['ML-A-BRANCH', 'ML-A-OTHER', 'ML-A-OWN']);
  });

  it('prevents agents from forging audit events for files assigned to someone else', async () => {
    const ids = await db.query<{ other: string; own: string }>(`SELECT
      (SELECT id FROM properties WHERE code = 'ML-A-OTHER') AS other,
      (SELECT id FROM properties WHERE code = 'ML-A-OWN') AS own`);
    const { other, own } = ids.rows[0];
    await expect(asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO property_audit_log(tenant_id,property_id,actor_id,action) VALUES ($1,$2,$3,$4)',
      [tenantA, other, agentA, 'UPDATE'],
    ))).rejects.toThrow(/row-level security/i);
    const allowed = await asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO property_audit_log(tenant_id,property_id,actor_id,action) VALUES ($1,$2,$3,$4) RETURNING id',
      [tenantA, own, agentA, 'UPDATE'],
    ));
    expect(allowed.rows).toHaveLength(1);
  });

  it('scopes customer records to the agent assignment and tenant', async () => {
    const visible = await asRuntime(agentA, tenantA, () => db.query('SELECT code FROM customers ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['CU-A-OWN']);
    const crossTenant = await asRuntime(agentA, tenantB, () => db.query('SELECT code FROM customers')) as QueryResult;
    expect(crossTenant.rows).toHaveLength(0);
  });

  it('lets an agency owner see customer records across their branches only', async () => {
    const visible = await asRuntime(ownerA, tenantA, () => db.query('SELECT code FROM customers ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['CU-A-BRANCH', 'CU-A-OTHER', 'CU-A-OWN']);
  });

  it('denies CRM visibility to accountant role memberships', async () => {
    const visible = await asRuntime(accountantA, tenantA, () => db.query('SELECT code FROM customers')) as QueryResult;
    expect(visible.rows).toHaveLength(0);
  });

  it('prevents agents from updating another customer or forging their audit events', async () => {
    const denied = await asRuntime(agentA, tenantA, () => db.query(
      'UPDATE customers SET full_name = $1 WHERE code = $2 RETURNING code', ['forged', 'CU-A-OTHER'],
    )) as QueryResult;
    expect(denied.rows).toHaveLength(0);
    const ids = await db.query<{ otherId: string }>("SELECT id AS \"otherId\" FROM customers WHERE code = 'CU-A-OTHER'");
    await expect(asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO customer_audit_log(tenant_id,customer_id,actor_id,action) VALUES ($1,$2,$3,$4)',
      [tenantA, ids.rows[0].otherId, agentA, 'UPDATE'],
    ))).rejects.toThrow(/row-level security/i);
    const own = await db.query<{ id: string }>("SELECT id FROM customers WHERE code = 'CU-A-OWN'");
    const allowed = await asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO customer_audit_log(tenant_id,customer_id,actor_id,action) VALUES ($1,$2,$3,$4) RETURNING id',
      [tenantA, own.rows[0].id, agentA, 'UPDATE'],
    ));
    expect(allowed.rows).toHaveLength(1);
  });

  it('blocks CRM writes to another branch and only allows new records owned by the authenticated agent', async () => {
    const crossBranch = await asRuntime(agentA, tenantA, () => db.query(
      'UPDATE customers SET full_name = $1 WHERE code = $2 RETURNING code', ['tampered', 'CU-A-BRANCH'],
    )) as QueryResult;
    expect(crossBranch.rows).toHaveLength(0);
    const created = await asRuntime(agentA, tenantA, () => db.query(
      `INSERT INTO customers(tenant_id,branch_id,code,full_name,phone,kind,currency,assigned_to,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING code`,
      [tenantA, branchA1, 'CU-A-NEW', 'New valid customer', '09120000009', 'BUYER', 'IRT', agentA, agentA],
    )) as QueryResult;
    expect(created.rows.map((row) => row.code)).toEqual(['CU-A-NEW']);
  });

  it('scopes follow-up visibility to the assigned agent and tenant', async () => {
    const visible = await asRuntime(agentA, tenantA, () => db.query('SELECT code FROM follow_ups ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['FU-A-OWN']);
    const crossTenant = await asRuntime(agentA, tenantB, () => db.query('SELECT code FROM follow_ups')) as QueryResult;
    expect(crossTenant.rows).toHaveLength(0);
  });

  it('lets an agency owner see tasks across their branches but filters out another tenant', async () => {
    const visible = await asRuntime(ownerA, tenantA, () => db.query('SELECT code FROM follow_ups ORDER BY code')) as QueryResult;
    expect(visible.rows.map((row) => row.code)).toEqual(['FU-A-BRANCH', 'FU-A-OTHER', 'FU-A-OWN']);
    const managed = await asRuntime(ownerA, tenantA, () => db.query(
      "UPDATE follow_ups SET status='DONE', completed_at=now() WHERE code='FU-A-OTHER' RETURNING code",
    )) as QueryResult;
    expect(managed.rows.map((row) => row.code)).toEqual(['FU-A-OTHER']);
    await expect(asRuntime(ownerA, tenantA, () => db.query(
      `UPDATE follow_ups SET assigned_to='${agentA}' WHERE code='FU-A-OTHER'`,
    ))).rejects.toThrow(/permission denied/i);
  });

  it('denies accountant task visibility and prevents task/audit forgery by agents', async () => {
    const denied = await asRuntime(accountantA, tenantA, () => db.query('SELECT code FROM follow_ups')) as QueryResult;
    expect(denied.rows).toHaveLength(0);
    const ids = await db.query<{ otherId: string; ownId: string }>(`SELECT
      (SELECT id FROM follow_ups WHERE code='FU-A-OTHER') AS "otherId",
      (SELECT id FROM follow_ups WHERE code='FU-A-OWN') AS "ownId"`);
    await expect(asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO follow_up_audit_log(tenant_id,follow_up_id,actor_id,action) VALUES ($1,$2,$3,$4)',
      [tenantA, ids.rows[0].otherId, agentA, 'COMPLETE'],
    ))).rejects.toThrow(/row-level security/i);
    const allowed = await asRuntime(agentA, tenantA, () => db.query(
      'INSERT INTO follow_up_audit_log(tenant_id,follow_up_id,actor_id,action) VALUES ($1,$2,$3,$4) RETURNING id',
      [tenantA, ids.rows[0].ownId, agentA, 'COMPLETE'],
    ));
    expect(allowed.rows).toHaveLength(1);
  });

  it('allows task creation only for the authenticated user and accessible customer', async () => {
    const customer = await db.query<{ id: string }>("SELECT id FROM customers WHERE code='CU-A-OWN'");
    await expect(asRuntime(agentA, tenantA, () => db.query(
      `INSERT INTO follow_ups(tenant_id,branch_id,customer_id,code,title,kind,due_at,assigned_to,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [tenantA, branchA1, customer.rows[0].id, 'FU-FORGED', 'Forged task', 'CALL', '2026-11-27T10:00:00Z', agentB, agentA],
    ))).rejects.toThrow(/row-level security/i);
    const allowed = await asRuntime(agentA, tenantA, () => db.query(
      `INSERT INTO follow_ups(tenant_id,branch_id,customer_id,code,title,kind,due_at,assigned_to,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING code`,
      [tenantA, branchA1, customer.rows[0].id, 'FU-VALID', 'Valid task', 'CALL', '2026-11-27T10:00:00Z', agentA, agentA],
    )) as QueryResult;
    expect(allowed.rows.map((row) => row.code)).toEqual(['FU-VALID']);
  });

  it('blocks cross-branch writes and allows writes only inside the active assignment scope', async () => {
    const denied = await asRuntime(agentA, tenantA, async () => db.query(
      'UPDATE properties SET title = $1 WHERE code = $2 RETURNING code', ['tampered', 'ML-A-OTHER'],
    )) as QueryResult;
    expect(denied.rows).toHaveLength(0);

    const allowed = await asRuntime(agentA, tenantA, async () => db.query(
      'UPDATE properties SET title = $1 WHERE code = $2 RETURNING code', ['Updated title', 'ML-A-OWN'],
    )) as QueryResult;
    expect(allowed.rows).toHaveLength(1);
  });
});
