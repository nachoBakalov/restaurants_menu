import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { assertOwnership } from '../common/helpers/assert-ownership';
import { AuthUser } from '../common/auth/auth-user.type';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { CreateItemDto, ItemPromoDto, UpdateItemDto } from './dto/items.dto';

@Injectable()
export class AdminMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getMenuQrSvg(user: AuthUser, restaurantId?: string) {
    const menuUrl = await this.getMenuUrl(user, restaurantId);

    return QRCode.toString(menuUrl, {
      type: 'svg',
      margin: 1,
      width: 512,
    });
  }

  async getMenuQrPngBuffer(user: AuthUser, restaurantId?: string) {
    const menuUrl = await this.getMenuUrl(user, restaurantId);

    return QRCode.toBuffer(menuUrl, {
      type: 'png',
      margin: 1,
      width: 512,
    });
  }

  private async getMenuUrl(user: AuthUser, restaurantId?: string): Promise<string> {
    const resolvedRestaurantId = this.resolveRestaurantId(user, restaurantId);

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: resolvedRestaurantId },
      select: { slug: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const baseUrl = this.configService.get<string>('BASE_URL')!;
    return `${baseUrl.replace(/\/+$/, '')}/${restaurant.slug}`;
  }

  async getCategories(user: AuthUser, restaurantId?: string) {
    const resolvedRestaurantId = this.resolveRestaurantId(user, restaurantId);

    return this.prisma.category.findMany({
      where: { restaurantId: resolvedRestaurantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createCategory(user: AuthUser, dto: CreateCategoryDto, restaurantId?: string) {
    const resolvedRestaurantId = this.resolveRestaurantId(user, restaurantId);

    return this.prisma.category.create({
      data: {
        restaurantId: resolvedRestaurantId,
        name: dto.name,
        imageUrl: dto.imageUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(user: AuthUser, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    assertOwnership(category.restaurantId, user);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async deleteCategory(user: AuthUser, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    assertOwnership(category.restaurantId, user);

    await this.prisma.$transaction([
      this.prisma.item.deleteMany({ where: { categoryId: id } }),
      this.prisma.category.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  async getItems(user: AuthUser, categoryId?: string, restaurantId?: string) {
    let resolvedRestaurantId: string | undefined;

    if (!categoryId) {
      resolvedRestaurantId = this.resolveRestaurantId(user, restaurantId);
    }

    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      assertOwnership(category.restaurantId, user);
      resolvedRestaurantId = category.restaurantId;
    }

    return this.prisma.item.findMany({
      where: {
        restaurantId: resolvedRestaurantId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createItem(user: AuthUser, dto: CreateItemDto, restaurantId?: string) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    assertOwnership(category.restaurantId, user);

    if (user.role === UserRole.SUPERADMIN) {
      if (restaurantId && restaurantId !== category.restaurantId) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'restaurantId', message: 'categoryId does not belong to restaurantId' }],
        });
      }
    } else {
      const resolvedRestaurantId = this.resolveRestaurantId(user, restaurantId);
      if (resolvedRestaurantId !== category.restaurantId) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'restaurantId', message: 'categoryId does not belong to restaurantId' }],
        });
      }
    }

    return this.prisma.item.create({
      data: {
        restaurantId: category.restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        allergens: dto.allergens ?? null,
        isAvailable: dto.isAvailable ?? true,
        priceEurCents: dto.prices.priceEurCents,
        priceBgnCents: dto.prices.priceBgnCents ?? null,
        ...this.mapPromoData(dto.promo),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateItem(user: AuthUser, id: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    assertOwnership(item.restaurantId, user);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      assertOwnership(category.restaurantId, user);
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.allergens !== undefined ? { allergens: dto.allergens } : {}),
        ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
        ...(dto.prices?.priceEurCents !== undefined ? { priceEurCents: dto.prices.priceEurCents } : {}),
        ...(dto.prices?.priceBgnCents !== undefined ? { priceBgnCents: dto.prices.priceBgnCents } : {}),
        ...this.mapPromoData(dto.promo),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async deleteItem(user: AuthUser, id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    assertOwnership(item.restaurantId, user);

    await this.prisma.item.delete({ where: { id } });
    return { success: true };
  }

  private mapPromoData(promo?: ItemPromoDto) {
    if (!promo) {
      return {};
    }

    return {
      ...(promo.promoPriceEurCents !== undefined ? { promoPriceEurCents: promo.promoPriceEurCents } : {}),
      ...(promo.promoPriceBgnCents !== undefined ? { promoPriceBgnCents: promo.promoPriceBgnCents } : {}),
      ...(promo.promoStartsAt !== undefined
        ? { promoStartsAt: promo.promoStartsAt ? new Date(promo.promoStartsAt) : null }
        : {}),
      ...(promo.promoEndsAt !== undefined
        ? { promoEndsAt: promo.promoEndsAt ? new Date(promo.promoEndsAt) : null }
        : {}),
    };
  }

  private resolveRestaurantId(user: AuthUser, restaurantId?: string): string {
    if (user.role === UserRole.SUPERADMIN) {
      if (!restaurantId) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'restaurantId', message: 'restaurantId is required for SUPERADMIN' }],
        });
      }

      return restaurantId;
    }

    if (!user.restaurantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Forbidden',
      });
    }

    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Forbidden',
      });
    }

    return user.restaurantId;
  }
}
