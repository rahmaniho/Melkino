-- Add a tenant/branch-scoped customer CRM without altering existing property data.
CREATE TYPE customer_kind AS ENUM ('BUYER', 'SELLER', 'TENANT', 'LANDLORD', 'OTHER');
CREATE TYPE customer_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'ARCHIVED');

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id uuid NOT NULL,
  code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 32),
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 160),
  phone text NOT NULL CHECK (length(btrim(phone)) BETWEEN 7 AND 24),
  email text CHECK (email IS NULL OR length(btrim(email)) <= 254),
  kind customer_kind NOT NULL,
  target_transaction transaction_type,
  preferred_property_type property_type,
  budget_min numeric(20,0) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max numeric(20,0) CHECK (budget_max IS NULL OR budget_max >= 0),
  currency currency_code NOT NULL,
  preferred_area text CHECK (preferred_area IS NULL OR length(btrim(preferred_area)) <= 240),
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  status customer_status NOT NULL DEFAULT 'NEW',
  pre_archive_status customer_status,
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_tenant_code_uq UNIQUE (tenant_id, code),
  CONSTRAINT customers_tenant_id_uq UNIQUE (tenant_id, id),
  CONSTRAINT customers_tenant_branch_fk FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT customers_budget_order_ck CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
  CONSTRAINT customers_archive_consistency_ck CHECK ((status = 'ARCHIVED' AND archived_at IS NOT NULL AND pre_archive_status IS NOT NULL AND pre_archive_status <> 'ARCHIVED') OR (status <> 'ARCHIVED' AND archived_at IS NULL AND pre_archive_status IS NULL))
);
CREATE INDEX customers_tenant_branch_status_created_idx ON customers(tenant_id, branch_id, status, created_at DESC, id DESC);
CREATE INDEX customers_tenant_agent_idx ON customers(tenant_id, assigned_to, created_at DESC, id DESC);
CREATE INDEX customers_phone_lookup_idx ON customers(tenant_id, phone);

CREATE TABLE customer_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'ARCHIVE', 'RESTORE')),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_audit_tenant_customer_fk FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX customer_audit_tenant_customer_created_idx ON customer_audit_log(tenant_id, customer_id, created_at DESC);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE customer_audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY customers_member_select ON customers FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = customers.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = customers.branch_id)
      AND (m.role <> 'AGENT' OR customers.assigned_to = m.user_id)
  ));
CREATE POLICY customers_member_insert ON customers FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND created_by = nullif(current_setting('app.user_id', true), '')::uuid
    AND assigned_to = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = customers.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'RECEPTIONIST')
      AND (m.branch_id IS NULL OR m.branch_id = customers.branch_id)));
CREATE POLICY customers_member_update ON customers FOR UPDATE
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = customers.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = customers.branch_id)
      AND (m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER') OR (m.role = 'AGENT' AND customers.assigned_to = m.user_id))
  )) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = customers.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = customers.branch_id)
      AND (m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER') OR (m.role = 'AGENT' AND customers.assigned_to = m.user_id))
  ));
CREATE POLICY customer_audit_member_select ON customer_audit_log FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM customers c WHERE c.id = customer_audit_log.customer_id AND c.tenant_id = customer_audit_log.tenant_id
  ));
CREATE POLICY customer_audit_member_insert ON customer_audit_log FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND actor_id = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_audit_log.customer_id AND c.tenant_id = customer_audit_log.tenant_id));

REVOKE UPDATE, DELETE ON customer_audit_log FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON customers TO melkino_runtime;
GRANT SELECT, INSERT ON customer_audit_log TO melkino_runtime;
REVOKE DELETE ON customers, customer_audit_log FROM melkino_runtime;
