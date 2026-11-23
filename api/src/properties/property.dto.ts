import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsString, IsUUID, Matches, Max, MaxLength, Min, IsNotEmpty, ValidateIf } from 'class-validator';
import { currencyCode, propertyStatus, propertyType, transactionType } from '../database/schema.js';
import { normalizeDigits } from './numbers.js';

const numericText = () => Transform(({ value }) => normalizeDigits(value));
const currencyValues = currencyCode.enumValues;
const propertyTypes = propertyType.enumValues;
const transactionTypes = transactionType.enumValues;
const propertyStatuses = propertyStatus.enumValues;
const transformInteger = () => Transform(({ value }) => Number(normalizeDigits(value)));

export class ListPropertiesQuery {
  @ValidateIf((_object, value) => value !== undefined) @IsEnum(propertyStatuses) status?: typeof propertyStatuses[number];
  @ValidateIf((_object, value) => value !== undefined) @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 30;
  @ValidateIf((_object, value) => value !== undefined) @Type(() => Number) @IsInt() @Min(0) @Max(100_000) offset = 0;
  @ValidateIf((_object, value) => value !== undefined) @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() includeArchived = false;
}

export class CreatePropertyDto {
  @IsUUID() branchId!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @IsNotEmpty() @MaxLength(160) title!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @IsNotEmpty() @MaxLength(500) address!: string;
  @IsEnum(propertyTypes) type!: typeof propertyTypes[number];
  @IsEnum(transactionTypes) transaction!: typeof transactionTypes[number];
  @numericText() @IsString() @Matches(/^\d{1,10}(?:\.\d{1,2})?$/) areaSqm!: string;
  @ValidateIf((_object, value) => value !== undefined) @transformInteger() @IsInt() @Min(0) @Max(30) bedrooms = 0;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) salePrice?: string;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) deposit?: string;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) monthlyRent?: string;
  @IsEnum(currencyValues) currency!: typeof currencyValues[number];
}

export class UpdatePropertyDto {
  @ValidateIf((_object, value) => value !== undefined) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @ValidateIf((_object, value) => value !== undefined) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @IsNotEmpty() @MaxLength(500) address?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsEnum(propertyTypes) type?: typeof propertyTypes[number];
  @ValidateIf((_object, value) => value !== undefined) @IsEnum(transactionTypes) transaction?: typeof transactionTypes[number];
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,10}(?:\.\d{1,2})?$/) areaSqm?: string;
  @ValidateIf((_object, value) => value !== undefined) @transformInteger() @IsInt() @Min(0) @Max(30) bedrooms?: number;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) salePrice?: string;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) deposit?: string;
  @ValidateIf((_object, value) => value !== undefined) @numericText() @IsString() @Matches(/^\d{1,20}$/) monthlyRent?: string;
  @ValidateIf((_object, value) => value !== undefined) @IsEnum(currencyValues) currency?: typeof currencyValues[number];
  @ValidateIf((_object, value) => value !== undefined) @IsEnum(propertyStatuses) status?: typeof propertyStatuses[number];
}
