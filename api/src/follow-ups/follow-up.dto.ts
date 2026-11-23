import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, Matches } from 'class-validator';
import { followUpKind, followUpStatus } from '../database/schema.js';

const kinds = followUpKind.enumValues;
const statuses = followUpStatus.enumValues;

export class ListFollowUpsQuery {
  @IsOptional() @IsEnum(statuses) status?: typeof statuses[number];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100_000) offset = 0;
}

export class CreateFollowUpDto {
  @IsUUID() branchId!: string;
  @IsUUID() customerId!: string;
  @IsOptional() @IsUUID() propertyId?: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @Matches(/\S/) @MaxLength(160) title!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(2000) details?: string;
  @IsEnum(kinds) kind!: typeof kinds[number];
  @IsDateString({ strict: true }) dueAt!: string;
}
