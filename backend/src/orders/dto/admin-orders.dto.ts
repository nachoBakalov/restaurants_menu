import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @MinLength(1)
  restaurantId?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class AdminOrderListResponseDto {
  items!: Array<{
    id: string;
    type: 'TABLE' | 'DELIVERY' | 'TAKEAWAY';
    status: OrderStatus;
    table: { code: string; name: string | null } | null;
    deliveryAddress: string | null;
    phone: string | null;
    customerName: string | null;
    note: string | null;
    createdAt: string;
    totals: {
      EUR: { totalCents: number };
      BGN?: { totalCents: number };
    };
  }>;
  nextCursor!: string | null;
}

export class AdminOrderDetailsResponseDto {
  id!: string;
  type!: 'TABLE' | 'DELIVERY' | 'TAKEAWAY';
  status!: OrderStatus;
  deliveryAddress!: string | null;
  phone!: string | null;
  customerName!: string | null;
  note!: string | null;
  createdAt!: string;
  updatedAt!: string;
  totals!: {
    EUR: { totalCents: number };
    BGN?: { totalCents: number };
  };
  orderItems!: Array<{
    id: string;
    itemId: string | null;
    name: string;
    qty: number;
    unitPrice: {
      EUR: { cents: number };
      BGN?: { cents: number };
    };
    note: string | null;
  }>;
}
