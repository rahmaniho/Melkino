import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard.js';
import { TenantMembershipGuard } from '../auth/tenant-membership.guard.js';
import type { TenantRequest } from '../common/request-context.js';
import { CreatePropertyDto, ListPropertiesQuery, UpdatePropertyDto } from './property.dto.js';
import { PropertiesService } from './properties.service.js';

@Controller('properties')
@UseGuards(SupabaseJwtGuard, TenantMembershipGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(@Req() request: TenantRequest, @Query() query: ListPropertiesQuery) {
    return this.properties.list(request.tenantActor!, query);
  }

  @Get(':id')
  get(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.get(request.tenantActor!, id);
  }

  @Post()
  async create(@Req() request: TenantRequest, @Body() dto: CreatePropertyDto, @Res({ passthrough: true }) response: Response) {
    const property = await this.properties.create(request.tenantActor!, dto);
    response.location(`/api/v1/properties/${property.id}`);
    return property;
  }

  @Patch(':id')
  update(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(request.tenantActor!, id, dto);
  }

  @Post(':id/archive')
  archive(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.archive(request.tenantActor!, id);
  }

  @Post(':id/restore')
  restore(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.properties.restore(request.tenantActor!, id);
  }
}
