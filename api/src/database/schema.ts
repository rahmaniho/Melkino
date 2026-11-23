import { boolean, check, foreignKey, index, jsonb, numeric, pgEnum, pgTable, primaryKey, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const membershipRole = pgEnum('membership_role', ['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'ACCOUNTANT', 'RECEPTIONIST']);
export const propertyStatus = pgEnum('property_status', ['ACTIVE', 'UNDER_VISIT', 'NEGOTIATING', 'ARCHIVED']);
export const propertyType = pgEnum('property_type', ['APARTMENT', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE', 'OTHER']);
export const transactionType = pgEnum('transaction_type', ['SALE', 'RENT', 'MORTGAGE_RENT', 'EXCHANGE', 'OTHER']);
export const currencyCode = pgEnum('currency_code', ['IRR', 'IRT']);
export const customerKind = pgEnum('customer_kind', ['BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'OTHER']);
export const customerStatus = pgEnum('customer_status', ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'ARCHIVED']);
export const followUpKind = pgEnum('follow_up_kind', ['CALL', 'MEETING', 'PROPERTY_VISIT', 'REMINDER']);
export const followUpStatus = pgEnum('follow_up_status', ['OPEN', 'DONE', 'CANCELLED']);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('branches_tenant_name_uq').on(table.tenantId, table.name), uniqueIndex('branches_tenant_id_uq').on(table.tenantId, table.id)]);

export const tenantMemberships = pgTable('tenant_memberships', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  userId: uuid('user_id').notNull(),
  branchId: uuid('branch_id'),
  role: membershipRole('role').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.tenantId, table.userId], name: 'tenant_memberships_pk' }),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'tenant_memberships_branch_fk' }),
  index('tenant_memberships_user_active_idx').on(table.userId, table.active),
]);

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  address: text('address').notNull(),
  type: propertyType('type').notNull(),
  transaction: transactionType('transaction_type').notNull(),
  areaSqm: numeric('area_sqm', { precision: 12, scale: 2 }).notNull(),
  bedrooms: smallint('bedrooms').notNull().default(0),
  salePrice: numeric('sale_price', { precision: 20, scale: 0 }),
  deposit: numeric('deposit', { precision: 20, scale: 0 }),
  monthlyRent: numeric('monthly_rent', { precision: 20, scale: 0 }),
  currency: currencyCode('currency').notNull(),
  status: propertyStatus('status').notNull().default('ACTIVE'),
  preArchiveStatus: propertyStatus('pre_archive_status'),
  assignedTo: uuid('assigned_to').notNull(),
  createdBy: uuid('created_by').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('properties_tenant_code_uq').on(table.tenantId, table.code),
  uniqueIndex('properties_tenant_id_uq').on(table.tenantId, table.id),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'properties_tenant_branch_fk' }),
  index('properties_tenant_branch_status_created_idx').on(table.tenantId, table.branchId, table.status, table.createdAt),
  index('properties_tenant_agent_idx').on(table.tenantId, table.assignedTo, table.createdAt),
  check('properties_area_positive_ck', sql`${table.areaSqm} > 0`),
  check('properties_bedrooms_nonnegative_ck', sql`${table.bedrooms} >= 0`),
  check('properties_archive_consistency_ck', sql`(${table.status} = 'ARCHIVED' AND ${table.archivedAt} IS NOT NULL AND ${table.preArchiveStatus} IS NOT NULL AND ${table.preArchiveStatus} <> 'ARCHIVED') OR (${table.status} <> 'ARCHIVED' AND ${table.archivedAt} IS NULL AND ${table.preArchiveStatus} IS NULL)`),
  check('properties_transaction_price_ck', sql`(${table.transaction} = 'SALE' AND ${table.salePrice} IS NOT NULL AND ${table.deposit} IS NULL AND ${table.monthlyRent} IS NULL) OR (${table.transaction} = 'RENT' AND ${table.monthlyRent} IS NOT NULL AND ${table.salePrice} IS NULL AND ${table.deposit} IS NULL) OR (${table.transaction} = 'MORTGAGE_RENT' AND ${table.deposit} IS NOT NULL AND ${table.monthlyRent} IS NOT NULL AND ${table.salePrice} IS NULL) OR (${table.transaction} IN ('EXCHANGE', 'OTHER') AND ${table.salePrice} IS NULL AND ${table.deposit} IS NULL AND ${table.monthlyRent} IS NULL)`),
]);

export const propertyAuditLog = pgTable('property_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  propertyId: uuid('property_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  changes: jsonb('changes').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({ columns: [table.tenantId, table.propertyId], foreignColumns: [properties.tenantId, properties.id], name: 'property_audit_tenant_property_fk' }),
  index('property_audit_tenant_property_created_idx').on(table.tenantId, table.propertyId, table.createdAt),
]);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull(),
  code: text('code').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  kind: customerKind('kind').notNull(),
  targetTransaction: transactionType('target_transaction'),
  preferredPropertyType: propertyType('preferred_property_type'),
  budgetMin: numeric('budget_min', { precision: 20, scale: 0 }),
  budgetMax: numeric('budget_max', { precision: 20, scale: 0 }),
  currency: currencyCode('currency').notNull(),
  preferredArea: text('preferred_area'),
  notes: text('notes'),
  status: customerStatus('status').notNull().default('NEW'),
  preArchiveStatus: customerStatus('pre_archive_status'),
  assignedTo: uuid('assigned_to').notNull(),
  createdBy: uuid('created_by').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('customers_tenant_code_uq').on(table.tenantId, table.code),
  uniqueIndex('customers_tenant_id_uq').on(table.tenantId, table.id),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'customers_tenant_branch_fk' }),
  index('customers_tenant_branch_status_created_idx').on(table.tenantId, table.branchId, table.status, table.createdAt),
  index('customers_tenant_agent_idx').on(table.tenantId, table.assignedTo, table.createdAt),
  index('customers_phone_lookup_idx').on(table.tenantId, table.phone),
  check('customers_budget_order_ck', sql`${table.budgetMin} IS NULL OR ${table.budgetMax} IS NULL OR ${table.budgetMin} <= ${table.budgetMax}`),
  check('customers_archive_consistency_ck', sql`(${table.status} = 'ARCHIVED' AND ${table.archivedAt} IS NOT NULL AND ${table.preArchiveStatus} IS NOT NULL AND ${table.preArchiveStatus} <> 'ARCHIVED') OR (${table.status} <> 'ARCHIVED' AND ${table.archivedAt} IS NULL AND ${table.preArchiveStatus} IS NULL)`),
]);

export const customerAuditLog = pgTable('customer_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  changes: jsonb('changes').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({ columns: [table.tenantId, table.customerId], foreignColumns: [customers.tenantId, customers.id], name: 'customer_audit_tenant_customer_fk' }),
  index('customer_audit_tenant_customer_created_idx').on(table.tenantId, table.customerId, table.createdAt),
]);

export const followUps = pgTable('follow_ups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  propertyId: uuid('property_id'),
  code: text('code').notNull(),
  title: text('title').notNull(),
  details: text('details'),
  kind: followUpKind('kind').notNull(),
  status: followUpStatus('status').notNull().default('OPEN'),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  assignedTo: uuid('assigned_to').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('follow_ups_tenant_code_uq').on(table.tenantId, table.code),
  uniqueIndex('follow_ups_tenant_id_uq').on(table.tenantId, table.id),
  foreignKey({ columns: [table.tenantId, table.branchId], foreignColumns: [branches.tenantId, branches.id], name: 'follow_ups_tenant_branch_fk' }),
  foreignKey({ columns: [table.tenantId, table.customerId], foreignColumns: [customers.tenantId, customers.id], name: 'follow_ups_tenant_customer_fk' }),
  foreignKey({ columns: [table.tenantId, table.propertyId], foreignColumns: [properties.tenantId, properties.id], name: 'follow_ups_tenant_property_fk' }),
  index('follow_ups_tenant_branch_due_idx').on(table.tenantId, table.branchId, table.status, table.dueAt, table.id),
  index('follow_ups_tenant_assignee_due_idx').on(table.tenantId, table.assignedTo, table.status, table.dueAt, table.id),
  check('follow_ups_completion_consistency_ck', sql`(${table.status} = 'DONE' AND ${table.completedAt} IS NOT NULL) OR (${table.status} <> 'DONE' AND ${table.completedAt} IS NULL)`),
]);

export const followUpAuditLog = pgTable('follow_up_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  followUpId: uuid('follow_up_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  foreignKey({ columns: [table.tenantId, table.followUpId], foreignColumns: [followUps.tenantId, followUps.id], name: 'follow_up_audit_tenant_task_fk' }),
  index('follow_up_audit_tenant_task_created_idx').on(table.tenantId, table.followUpId, table.createdAt),
]);
