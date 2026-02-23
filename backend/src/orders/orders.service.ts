import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, UserRole } from '@prisma/client';
import { FeatureFlagService } from '../billing/feature-flag.service';
import { mapItemPricing, mapOrderDetails, mapOrderSummary, mapRestaurantPublic } from '../common/mappers/api-contract.mappers';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantResolverService } from '../restaurants/restaurant-resolver.service';
import { AdminOrdersQueryDto, UpdateOrderStatusDto } from './dto/admin-orders.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  restaurantId: string | null;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurantResolverService: RestaurantResolverService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async createPublicOrder(slug: string, dto: CreatePublicOrderDto) {
    const restaurant = await this.restaurantResolverService.getRestaurantBySlug(slug);

    const orderingEnabled = await this.featureFlagService.isFeatureEnabled(restaurant.id, 'ORDERING');
    if (!orderingEnabled) {
      throw new ForbiddenException({
        code: 'FEATURE_DISABLED',
        message: 'Feature ORDERING is disabled',
        details: { feature: 'ORDERING' },
      });
    }

    const now = new Date();
    const restaurantPublic = mapRestaurantPublic(restaurant, now);

    const itemIds = [...new Set(dto.items.map((item) => item.itemId))];
    const items = await this.prisma.item.findMany({
      where: {
        id: { in: itemIds },
        restaurantId: restaurant.id,
        isAvailable: true,
      },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [
          {
            field: 'items',
            message: 'Some items are invalid or unavailable',
          },
        ],
      });
    }

    let tableId: string | null = null;
    if (dto.type === OrderType.TABLE) {
      const table = await this.prisma.table.findUnique({
        where: {
          restaurantId_code: {
            restaurantId: restaurant.id,
            code: dto.tableCode!,
          },
        },
      });

      if (!table) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'tableCode',
              message: 'Table not found',
            },
          ],
        });
      }

      tableId = table.id;
    }

    const itemById = new Map(items.map((item) => [item.id, item]));

    let totalEurCents = 0;
    let totalBgnCents = 0;
    let hasBgnTotals = false;

    const orderItemsData = dto.items.map((requestItem) => {
      const item = itemById.get(requestItem.itemId)!;
      const pricing = mapItemPricing(item, restaurantPublic.currency, now);
      const eurUnit = pricing.prices.EUR.currentCents;
      const bgnUnit = pricing.prices.BGN?.currentCents;

      totalEurCents += eurUnit * requestItem.qty;

      if (bgnUnit !== undefined) {
        totalBgnCents += bgnUnit * requestItem.qty;
        hasBgnTotals = true;
      }

      return {
        itemId: item.id,
        nameSnapshot: item.name,
        qty: requestItem.qty,
        unitPriceEurCents: eurUnit,
        unitPriceBgnCents: bgnUnit ?? null,
        note: requestItem.note ?? null,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        type: dto.type,
        status: OrderStatus.NEW,
        tableId,
        deliveryAddress: dto.type === OrderType.DELIVERY ? dto.deliveryAddress! : null,
        phone: dto.phone ?? null,
        customerName: dto.customerName ?? null,
        note: dto.note ?? null,
        totalEurCents,
        totalBgnCents: hasBgnTotals ? totalBgnCents : null,
        orderItems: {
          create: orderItemsData,
        },
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      type: order.type,
      createdAt: order.createdAt.toISOString(),
      totals: {
        EUR: { totalCents: order.totalEurCents },
        ...(order.totalBgnCents !== null ? { BGN: { totalCents: order.totalBgnCents } } : {}),
      },
    };
  }

  async getAdminOrders(user: AuthUser, query: AdminOrdersQueryDto) {
    const restaurantId = this.getScopedRestaurantId(user, query.restaurantId);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        table: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });

    return {
      items: orders.map((order) => mapOrderSummary(order, order.table)),
      nextCursor: null,
    };
  }

  async getAdminOrderById(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(user.role === UserRole.SUPERADMIN ? {} : { restaurantId: user.restaurantId! }),
      },
      include: {
        table: {
          select: {
            code: true,
            name: true,
          },
        },
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return mapOrderDetails(order, order.orderItems, order.table);
  }

  async updateAdminOrderStatus(user: AuthUser, orderId: string, dto: UpdateOrderStatusDto) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(user.role === UserRole.SUPERADMIN ? {} : { restaurantId: user.restaurantId! }),
      },
      select: { id: true },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      select: { id: true, status: true, updatedAt: true },
    });

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt.toISOString(),
    };
  }

  private getScopedRestaurantId(user: AuthUser, requestedRestaurantId?: string): string {
    if (user.role === UserRole.SUPERADMIN) {
      if (!requestedRestaurantId) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'restaurantId', message: 'restaurantId is required for SUPERADMIN' }],
        });
      }

      return requestedRestaurantId;
    }

    if (!user.restaurantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Forbidden',
      });
    }

    if (requestedRestaurantId && requestedRestaurantId !== user.restaurantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Forbidden',
      });
    }

    return user.restaurantId;
  }
}
