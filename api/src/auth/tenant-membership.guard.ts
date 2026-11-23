import { BadRequestException, CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { isUUID } from 'class-validator';
import { DatabaseService } from '../database/database.service.js';
import { tenantMemberships } from '../database/schema.js';
import type { MembershipRole, TenantRequest } from '../common/request-context.js';

@Injectable()
export class TenantMembershipGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const userId = request.actor?.userId;
    const rawTenantId = request.header('x-tenant-id');
    if (!userId) throw new ForbiddenException({ code: 'TENANT_CONTEXT_REQUIRED', message: 'نشست کاربر تأیید نشده است.' });
    if (!rawTenantId || !isUUID(rawTenantId)) throw new BadRequestException({ code: 'TENANT_HEADER_REQUIRED', message: 'شناسه آژانس معتبر در سرآیند X-Tenant-Id لازم است.' });

    const membership = await this.database.withIdentity(userId, async (tx) => {
      const [record] = await tx.select({ tenantId: tenantMemberships.tenantId, userId: tenantMemberships.userId, branchId: tenantMemberships.branchId, role: tenantMemberships.role })
        .from(tenantMemberships)
        .where(and(eq(tenantMemberships.tenantId, rawTenantId), eq(tenantMemberships.userId, userId), eq(tenantMemberships.active, true)))
        .limit(1);
      return record;
    });
    if (!membership) throw new ForbiddenException({ code: 'TENANT_ACCESS_DENIED', message: 'به این آژانس دسترسی ندارید.' });
    if (membership.role !== 'OWNER' && !membership.branchId) throw new ForbiddenException({ code: 'TENANT_MEMBERSHIP_INVALID', message: 'عضویت شعبه‌ای این کاربر کامل نیست.' });
    request.tenantActor = { userId, tenantId: membership.tenantId, branchId: membership.branchId, role: membership.role as MembershipRole };
    return true;
  }
}
