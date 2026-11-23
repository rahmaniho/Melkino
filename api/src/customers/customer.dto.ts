import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { currencyCode, customerKind, customerStatus, propertyType, transactionType } from '../database/schema.js';
import { normalizeDigits } from '../properties/numbers.js';

const trimText = () => Transform(({ value }) => typeof value === 'string' ? value.trim() : value);
const numericText = () => Transform(({ value }) => normalizeDigits(typeof value === 'string' ? value.trim().replace(/[٬,\s]/g, '') : value));
const kindValues = customerKind.enumValues;
const statusValues = customerStatus.enumValues;
const propertyTypes = propertyType.enumValues;
const transactionValues = transactionType.enumValues;
const currencies = currencyCode.enumValues;

export class ListCustomersQuery {
  @IsOptional() @IsEnum(statusValues) status?: typeof statusValues[number];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 30;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100_000) offset = 0;
  @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() includeArchived = false;
  @IsOptional() @trimText() @IsString() @MaxLength(100) search?: string;
}

export class CreateCustomerDto {
  @IsUUID() branchId!: string;
  @trimText() @IsString() @Matches(/\S/) @MaxLength(160) fullName!: string;
  @Transform(({ value }) => normalizeDigits(typeof value === 'string' ? value.trim() : value)) @IsString() @Matches(/^[+\d۰-۹٠-٩()\-\s]{7,24}$/) phone!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value) @IsEmail() @MaxLength(254) email?: string;
  @IsEnum(kindValues) kind!: typeof kindValues[number];
  @IsOptional() @IsEnum(transactionValues) targetTransaction?: typeof transactionValues[number];
  @IsOptional() @IsEnum(propertyTypes) preferredPropertyType?: typeof propertyTypes[number];
  @IsOptional() @numericText() @IsString() @Matches(/^\d{1,20}$/) budgetMin?: string;
  @IsOptional() @numericText() @IsString() @Matches(/^\d{1,20}$/) budgetMax?: string;
  @IsEnum(currencies) currency!: typeof currencies[number];
  @IsOptional() @trimText() @IsString() @MaxLength(240) preferredArea?: string;
  @IsOptional() @trimText() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @trimText() @IsString() @Matches(/\S/) @MaxLength(160) fullName?: string;
  @IsOptional() @Transform(({ value }) => normalizeDigits(typeof value === 'string' ? value.trim() : value)) @IsString() @Matches(/^[+\d۰-۹٠-٩()\-\s]{7,24}$/) phone?: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() || null : value) @IsEmail() @MaxLength(254) email?: string | null;
  @IsOptional() @IsEnum(kindValues) kind?: typeof kindValues[number];
  @IsOptional() @IsEnum(transactionValues) targetTransaction?: typeof transactionValues[number] | null;
  @IsOptional() @IsEnum(propertyTypes) preferredPropertyType?: typeof propertyTypes[number] | null;
  @IsOptional() @numericText() @IsString() @Matches(/^\d{1,20}$/) budgetMin?: string | null;
  @IsOptional() @numericText() @IsString() @Matches(/^\d{1,20}$/) budgetMax?: string | null;
  @IsOptional() @IsEnum(currencies) currency?: typeof currencies[number];
  @IsOptional() @trimText() @IsString() @MaxLength(240) preferredArea?: string | null;
  @IsOptional() @trimText() @IsString() @MaxLength(2000) notes?: string | null;
  @IsOptional() @IsIn(['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED']) status?: Exclude<typeof statusValues[number], 'ARCHIVED'>;
}
