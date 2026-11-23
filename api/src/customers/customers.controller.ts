import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard.js';
import { TenantMembershipGuard } from '../auth/tenant-membership.guard.js';
import type { TenantRequest } from '../common/request-context.js';
import { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './customer.dto.js';
import { CustomersService } from './customers.service.js';

@Controller('customers')
@UseGuards(SupabaseJwtGuard, TenantMembershipGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(@Req() request: TenantRequest, @Query() query: ListCustomersQuery) {
    return this.customers.list(request.tenantActor!, query);
  }

  @Get(':id')
  get(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.customers.get(request.tenantActor!, id);
  }

  @Post()
  async create(@Req() request: TenantRequest, @Body() dto: CreateCustomerDto, @Res({ passthrough: true }) response: Response) {
    const customer = await this.customers.create(request.tenantActor!, dto);
    response.location(`/api/v1/customers/${customer.id}`);
    return customer;
  }

  @Patch(':id')
  update(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(request.tenantActor!, id, dto);
  }

  @Post(':id/archive')
  archive(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.customers.archive(request.tenantActor!, id);
  }

  @Post(':id/restore')
  restore(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.customers.restore(request.tenantActor!, id);
  }
}
