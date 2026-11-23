-- Initial additive schema for the first operational module.
-- Apply only to a dedicated Melkino PostgreSQL project after review; no project is provisioned by this repository.
DO $$
DECLARE runtime_role pg_roles%ROWTYPE;
BEGIN
  SELECT * INTO runtime_role FROM pg_roles WHERE rolname = 'melkino_runtime';
  IF NOT FOUND THEN
    CREATE ROLE melkino_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
    SELECT * INTO runtime_role FROM pg_roles WHERE rolname = 'melkino_runtime';
  END IF;
  IF runtime_role.rolcanlogin OR runtime_role.rolsuper OR runtime_role.rolcreatedb OR runtime_role.rolcreaterole
     OR runtime_role.rolinherit OR runtime_role.rolbypassrls THEN
    RAISE EXCEPTION 'melkino_runtime exists with unsafe role attributes; review and repair it before migration';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member = runtime_role.oid) THEN
    RAISE EXCEPTION 'melkino_runtime must not inherit or be able to SET ROLE into another role';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO melkino_runtime;

CREATE TYPE membership_role AS ENUM ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'ACCOUNTANT', 'RECEPTIONIST');
CREATE TYPE property_status AS ENUM ('ACTIVE', 'UNDER_VISIT', 'NEGOTIATING', 'ARCHIVED');
CREATE TYPE property_type AS ENUM ('APARTMENT', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE', 'OTHER');
CREATE TYPE transaction_type AS ENUM ('SALE', 'RENT', 'MORTGAGE_RENT', 'EXCHANGE', 'OTHER');
CREATE TYPE currency_code AS ENUM ('IRR', 'IRT');

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT branches_tenant_name_uq UNIQUE (tenant_id, name),
  CONSTRAINT branches_tenant_id_uq UNIQUE (tenant_id, id)
);
CREATE TABLE tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  branch_id uuid,
  role membership_role NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_memberships_pk PRIMARY KEY (tenant_id, user_id),
  CONSTRAINT tenant_memberships_branch_fk FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX tenant_memberships_user_active_idx ON tenant_memberships(user_id, active);

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id uuid NOT NULL,
  code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 32),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  address text NOT NULL CHECK (length(btrim(address)) BETWEEN 1 AND 500),
  type property_type NOT NULL,
  transaction_type transaction_type NOT NULL,
  area_sqm numeric(12,2) NOT NULL CHECK (area_sqm > 0),
  bedrooms smallint NOT NULL DEFAULT 0 CHECK (bedrooms >= 0 AND bedrooms <= 30),
  sale_price numeric(20,0) CHECK (sale_price IS NULL OR sale_price > 0),
  deposit numeric(20,0) CHECK (deposit IS NULL OR deposit >= 0),
  monthly_rent numeric(20,0) CHECK (monthly_rent IS NULL OR monthly_rent >= 0),
  currency currency_code NOT NULL,
  status property_status NOT NULL DEFAULT 'ACTIVE',
  pre_archive_status property_status,
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_tenant_code_uq UNIQUE (tenant_id, code),
  CONSTRAINT properties_tenant_id_uq UNIQUE (tenant_id, id),
  CONSTRAINT properties_tenant_branch_fk FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT properties_archive_consistency_ck CHECK ((status = 'ARCHIVED' AND archived_at IS NOT NULL AND pre_archive_status IS NOT NULL AND pre_archive_status <> 'ARCHIVED') OR (status <> 'ARCHIVED' AND archived_at IS NULL AND pre_archive_status IS NULL)),
  CONSTRAINT properties_transaction_price_ck CHECK (
    (transaction_type = 'SALE' AND sale_price IS NOT NULL AND deposit IS NULL AND monthly_rent IS NULL) OR
    (transaction_type = 'RENT' AND monthly_rent IS NOT NULL AND sale_price IS NULL AND deposit IS NULL) OR
    (transaction_type = 'MORTGAGE_RENT' AND deposit IS NOT NULL AND monthly_rent IS NOT NULL AND sale_price IS NULL) OR
    (transaction_type IN ('EXCHANGE', 'OTHER') AND sale_price IS NULL AND deposit IS NULL AND monthly_rent IS NULL)
  )
);
CREATE INDEX properties_tenant_branch_status_created_idx ON properties(tenant_id, branch_id, status, created_at DESC, id DESC);
CREATE INDEX properties_tenant_agent_idx ON properties(tenant_id, assigned_to, created_at DESC, id DESC);

CREATE TABLE property_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  property_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'ARCHIVE', 'RESTORE')),
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_audit_tenant_property_fk FOREIGN KEY (tenant_id, property_id) REFERENCES properties(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX property_audit_tenant_property_created_idx ON property_audit_log(tenant_id, property_id, created_at DESC);

-- The Nest API sets these transaction-local variables only after JWT and membership checks.
-- The database role used by the API must not have BYPASSRLS or superuser privileges.
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE property_audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_membership_self_select ON tenant_memberships FOR SELECT
  USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid AND active);
CREATE POLICY tenants_member_select ON tenants FOR SELECT
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = tenants.id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
  ));
CREATE POLICY branches_member_select ON branches FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = branches.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND (m.branch_id IS NULL OR m.branch_id = branches.id)
  ));
CREATE POLICY properties_member_select ON properties FOR SELECT
  USING (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND (m.branch_id IS NULL OR m.branch_id = properties.branch_id)
      AND (m.role <> 'AGENT' OR properties.assigned_to = m.user_id))
  );
CREATE POLICY properties_member_insert ON properties FOR INSERT
  WITH CHECK (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND created_by = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND (m.branch_id IS NULL OR m.branch_id = properties.branch_id)
      AND (m.role <> 'AGENT' OR properties.assigned_to = m.user_id))
  );
CREATE POLICY properties_member_update ON properties FOR UPDATE
  USING (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND (m.branch_id IS NULL OR m.branch_id = properties.branch_id)
      AND (m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER') OR properties.assigned_to = m.user_id))
  ) WITH CHECK (
    tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = properties.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND (m.branch_id IS NULL OR m.branch_id = properties.branch_id)
      AND (m.role <> 'AGENT' OR properties.assigned_to = m.user_id))
  );
CREATE POLICY property_audit_member_select ON property_audit_log FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM properties p WHERE p.id = property_audit_log.property_id AND p.tenant_id = property_audit_log.tenant_id
  ));
CREATE POLICY property_audit_member_insert ON property_audit_log FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND actor_id = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM properties p WHERE p.id = property_audit_log.property_id AND p.tenant_id = property_audit_log.tenant_id));
REVOKE UPDATE, DELETE ON property_audit_log FROM PUBLIC;
GRANT SELECT ON tenants, branches, tenant_memberships, properties, property_audit_log TO melkino_runtime;
GRANT INSERT ON properties, property_audit_log TO melkino_runtime;
GRANT UPDATE (title, address, type, transaction_type, area_sqm, bedrooms, sale_price, deposit, monthly_rent, currency, status, pre_archive_status, archived_at, updated_at)
  ON properties TO melkino_runtime;
REVOKE DELETE ON tenants, branches, tenant_memberships, properties, property_audit_log FROM melkino_runtime;
