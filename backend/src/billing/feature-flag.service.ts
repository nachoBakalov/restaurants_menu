import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async isFeatureEnabled(restaurantId: string, featureKey: string): Promise<boolean> {
    const feature = await this.prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) {
      return false;
    }

    const override = await this.prisma.restaurantFeatureOverride.findUnique({
      where: {
        restaurantId_featureId: {
          restaurantId,
          featureId: feature.id,
        },
      },
    });

    if (override) {
      return override.enabled;
    }

    const now = new Date();

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: [{ startsAt: 'desc' }],
      select: { planId: true },
    });

    if (!activeSubscription) {
      return false;
    }

    const planFeature = await this.prisma.planFeature.findUnique({
      where: {
        planId_featureId: {
          planId: activeSubscription.planId,
          featureId: feature.id,
        },
      },
      select: { planId: true },
    });

    return Boolean(planFeature);
  }
}
