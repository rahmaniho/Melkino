-- Add tenant/branch-scoped follow-up tasks linked to CRM customers and optional property files.
CREATE TYPE follow_up_kind AS ENUM ('CALL', 'MEETING', 'PROPERTY_VISIT', 'REMINDER');
CREATE TYPE follow_up_status AS ENUM ('OPEN', 'DONE', 'CANCELLED');

CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  branch_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  property_id uuid,
  code text NOT NULL CHECK (length(btrim(code)) BETWEEN 1 AND 32),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  details text CHECK (details IS NULL OR length(details) <= 2000),
  kind follow_up_kind NOT NULL,
  status follow_up_status NOT NULL DEFAULT 'OPEN',
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  assigned_to uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_tenant_code_uq UNIQUE (tenant_id, code),
  CONSTRAINT follow_ups_tenant_id_uq UNIQUE (tenant_id, id),
  CONSTRAINT follow_ups_tenant_branch_fk FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT follow_ups_tenant_customer_fk FOREIGN KEY (tenant_id, customer_id) REFERENCES customers(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT follow_ups_tenant_property_fk FOREIGN KEY (tenant_id, property_id) REFERENCES properties(tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT follow_ups_completion_consistency_ck CHECK ((status = 'DONE' AND completed_at IS NOT NULL) OR (status <> 'DONE' AND completed_at IS NULL))
);
CREATE INDEX follow_ups_tenant_branch_due_idx ON follow_ups(tenant_id, branch_id, status, due_at, id);
CREATE INDEX follow_ups_tenant_assignee_due_idx ON follow_ups(tenant_id, assigned_to, status, due_at, id);

CREATE TABLE follow_up_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  follow_up_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('CREATE', 'COMPLETE', 'CANCEL')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_up_audit_tenant_follow_up_fk FOREIGN KEY (tenant_id, follow_up_id) REFERENCES follow_ups(tenant_id, id) ON DELETE RESTRICT
);
CREATE INDEX follow_up_audit_tenant_task_created_idx ON follow_up_audit_log(tenant_id, follow_up_id, created_at DESC);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups FORCE ROW LEVEL SECURITY;
ALTER TABLE follow_up_audit_log FORCE ROW LEVEL SECURITY;

CREATE POLICY follow_ups_member_select ON follow_ups FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = follow_ups.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = follow_ups.branch_id)
      AND (m.role <> 'AGENT' OR follow_ups.assigned_to = m.user_id)
  ));
CREATE POLICY follow_ups_member_insert ON follow_ups FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND created_by = nullif(current_setting('app.user_id', true), '')::uuid
    AND assigned_to = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = follow_ups.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'RECEPTIONIST')
      AND (m.branch_id IS NULL OR m.branch_id = follow_ups.branch_id)));
CREATE POLICY follow_ups_member_update ON follow_ups FOR UPDATE
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = follow_ups.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = follow_ups.branch_id)
      AND (m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER') OR (m.role = 'AGENT' AND follow_ups.assigned_to = m.user_id))
  )) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM tenant_memberships m WHERE m.tenant_id = follow_ups.tenant_id
      AND m.user_id = nullif(current_setting('app.user_id', true), '')::uuid AND m.active
      AND m.role <> 'ACCOUNTANT'
      AND (m.branch_id IS NULL OR m.branch_id = follow_ups.branch_id)
      AND (m.role IN ('OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER') OR (m.role = 'AGENT' AND follow_ups.assigned_to = m.user_id))
  ));
CREATE POLICY follow_up_audit_member_select ON follow_up_audit_log FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid AND EXISTS (
    SELECT 1 FROM follow_ups f WHERE f.id = follow_up_audit_log.follow_up_id AND f.tenant_id = follow_up_audit_log.tenant_id
  ));
CREATE POLICY follow_up_audit_member_insert ON follow_up_audit_log FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid
    AND actor_id = nullif(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM follow_ups f WHERE f.id = follow_up_audit_log.follow_up_id AND f.tenant_id = follow_up_audit_log.tenant_id));

REVOKE UPDATE, DELETE ON follow_up_audit_log FROM PUBLIC;
GRANT SELECT, INSERT ON follow_ups TO melkino_runtime;
GRANT UPDATE (status, completed_at, updated_at) ON follow_ups TO melkino_runtime;
GRANT SELECT, INSERT ON follow_up_audit_log TO melkino_runtime;
REVOKE DELETE ON follow_ups, follow_up_audit_log FROM melkino_runtime;
