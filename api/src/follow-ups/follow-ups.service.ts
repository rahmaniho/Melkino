import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import { branches, customers, followUpAuditLog, followUps, properties } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import type { TenantActor } from '../common/request-context.js';
import { CreateFollowUpDto, ListFollowUpsQuery } from './follow-up.dto.js';

const creatableRoles = ['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'RECEPTIONIST'];
function canManage(actor: TenantActor, assignedTo: string) {
  return ['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER'].includes(actor.role) || (actor.role === 'AGENT' && actor.userId === assignedTo);
}

@Injectable()
export class FollowUpsService {
  constructor(private readonly database: DatabaseService) {}

  async list(actor: TenantActor, query: ListFollowUpsQuery) {
    const where = this.conditions(actor, query);
    return this.database.withTenant(actor, async (tx) => {
      const rows = await tx.select({
        id: followUps.id, code: followUps.code, title: followUps.title, details: followUps.details,
        kind: followUps.kind, status: followUps.status, dueAt: followUps.dueAt, completedAt: followUps.completedAt,
        customerId: customers.id, customerName: customers.fullName, customerPhone: customers.phone,
        propertyId: properties.id, propertyCode: properties.code, propertyTitle: properties.title,
        assignedTo: followUps.assignedTo, createdAt: followUps.createdAt,
      }).from(followUps)
        .innerJoin(customers, and(eq(customers.id, followUps.customerId), eq(customers.tenantId, followUps.tenantId)))
        .leftJoin(properties, and(eq(properties.id, followUps.propertyId), eq(properties.tenantId, followUps.tenantId)))
        .where(and(...where)).orderBy(followUps.status, followUps.dueAt, desc(followUps.id)).limit(query.limit).offset(query.offset);
      const [totalRow] = await tx.select({ value: count() }).from(followUps).where(and(...where));
      return { data: rows, pagination: { limit: query.limit, offset: query.offset, total: Number(totalRow.value), hasMore: query.offset + rows.length < Number(totalRow.value) } };
    });
  }

  async create(actor: TenantActor, dto: CreateFollowUpDto) {
    if (!creatableRoles.includes(actor.role)) throw new ForbiddenException({ code: 'FOLLOW_UP_CREATE_DENIED', message: 'اجازه ثبت پیگیری ندارید.' });
    if (actor.branchId && actor.branchId !== dto.branchId) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'ثبت پیگیری در این شعبه مجاز نیست.' });
    const dueAt = new Date(dto.dueAt);
    if (!Number.isFinite(dueAt.getTime())) throw new BadRequestException({ code: 'FOLLOW_UP_DATE_INVALID', message: 'زمان پیگیری معتبر نیست.' });

    return this.database.withTenant(actor, async (tx) => {
      const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, dto.branchId), eq(branches.tenantId, actor.tenantId))).limit(1);
      if (!branch) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'شعبه انتخاب‌شده در دسترس نیست.' });
      const customerConditions: SQL[] = [eq(customers.id, dto.customerId), eq(customers.tenantId, actor.tenantId), eq(customers.branchId, dto.branchId), isNull(customers.archivedAt)];
      if (actor.role === 'AGENT') customerConditions.push(eq(customers.assignedTo, actor.userId));
      const [customer] = await tx.select({ id: customers.id }).from(customers).where(and(...customerConditions)).limit(1);
      if (!customer) throw new BadRequestException({ code: 'FOLLOW_UP_CUSTOMER_INVALID', message: 'مشتری در محدوده دسترسی شما پیدا نشد یا بایگانی شده است.' });
      if (dto.propertyId) {
        const [property] = await tx.select({ id: properties.id }).from(properties).where(and(eq(properties.id, dto.propertyId), eq(properties.tenantId, actor.tenantId), eq(properties.branchId, dto.branchId), isNull(properties.archivedAt))).limit(1);
        if (!property) throw new BadRequestException({ code: 'FOLLOW_UP_PROPERTY_INVALID', message: 'فایل ملک در این شعبه پیدا نشد یا بایگانی شده است.' });
      }
      const code = `FU-${randomBytes(5).toString('hex').toUpperCase()}`;
      const [created] = await tx.insert(followUps).values({
        tenantId: actor.tenantId, branchId: dto.branchId, customerId: dto.customerId, propertyId: dto.propertyId ?? null,
        code, title: dto.title.trim(), details: dto.details?.trim() || null, kind: dto.kind, dueAt,
        assignedTo: actor.userId, createdBy: actor.userId,
      }).returning();
      await tx.insert(followUpAuditLog).values({ tenantId: actor.tenantId, followUpId: created.id, actorId: actor.userId, action: 'CREATE' });
      return created;
    });
  }

  async complete(actor: TenantActor, id: string) { return this.setStatus(actor, id, 'DONE'); }
  async cancel(actor: TenantActor, id: string) { return this.setStatus(actor, id, 'CANCELLED'); }

  private async setStatus(actor: TenantActor, id: string, status: 'DONE' | 'CANCELLED') {
    return this.database.withTenant(actor, async (tx) => {
      const [current] = await tx.select().from(followUps).where(and(eq(followUps.id, id), ...this.recordScope(actor))).limit(1);
      if (!current) throw new NotFoundException({ code: 'FOLLOW_UP_NOT_FOUND', message: 'پیگیری پیدا نشد.' });
      if (!canManage(actor, current.assignedTo)) throw new ForbiddenException({ code: 'FOLLOW_UP_UPDATE_DENIED', message: 'اجازه تغییر این پیگیری را ندارید.' });
      if (current.status !== 'OPEN') throw new ConflictException({ code: 'FOLLOW_UP_NOT_OPEN', message: 'این پیگیری باز نیست.' });
      const [updated] = await tx.update(followUps).set({ status, completedAt: status === 'DONE' ? new Date() : null, updatedAt: new Date() })
        .where(and(eq(followUps.id, id), eq(followUps.tenantId, actor.tenantId))).returning();
      await tx.insert(followUpAuditLog).values({ tenantId: actor.tenantId, followUpId: id, actorId: actor.userId, action: status === 'DONE' ? 'COMPLETE' : 'CANCEL' });
      return updated;
    });
  }

  private conditions(actor: TenantActor, query: ListFollowUpsQuery): SQL[] {
    const conditions = this.recordScope(actor);
    if (query.status) conditions.push(eq(followUps.status, query.status));
    return conditions;
  }

  private recordScope(actor: TenantActor): SQL[] {
    const conditions: SQL[] = [eq(followUps.tenantId, actor.tenantId)];
    if (actor.branchId) conditions.push(eq(followUps.branchId, actor.branchId));
    if (actor.role === 'AGENT') conditions.push(eq(followUps.assignedTo, actor.userId));
    return conditions;
  }
}
