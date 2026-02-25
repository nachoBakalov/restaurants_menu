import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemPricesDto {
  @IsInt()
  @Min(0)
  priceEurCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceBgnCents?: number | null;
}

export class ItemPromoDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  promoPriceEurCents?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  promoPriceBgnCents?: number | null;

  @IsOptional()
  @IsString()
  promoStartsAt?: string | null;

  @IsOptional()
  @IsString()
  promoEndsAt?: string | null;
}

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  allergens?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ValidateNested()
  @Type(() => ItemPricesDto)
  prices!: ItemPricesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItemPromoDto)
  promo?: ItemPromoDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  allergens?: string | null;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItemPricesDto)
  prices?: ItemPricesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ItemPromoDto)
  promo?: ItemPromoDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
