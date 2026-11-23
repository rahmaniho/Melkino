import { Module } from '@nestjs/common';
import { SupabaseJwtGuard } from './supabase-jwt.guard.js';
import { TenantMembershipGuard } from './tenant-membership.guard.js';

@Module({ providers: [SupabaseJwtGuard, TenantMembershipGuard], exports: [SupabaseJwtGuard, TenantMembershipGuard] })
export class AuthModule {}
