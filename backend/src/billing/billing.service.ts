import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../common/auth/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantWithOwnerDto } from './dto/create-restaurant-with-owner.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';
import { SetFeatureOverrideDto } from './dto/set-feature-override.dto';
import { FeatureFlagService } from './feature-flag.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async createRestaurantWithOwner(dto: CreateRestaurantWithOwnerDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingSlug = await this.prisma.restaurant.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException('Slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const basicPlan = await tx.plan.upsert({
          where: { key: 'BASIC' },
          update: { name: 'Basic' },
          create: { key: 'BASIC', name: 'Basic' },
        });

        const orderingFeature = await tx.feature.upsert({
          where: { key: 'ORDERING' },
          update: {},
          create: { key: 'ORDERING' },
        });

        await tx.planFeature.upsert({
          where: {
            planId_featureId: {
              planId: basicPlan.id,
              featureId: orderingFeature.id,
            },
          },
          update: {},
          create: {
            planId: basicPlan.id,
            featureId: orderingFeature.id,
          },
        });

        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.restaurantName,
            slug: dto.slug,
          },
        });

        const owner = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: UserRole.OWNER,
            restaurantId: restaurant.id,
          },
        });

        await tx.subscription.create({
          data: {
            restaurantId: restaurant.id,
            planId: basicPlan.id,
            status: SubscriptionStatus.TRIAL,
            startsAt,
            endsAt,
          },
        });

        return { restaurant, owner };
      });

      return {
        restaurant: {
          id: result.restaurant.id,
          name: result.restaurant.name,
          slug: result.restaurant.slug,
        },
        owner: {
          id: result.owner.id,
          email: result.owner.email,
          role: result.owner.role,
          restaurantId: result.owner.restaurantId,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email or slug already exists');
      }
      throw error;
    }
  }

  async createRestaurantSubscription(restaurantId: string, dto: CreateSubscriptionDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const plan = await this.prisma.plan.findUnique({ where: { key: dto.planKey } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return this.prisma.subscription.create({
      data: {
        restaurantId,
        planId: plan.id,
        status: dto.status,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async setFeatureOverride(restaurantId: string, featureKey: string, dto: SetFeatureOverrideDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const feature = await this.prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    return this.prisma.restaurantFeatureOverride.upsert({
      where: {
        restaurantId_featureId: {
          restaurantId,
          featureId: feature.id,
        },
      },
      create: {
        restaurantId,
        featureId: feature.id,
        enabled: dto.enabled,
      },
      update: {
        enabled: dto.enabled,
      },
    });
  }

  async listRestaurantOwners(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const owners = await this.prisma.user.findMany({
      where: {
        restaurantId,
        role: UserRole.OWNER,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        restaurantId: true,
        createdAt: true,
      },
    });

    return {
      items: owners.map((owner) => ({
        id: owner.id,
        email: owner.email,
        role: owner.role,
        restaurantId: owner.restaurantId,
        createdAt: owner.createdAt.toISOString(),
      })),
    };
  }

  async getResolvedFeatures(user: AuthUser) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant scope not found');
    }

    const features = await this.prisma.feature.findMany({
      orderBy: { key: 'asc' },
      select: { key: true },
    });

    const resolved = await Promise.all(
      features.map(async (feature) => ({
        key: feature.key,
        enabled: await this.featureFlagService.isFeatureEnabled(user.restaurantId!, feature.key),
      })),
    );

    return { items: resolved };
  }

  async resetOwnerPassword(ownerId: string, dto: ResetOwnerPasswordDto) {
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (owner.role !== UserRole.OWNER) {
      throw new BadRequestException('User is not OWNER');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    const updatedOwner = await this.prisma.user.update({
      where: { id: ownerId },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
        role: true,
        restaurantId: true,
      },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: ownerId } });

    return {
      owner: updatedOwner,
      message: 'Owner password reset successfully',
    };
  }
}
