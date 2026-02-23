import { BadRequestException, INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import request = require('supertest');
import { FeatureFlagService } from '../src/features/feature-flag.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

type ValidationDetail = {
  field: string;
  message: string;
};

function flattenValidationErrors(errors: ValidationError[], parentPath = ''): ValidationDetail[] {
  const details: ValidationDetail[] = [];

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        details.push({ field: path, message });
      }
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, path));
    }
  }

  return details;
}

describe('Contract happy-path (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  let ownerEmail = '';
  let ownerPassword = 'owner123';
  let secondOwnerEmail = '';
  let secondOwnerPassword = 'owner123';
  let secondRestaurantId = '';
  let slug = '';
  let restaurantId = '';
  let accessToken = '';
  let createdOrderId = '';
  let itemId = '';
  let tableCode = '';

  beforeAll(async () => {
    process.env.BASE_URL ??= 'http://localhost:3000';
    const { AppModule } = await import('../src/app.module');

    app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) => {
          const details = flattenValidationErrors(errors);
          return new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          });
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (restaurantId) {
      await prisma.restaurant.deleteMany({ where: { id: restaurantId } });
    }

    if (ownerEmail) {
      await prisma.user.deleteMany({ where: { email: ownerEmail } });
    }

    if (secondRestaurantId) {
      await prisma.restaurant.deleteMany({ where: { id: secondRestaurantId } });
    }

    if (secondOwnerEmail) {
      await prisma.user.deleteMany({ where: { email: secondOwnerEmail } });
    }

    await prisma.$disconnect();
    await app.close();
  });

  it('covers register -> public -> create order -> admin list/details/update', async () => {
    const ts = Date.now();
    ownerEmail = `owner${ts}@local.test`;
    slug = `contract-${ts}`;
    tableCode = `T${String(ts).slice(-4)}`;

    const registerRes = await request(app.getHttpServer())
      .post(`/auth/register-owner`)
      .send({
        email: ownerEmail,
        password: ownerPassword,
        restaurantName: `Contract ${ts}`,
        slug,
      })
      .expect(201);

    restaurantId = registerRes.body.user.restaurantId;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(201);

    accessToken = loginRes.body.accessToken;

    const category = await prisma.category.create({
      data: {
        restaurantId,
        name: 'Main',
        sortOrder: 0,
      },
    });

    await prisma.table.create({
      data: {
        restaurantId,
        code: tableCode,
        name: `Masa ${tableCode}`,
      },
    });

    const item = await prisma.item.create({
      data: {
        restaurantId,
        categoryId: category.id,
        name: 'Pizza Margherita',
        isAvailable: true,
        priceEurCents: 999,
        priceBgnCents: 1953,
        promoPriceEurCents: 799,
        promoPriceBgnCents: 1563,
        promoStartsAt: new Date(Date.now() - 60 * 60 * 1000),
        promoEndsAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    itemId = item.id;

    const publicRestaurant = await request(app.getHttpServer())
      .get(`/public/restaurants/${slug}`)
      .expect(200);

    expect(publicRestaurant.body).toHaveProperty('id', restaurantId);
    expect(publicRestaurant.body).toHaveProperty('currency.bgnActiveNow');

    const menuRes = await request(app.getHttpServer())
      .get(`/public/restaurants/${slug}/menu`)
      .expect(200);

    expect(menuRes.body).toHaveProperty('generatedAt');
    expect(menuRes.body.categories[0].items[0].pricing.prices.EUR).toHaveProperty('currentCents');

    const createOrderRes = await request(app.getHttpServer())
      .post(`/public/restaurants/${slug}/orders`)
      .send({
        type: 'TABLE',
        tableCode,
        customerName: 'Ivan',
        items: [{ itemId, qty: 2 }],
      })
      .expect(201);

    createdOrderId = createOrderRes.body.orderId;
    expect(createOrderRes.body.status).toBe('NEW');

    const adminListRes = await request(app.getHttpServer())
      .get('/admin/orders?status=NEW')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(adminListRes.body.items)).toBe(true);
    expect(adminListRes.body.items.some((order: { id: string }) => order.id === createdOrderId)).toBe(true);

    const adminDetailsRes = await request(app.getHttpServer())
      .get(`/admin/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(adminDetailsRes.body.id).toBe(createdOrderId);
    expect(Array.isArray(adminDetailsRes.body.orderItems)).toBe(true);

    const statusUpdateRes = await request(app.getHttpServer())
      .patch(`/admin/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'READY' })
      .expect(200);

    expect(statusUpdateRes.body.id).toBe(createdOrderId);
    expect(statusUpdateRes.body.status).toBe('READY');
  });

  it('returns RESTAURANT_NOT_FOUND for missing public restaurant', async () => {
    const response = await request(app.getHttpServer())
      .get(`/public/restaurants/missing-${Date.now()}`)
      .expect(404);

    expect(response.body.error.code).toBe('RESTAURANT_NOT_FOUND');
  });

  it('returns VALIDATION_ERROR for invalid request payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bad-email', password: '123' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);
  });

  it('returns FEATURE_DISABLED when ordering feature is disabled', async () => {
    const featureSpy = jest
      .spyOn(FeatureFlagService.prototype, 'isFeatureEnabled')
      .mockResolvedValue(false);

    const response = await request(app.getHttpServer())
      .post(`/public/restaurants/${slug}/orders`)
      .send({
        type: 'TABLE',
        tableCode,
        customerName: 'Feature Off',
        items: [{ itemId, qty: 1 }],
      })
      .expect(403);

    expect(response.body.error.code).toBe('FEATURE_DISABLED');
    expect(response.body.error.details.feature).toBe('ORDERING');

    featureSpy.mockRestore();
  });

  it('returns UNAUTHORIZED when admin endpoint is called without token', async () => {
    const response = await request(app.getHttpServer()).get('/admin/orders').expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns VALIDATION_ERROR for SUPERADMIN list orders without restaurantId', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@local.test', password: 'admin123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns SVG QR payload for owner menu QR endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/qr/menu')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const svgPayload =
      typeof response.text === 'string'
        ? response.text
        : Buffer.isBuffer(response.body)
          ? response.body.toString('utf8')
          : '';

    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(svgPayload).toContain('<svg');
    expect(svgPayload).toContain('</svg>');
  });

  it('returns UNAUTHORIZED for QR menu endpoint without token', async () => {
    const response = await request(app.getHttpServer()).get('/admin/qr/menu').expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns SVG QR payload for SUPERADMIN when restaurantId is provided', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@local.test', password: 'admin123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/admin/qr/menu?restaurantId=${restaurantId}`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200);

    const svgPayload =
      typeof response.text === 'string'
        ? response.text
        : Buffer.isBuffer(response.body)
          ? response.body.toString('utf8')
          : '';

    expect(response.headers['content-type']).toContain('image/svg+xml');
    expect(svgPayload).toContain('<svg');
  });

  it('admin menu CRUD happy-path works for OWNER scope', async () => {
    const createCategoryRes = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Burgers',
        sortOrder: 5,
      })
      .expect(201);

    const categoryId = createCategoryRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Signature Burgers',
        sortOrder: 1,
      })
      .expect(200);

    const listCategoriesRes = await request(app.getHttpServer())
      .get('/admin/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listCategoriesRes.body.some((category: { id: string; name: string }) => category.id === categoryId && category.name === 'Signature Burgers')).toBe(true);

    const createItemRes = await request(app.getHttpServer())
      .post('/admin/items')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        name: 'Classic Burger',
        description: 'Beef and cheddar',
        isAvailable: true,
        prices: {
          priceEurCents: 1099,
          priceBgnCents: 2149,
        },
        sortOrder: 2,
      })
      .expect(201);

    const createdItemId = createItemRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/admin/items/${createdItemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isAvailable: false,
        sortOrder: 3,
      })
      .expect(200);

    const listItemsRes = await request(app.getHttpServer())
      .get(`/admin/items?categoryId=${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listItemsRes.body.some((itemRow: { id: string; isAvailable: boolean }) => itemRow.id === createdItemId && itemRow.isAvailable === false)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/admin/items/${createdItemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const deleteCategoryRes = await request(app.getHttpServer())
      .delete(`/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(deleteCategoryRes.body.success).toBe(true);
  });

  it('admin menu ownership negative returns FORBIDDEN for other restaurant owner', async () => {
    const ts = Date.now();
    secondOwnerEmail = `owner-other-${ts}@local.test`;
    const secondSlug = `other-${ts}`;

    const registerSecondOwner = await request(app.getHttpServer())
      .post('/auth/register-owner')
      .send({
        email: secondOwnerEmail,
        password: secondOwnerPassword,
        restaurantName: `Other ${ts}`,
        slug: secondSlug,
      })
      .expect(201);

    secondRestaurantId = registerSecondOwner.body.user.restaurantId;

    const secondLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: secondOwnerEmail, password: secondOwnerPassword })
      .expect(201);

    const protectedCategory = await prisma.category.create({
      data: {
        restaurantId,
        name: 'Protected Category',
        sortOrder: 99,
      },
    });

    const forbiddenRes = await request(app.getHttpServer())
      .patch(`/admin/categories/${protectedCategory.id}`)
      .set('Authorization', `Bearer ${secondLogin.body.accessToken}`)
      .send({ name: 'Should Not Update' })
      .expect(403);

    expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');
  });
});
