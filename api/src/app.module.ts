import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { PropertiesModule } from './properties/properties.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { FollowUpsModule } from './follow-ups/follow-ups.module.js';

@Module({ imports: [DatabaseModule, AuthModule, PropertiesModule, CustomersModule, FollowUpsModule], controllers: [HealthController] })
export class AppModule {}
