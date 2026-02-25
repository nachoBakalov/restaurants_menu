import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagService } from '../billing/feature-flag.service';
import { mapMenuResponse, mapRestaurantPublic } from '../common/mappers/api-contract.mappers';
import { OrdersService } from '../orders/orders.service';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantResolverService } from '../restaurants/restaurant-resolver.service';
import { PublicMenuResponseDto } from './dto/menu.response.dto';
import { RestaurantPublicResponseDto } from './dto/restaurant-public.response.dto';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    private readonly restaurantResolverService: RestaurantResolverService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async getRestaurantPublicInfo(slug: string): Promise<RestaurantPublicResponseDto> {
    const restaurant = await this.restaurantResolverService.getRestaurantBySlug(slug);
    const now = new Date();
    const features = await this.resolvePublicFeatures(restaurant.id);

    return mapRestaurantPublic(restaurant, now, features);
  }

  async getRestaurantMenu(slug: string): Promise<PublicMenuResponseDto> {
    const restaurant = await this.restaurantResolverService.getRestaurantBySlug(slug);
    const now = new Date();
    const features = await this.resolvePublicFeatures(restaurant.id);

    const categories = await this.prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    return mapMenuResponse(restaurant, categories, now, features);
  }

  async createOrder(slug: string, dto: CreatePublicOrderDto) {
    return this.ordersService.createPublicOrder(slug, dto);
  }

  private async resolvePublicFeatures(restaurantId: string): Promise<{ ORDERING: boolean }> {
    try {
      const orderingEnabled = await this.featureFlagService.isFeatureEnabled(restaurantId, 'ORDERING');
      return { ORDERING: orderingEnabled };
    } catch (error) {
      this.logger.error(`Failed to resolve public features for restaurant ${restaurantId}`, error as Error);
      return { ORDERING: false };
    }
  }
}
