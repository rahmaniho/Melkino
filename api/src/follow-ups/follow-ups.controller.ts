import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard.js';
import { TenantMembershipGuard } from '../auth/tenant-membership.guard.js';
import type { TenantRequest } from '../common/request-context.js';
import { CreateFollowUpDto, ListFollowUpsQuery } from './follow-up.dto.js';
import { FollowUpsService } from './follow-ups.service.js';

@Controller('follow-ups')
@UseGuards(SupabaseJwtGuard, TenantMembershipGuard)
export class FollowUpsController {
  constructor(private readonly followUps: FollowUpsService) {}

  @Get()
  list(@Req() request: TenantRequest, @Query() query: ListFollowUpsQuery) {
    return this.followUps.list(request.tenantActor!, query);
  }

  @Post()
  async create(@Req() request: TenantRequest, @Body() dto: CreateFollowUpDto, @Res({ passthrough: true }) response: Response) {
    const followUp = await this.followUps.create(request.tenantActor!, dto);
    response.location(`/api/v1/follow-ups/${followUp.id}`);
    return followUp;
  }

  @Post(':id/complete')
  complete(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.followUps.complete(request.tenantActor!, id);
  }

  @Post(':id/cancel')
  cancel(@Req() request: TenantRequest, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.followUps.cancel(request.tenantActor!, id);
  }
}
