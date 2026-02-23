import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const featureKeys = ['THEMES', 'MULTI_LANGUAGE', 'PROMOS', 'ORDERING', 'ANALYTICS'] as const;

  for (const key of featureKeys) {
    await prisma.feature.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  await prisma.plan.upsert({
    where: { key: 'BASIC' },
    update: { name: 'Basic' },
    create: { key: 'BASIC', name: 'Basic' },
  });

  await prisma.plan.upsert({
    where: { key: 'PRO' },
    update: { name: 'Pro' },
    create: { key: 'PRO', name: 'Pro' },
  });

  const basicPlan = await prisma.plan.findUniqueOrThrow({ where: { key: 'BASIC' } });
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { key: 'PRO' } });

  const promosFeature = await prisma.feature.findUniqueOrThrow({ where: { key: 'PROMOS' } });
  const orderingFeature = await prisma.feature.findUniqueOrThrow({ where: { key: 'ORDERING' } });

  const proFeatureKeys = ['PROMOS', 'THEMES', 'MULTI_LANGUAGE', 'ANALYTICS', 'ORDERING'] as const;
  const proFeatures = await prisma.feature.findMany({
    where: { key: { in: [...proFeatureKeys] } },
  });

  await prisma.planFeature.upsert({
    where: {
      planId_featureId: {
        planId: basicPlan.id,
        featureId: promosFeature.id,
      },
    },
    update: {},
    create: {
      planId: basicPlan.id,
      featureId: promosFeature.id,
    },
  });

  await prisma.planFeature.upsert({
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

  for (const feature of proFeatures) {
    await prisma.planFeature.upsert({
      where: {
        planId_featureId: {
          planId: proPlan.id,
          featureId: feature.id,
        },
      },
      update: {},
      create: {
        planId: proPlan.id,
        featureId: feature.id,
      },
    });
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {
      passwordHash,
      role: UserRole.SUPERADMIN,
      restaurantId: null,
    },
    create: {
      email: 'admin@local.test',
      passwordHash,
      role: UserRole.SUPERADMIN,
      restaurantId: null,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
