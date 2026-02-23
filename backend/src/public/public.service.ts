import { Injectable } from '@nestjs/common';
import { mapMenuResponse, mapRestaurantPublic } from '../common/mappers/api-contract.mappers';
import { OrdersService } from '../orders/orders.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantResolverService } from '../restaurants/restaurant-resolver.service';
import { PublicMenuResponseDto } from './dto/menu.response.dto';
import { RestaurantPublicResponseDto } from './dto/restaurant-public.response.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly restaurantResolverService: RestaurantResolverService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  async getRestaurantPublicInfo(slug: string): Promise<RestaurantPublicResponseDto> {
    const restaurant = await this.restaurantResolverService.getRestaurantBySlug(slug);
    const now = new Date();

    return mapRestaurantPublic(restaurant, now);
  }

  async getRestaurantMenu(slug: string): Promise<PublicMenuResponseDto> {
    const restaurant = await this.restaurantResolverService.getRestaurantBySlug(slug);
    const now = new Date();

    const categories = await this.prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return mapMenuResponse(restaurant, categories, now);
  }

  async createOrder(slug: string, dto: CreatePublicOrderDto) {
    return this.ordersService.createPublicOrder(slug, dto);
  }
}
