import { OrderType } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePublicOrderItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  qty!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreatePublicOrderDto {
  @IsIn([OrderType.TABLE, OrderType.DELIVERY])
  type!: OrderType;

  @ValidateIf((dto: CreatePublicOrderDto) => dto.type === OrderType.TABLE)
  @IsString()
  @IsNotEmpty()
  tableCode?: string;

  @ValidateIf((dto: CreatePublicOrderDto) => dto.type === OrderType.DELIVERY)
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderItemDto)
  items!: CreatePublicOrderItemDto[];
}

export class CreatePublicOrderResponseDto {
  orderId!: string;
  status!: 'NEW';
  type!: 'DELIVERY' | 'TABLE';
  createdAt!: string;
  totals!: {
    EUR: { totalCents: number };
    BGN?: { totalCents: number };
  };
}
