import type { Request } from 'express';

export type MembershipRole = 'OWNER' | 'BRANCH_MANAGER' | 'SALES_MANAGER' | 'AGENT' | 'ACCOUNTANT' | 'RECEPTIONIST';
export type AuthenticatedActor = { userId: string };
export type TenantActor = AuthenticatedActor & { tenantId: string; branchId: string | null; role: MembershipRole };
export type TenantRequest = Request & { actor?: AuthenticatedActor; tenantActor?: TenantActor };
