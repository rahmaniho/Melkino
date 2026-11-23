import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { branches, customerAuditLog, customers as customerTable } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import type { TenantActor } from '../common/request-context.js';
import { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './customer.dto.js';

type CustomerStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' | 'ARCHIVED';

function mayCreate(actor: TenantActor) {
  return ['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT', 'RECEPTIONIST'].includes(actor.role);
}
function mayManage(actor: TenantActor, record: { assignedTo: string }) {
  return ['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER'].includes(actor.role)
    || (actor.role === 'AGENT' && record.assignedTo === actor.userId);
}
function escapeLike(value: string) { return value.replace(/[\\%_]/g, '\\$&'); }

@Injectable()
export class CustomersService {
  constructor(private readonly database: DatabaseService) {}

  async list(actor: TenantActor, query: ListCustomersQuery) {
    const conditions = this.listConditions(actor, query);
    return this.database.withTenant(actor, async (tx) => {
      const rows = await tx.select().from(customerTable).where(and(...conditions))
        .orderBy(desc(customerTable.createdAt), desc(customerTable.id)).limit(query.limit).offset(query.offset);
      const [totalRow] = await tx.select({ value: count() }).from(customerTable).where(and(...conditions));
      return { data: rows, pagination: { limit: query.limit, offset: query.offset, total: Number(totalRow.value), hasMore: query.offset + rows.length < Number(totalRow.value) } };
    });
  }

  async get(actor: TenantActor, id: string) {
    return this.database.withTenant(actor, async (tx) => {
      const [record] = await tx.select().from(customerTable).where(and(eq(customerTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!record) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'مشتری پیدا نشد.' });
      return record;
    });
  }

  async create(actor: TenantActor, dto: CreateCustomerDto) {
    if (!mayCreate(actor)) throw new ForbiddenException({ code: 'CUSTOMER_CREATE_DENIED', message: 'اجازه ثبت مشتری ندارید.' });
    if (actor.branchId && actor.branchId !== dto.branchId) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'ثبت مشتری در این شعبه مجاز نیست.' });
    this.validateBudget(dto.budgetMin, dto.budgetMax);
    return this.database.withTenant(actor, async (tx) => {
      const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, dto.branchId), eq(branches.tenantId, actor.tenantId))).limit(1);
      if (!branch) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'شعبه انتخاب‌شده در دسترس نیست.' });
      const code = `CU-${randomBytes(5).toString('hex').toUpperCase()}`;
      const [created] = await tx.insert(customerTable).values({
        tenantId: actor.tenantId, branchId: dto.branchId, code,
        fullName: dto.fullName.trim(), phone: dto.phone.trim(), email: dto.email?.trim() || null,
        kind: dto.kind, targetTransaction: dto.targetTransaction ?? null, preferredPropertyType: dto.preferredPropertyType ?? null,
        budgetMin: dto.budgetMin ?? null, budgetMax: dto.budgetMax ?? null, currency: dto.currency,
        preferredArea: dto.preferredArea?.trim() || null, notes: dto.notes?.trim() || null,
        status: 'NEW', assignedTo: actor.userId, createdBy: actor.userId,
      }).returning();
      await tx.insert(customerAuditLog).values({ tenantId: actor.tenantId, customerId: created.id, actorId: actor.userId, action: 'CREATE', changes: { code: created.code } });
      return created;
    });
  }

  async update(actor: TenantActor, id: string, dto: UpdateCustomerDto) {
    return this.database.withTenant(actor, async (tx) => {
      const [current] = await tx.select().from(customerTable).where(and(eq(customerTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!current) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'مشتری پیدا نشد.' });
      if (!mayManage(actor, current)) throw new ForbiddenException({ code: 'CUSTOMER_UPDATE_DENIED', message: 'اجازه ویرایش این مشتری را ندارید.' });
      if (current.status === 'ARCHIVED') throw new ConflictException({ code: 'CUSTOMER_ARCHIVED', message: 'برای ویرایش ابتدا مشتری را از بایگانی بازگردانید.' });
      const nextMin = dto.budgetMin === undefined ? current.budgetMin : dto.budgetMin;
      const nextMax = dto.budgetMax === undefined ? current.budgetMax : dto.budgetMax;
      this.validateBudget(nextMin, nextMax);
      const updates = {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.targetTransaction !== undefined ? { targetTransaction: dto.targetTransaction } : {}),
        ...(dto.preferredPropertyType !== undefined ? { preferredPropertyType: dto.preferredPropertyType } : {}),
        ...(dto.budgetMin !== undefined ? { budgetMin: dto.budgetMin } : {}),
        ...(dto.budgetMax !== undefined ? { budgetMax: dto.budgetMax } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.preferredArea !== undefined ? { preferredArea: dto.preferredArea?.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedAt: new Date(),
      };
      const [updated] = await tx.update(customerTable).set(updates).where(and(eq(customerTable.id, id), eq(customerTable.tenantId, actor.tenantId))).returning();
      await tx.insert(customerAuditLog).values({ tenantId: actor.tenantId, customerId: id, actorId: actor.userId, action: 'UPDATE', changes: { fields: Object.keys(dto) } });
      return updated;
    });
  }

  async archive(actor: TenantActor, id: string) { return this.setArchived(actor, id, true); }
  async restore(actor: TenantActor, id: string) { return this.setArchived(actor, id, false); }

  private async setArchived(actor: TenantActor, id: string, archive: boolean) {
    return this.database.withTenant(actor, async (tx) => {
      const [current] = await tx.select().from(customerTable).where(and(eq(customerTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!current) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'مشتری پیدا نشد.' });
      if (!mayManage(actor, current)) throw new ForbiddenException({ code: 'CUSTOMER_UPDATE_DENIED', message: 'اجازه تغییر وضعیت این مشتری را ندارید.' });
      if (archive && current.status === 'ARCHIVED') throw new BadRequestException({ code: 'ALREADY_ARCHIVED', message: 'این مشتری از قبل بایگانی شده است.' });
      if (!archive && current.status !== 'ARCHIVED') throw new BadRequestException({ code: 'NOT_ARCHIVED', message: 'این مشتری در بایگانی نیست.' });
      const nextStatus: CustomerStatus = archive ? 'ARCHIVED' : (current.preArchiveStatus ?? 'NEW');
      const [updated] = await tx.update(customerTable).set({
        status: nextStatus, preArchiveStatus: archive ? current.status : null,
        archivedAt: archive ? new Date() : null, updatedAt: new Date(),
      }).where(and(eq(customerTable.id, id), eq(customerTable.tenantId, actor.tenantId))).returning();
      await tx.insert(customerAuditLog).values({ tenantId: actor.tenantId, customerId: id, actorId: actor.userId, action: archive ? 'ARCHIVE' : 'RESTORE', changes: { from: current.status, to: nextStatus } });
      return updated;
    });
  }

  private validateBudget(min?: string | null, max?: string | null) {
    if (min && max && BigInt(min) > BigInt(max)) throw new BadRequestException({ code: 'CUSTOMER_BUDGET_INVALID', message: 'حداقل بودجه نباید از حداکثر بودجه بیشتر باشد.' });
  }

  private listConditions(actor: TenantActor, query: ListCustomersQuery): SQL[] {
    const conditions = this.actorScope(actor);
    if (query.status) conditions.push(eq(customerTable.status, query.status));
    else if (!query.includeArchived) conditions.push(isNull(customerTable.archivedAt));
    if (query.search?.trim()) {
      const pattern = `%${escapeLike(query.search.trim())}%`;
      conditions.push(or(ilike(customerTable.fullName, pattern), ilike(customerTable.phone, pattern), ilike(customerTable.code, pattern))!);
    }
    return conditions;
  }

  private actorScope(actor: TenantActor): SQL[] {
    const conditions: SQL[] = [eq(customerTable.tenantId, actor.tenantId)];
    if (actor.branchId) conditions.push(eq(customerTable.branchId, actor.branchId));
    if (actor.role === 'AGENT') conditions.push(eq(customerTable.assignedTo, actor.userId));
    return conditions;
  }
}
