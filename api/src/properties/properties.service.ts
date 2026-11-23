import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { and, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import { branches, properties as propertyTable, propertyAuditLog } from '../database/schema.js';
import { DatabaseService } from '../database/database.service.js';
import type { TenantActor } from '../common/request-context.js';
import { CreatePropertyDto, ListPropertiesQuery, UpdatePropertyDto } from './property.dto.js';
import { canManageProperty, validatePropertyStatusTransition, validateTransactionPrices } from './property-rules.js';

type PropertyStatus = 'ACTIVE' | 'UNDER_VISIT' | 'NEGOTIATING' | 'ARCHIVED';

@Injectable()
export class PropertiesService {
  constructor(private readonly database: DatabaseService) {}

  async list(actor: TenantActor, query: ListPropertiesQuery) {
    const conditions = this.listConditions(actor, query);
    return this.database.withTenant(actor, async (tx) => {
      const rows = await tx.select().from(propertyTable).where(and(...conditions))
        .orderBy(desc(propertyTable.createdAt), desc(propertyTable.id)).limit(query.limit).offset(query.offset);
      const [totalRow] = await tx.select({ value: count() }).from(propertyTable).where(and(...conditions));
      return { data: rows, pagination: { limit: query.limit, offset: query.offset, total: Number(totalRow.value), hasMore: query.offset + rows.length < Number(totalRow.value) } };
    });
  }

  async get(actor: TenantActor, id: string) {
    return this.database.withTenant(actor, async (tx) => {
      const [record] = await tx.select().from(propertyTable).where(and(eq(propertyTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!record) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'فایل ملک پیدا نشد.' });
      return record;
    });
  }

  async create(actor: TenantActor, dto: CreatePropertyDto) {
    if (!['OWNER', 'BRANCH_MANAGER', 'SALES_MANAGER', 'AGENT'].includes(actor.role)) {
      throw new ForbiddenException({ code: 'PROPERTY_CREATE_DENIED', message: 'اجازه ثبت فایل ملک ندارید.' });
    }
    if (actor.branchId && actor.branchId !== dto.branchId) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'ثبت فایل در این شعبه مجاز نیست.' });
    validateTransactionPrices(dto);
    return this.database.withTenant(actor, async (tx) => {
      const [branch] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, dto.branchId), eq(branches.tenantId, actor.tenantId))).limit(1);
      if (!branch) throw new ForbiddenException({ code: 'BRANCH_ACCESS_DENIED', message: 'شعبه انتخاب‌شده در دسترس نیست.' });
      const code = `ML-${randomBytes(5).toString('hex').toUpperCase()}`;
      const [created] = await tx.insert(propertyTable).values({
        tenantId: actor.tenantId, branchId: dto.branchId, code,
        title: dto.title.trim(), address: dto.address.trim(), type: dto.type, transaction: dto.transaction,
        areaSqm: dto.areaSqm, bedrooms: dto.bedrooms ?? 0,
        salePrice: dto.salePrice ?? null, deposit: dto.deposit ?? null, monthlyRent: dto.monthlyRent ?? null,
        currency: dto.currency, status: 'ACTIVE', assignedTo: actor.userId, createdBy: actor.userId,
      }).returning();
      await tx.insert(propertyAuditLog).values({ tenantId: actor.tenantId, propertyId: created.id, actorId: actor.userId, action: 'CREATE', changes: { code: created.code } });
      return created;
    });
  }

  async update(actor: TenantActor, id: string, dto: UpdatePropertyDto) {
    return this.database.withTenant(actor, async (tx) => {
      const [current] = await tx.select().from(propertyTable).where(and(eq(propertyTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!current) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'فایل ملک پیدا نشد.' });
      if (!canManageProperty(actor, current)) throw new ForbiddenException({ code: 'PROPERTY_UPDATE_DENIED', message: 'اجازه ویرایش این فایل را ندارید.' });
      if (current.status === 'ARCHIVED') throw new ConflictException({ code: 'PROPERTY_ARCHIVED', message: 'برای ویرایش ابتدا فایل را از بایگانی بازگردانید.' });
      if (dto.status) validatePropertyStatusTransition(current.status, dto.status);
      const nextTransaction = dto.transaction ?? current.transaction;
      const transactionChanged = nextTransaction !== current.transaction;
      const candidate = transactionChanged ? {
        transaction: nextTransaction,
        salePrice: nextTransaction === 'SALE' ? dto.salePrice ?? null : null,
        deposit: nextTransaction === 'MORTGAGE_RENT' ? dto.deposit ?? null : null,
        monthlyRent: ['RENT', 'MORTGAGE_RENT'].includes(nextTransaction) ? dto.monthlyRent ?? null : null,
      } : {
        transaction: nextTransaction,
        salePrice: dto.salePrice ?? current.salePrice,
        deposit: dto.deposit ?? current.deposit,
        monthlyRent: dto.monthlyRent ?? current.monthlyRent,
      };
      validateTransactionPrices(candidate);
      const updates = {
        ...(transactionChanged ? { salePrice: candidate.salePrice, deposit: candidate.deposit, monthlyRent: candidate.monthlyRent } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.transaction !== undefined ? { transaction: dto.transaction } : {}),
        ...(dto.areaSqm !== undefined ? { areaSqm: dto.areaSqm } : {}),
        ...(dto.bedrooms !== undefined ? { bedrooms: dto.bedrooms } : {}),
        ...(dto.salePrice !== undefined ? { salePrice: dto.salePrice } : {}),
        ...(dto.deposit !== undefined ? { deposit: dto.deposit } : {}),
        ...(dto.monthlyRent !== undefined ? { monthlyRent: dto.monthlyRent } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedAt: new Date(),
      };
      const [updated] = await tx.update(propertyTable).set(updates).where(and(eq(propertyTable.id, id), eq(propertyTable.tenantId, actor.tenantId))).returning();
      const changes = Object.fromEntries(Object.keys(dto).map((key) => [key, { from: (current as unknown as Record<string, unknown>)[key], to: (updated as unknown as Record<string, unknown>)[key] }]));
      await tx.insert(propertyAuditLog).values({ tenantId: actor.tenantId, propertyId: id, actorId: actor.userId, action: 'UPDATE', changes });
      return updated;
    });
  }

  async archive(actor: TenantActor, id: string) {
    return this.setArchived(actor, id, true);
  }
  async restore(actor: TenantActor, id: string) {
    return this.setArchived(actor, id, false);
  }

  private async setArchived(actor: TenantActor, id: string, archive: boolean) {
    return this.database.withTenant(actor, async (tx) => {
      const [current] = await tx.select().from(propertyTable).where(and(eq(propertyTable.id, id), ...this.actorScope(actor))).limit(1);
      if (!current) throw new NotFoundException({ code: 'PROPERTY_NOT_FOUND', message: 'فایل ملک پیدا نشد.' });
      if (!canManageProperty(actor, current)) throw new ForbiddenException({ code: 'PROPERTY_UPDATE_DENIED', message: 'اجازه تغییر وضعیت این فایل را ندارید.' });
      if (archive && current.status === 'ARCHIVED') throw new BadRequestException({ code: 'ALREADY_ARCHIVED', message: 'این فایل از قبل بایگانی شده است.' });
      if (!archive && current.status !== 'ARCHIVED') throw new BadRequestException({ code: 'NOT_ARCHIVED', message: 'این فایل در بایگانی نیست.' });
      const nextStatus: PropertyStatus = archive ? 'ARCHIVED' : (current.preArchiveStatus ?? 'ACTIVE');
      const [updated] = await tx.update(propertyTable).set({
        status: nextStatus,
        preArchiveStatus: archive ? current.status : null,
        archivedAt: archive ? new Date() : null,
        updatedAt: new Date(),
      }).where(and(eq(propertyTable.id, id), eq(propertyTable.tenantId, actor.tenantId))).returning();
      await tx.insert(propertyAuditLog).values({ tenantId: actor.tenantId, propertyId: id, actorId: actor.userId, action: archive ? 'ARCHIVE' : 'RESTORE', changes: { from: current.status, to: nextStatus } });
      return updated;
    });
  }

  private listConditions(actor: TenantActor, query: ListPropertiesQuery): SQL[] {
    const conditions = this.actorScope(actor);
    if (query.status) conditions.push(eq(propertyTable.status, query.status));
    else if (!query.includeArchived) conditions.push(isNull(propertyTable.archivedAt));
    return conditions;
  }

  private actorScope(actor: TenantActor): SQL[] {
    const conditions: SQL[] = [eq(propertyTable.tenantId, actor.tenantId)];
    if (actor.branchId) conditions.push(eq(propertyTable.branchId, actor.branchId));
    if (actor.role === 'AGENT') conditions.push(eq(propertyTable.assignedTo, actor.userId));
    return conditions;
  }
}
