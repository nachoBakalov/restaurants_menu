import { Category, Item, Order, OrderItem, Restaurant, Table } from '@prisma/client';
import { PublicMenuResponseDto } from '../../public/dto/menu.response.dto';
import { RestaurantPublicResponseDto } from '../../public/dto/restaurant-public.response.dto';

type RestaurantCurrencyContext = {
  bgnActiveNow: boolean;
};

type CategoryWithItems = Category & { items: Item[] };

export function mapRestaurantPublic(
  restaurant: Restaurant,
  now: Date,
  features: { ORDERING: boolean } = { ORDERING: false },
): RestaurantPublicResponseDto {
  const bgnActiveNow =
    restaurant.currencySecondaryEnabled &&
    (restaurant.bgnDisabledAt === null || now.getTime() < restaurant.bgnDisabledAt.getTime());

  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    logoUrl: restaurant.logoUrl,
    coverImageUrl: restaurant.coverImageUrl,
    currency: {
      primary: restaurant.currencyPrimary,
      secondaryEnabled: restaurant.currencySecondaryEnabled,
      bgnDisabledAt: restaurant.bgnDisabledAt ? restaurant.bgnDisabledAt.toISOString() : null,
      bgnActiveNow,
    },
    features,
  };
}

export function mapItemPricing(item: Item, restaurantCurrency: RestaurantCurrencyContext, now: Date) {
  const inPromoWindow =
    (item.promoStartsAt === null || now.getTime() >= item.promoStartsAt.getTime()) &&
    (item.promoEndsAt === null || now.getTime() < item.promoEndsAt.getTime());

  const promoApplied = item.promoPriceEurCents !== null && inPromoWindow;

  const eurPrice = {
    currentCents: promoApplied ? item.promoPriceEurCents! : item.priceEurCents,
    originalCents: promoApplied ? item.priceEurCents : null,
  };

  const pricing: {
    promoApplied: boolean;
    promoEndsAt: string | null;
    prices: {
      EUR: { currentCents: number; originalCents: number | null };
      BGN?: { currentCents: number; originalCents: number | null };
    };
  } = {
    promoApplied,
    promoEndsAt: item.promoEndsAt ? item.promoEndsAt.toISOString() : null,
    prices: {
      EUR: eurPrice,
    },
  };

  if (restaurantCurrency.bgnActiveNow && item.priceBgnCents !== null) {
    const bgnPromoApplied = item.promoPriceBgnCents !== null && inPromoWindow;

    pricing.prices.BGN = {
      currentCents: bgnPromoApplied ? item.promoPriceBgnCents! : item.priceBgnCents,
      originalCents: bgnPromoApplied ? item.priceBgnCents : null,
    };
  }

  return pricing;
}

export function mapMenuResponse(
  restaurant: Restaurant,
  categories: CategoryWithItems[],
  now: Date,
  features: { ORDERING: boolean } = { ORDERING: false },
): PublicMenuResponseDto {
  const restaurantPublic = mapRestaurantPublic(restaurant, now, features);

  return {
    restaurant: restaurantPublic,
    generatedAt: now.toISOString(),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      items: category.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        allergens: item.allergens,
        isAvailable: item.isAvailable,
        sortOrder: item.sortOrder,
        pricing: mapItemPricing(item, restaurantPublic.currency, now),
      })),
    })),
  };
}

export function mapOrderSummary(order: Order, table?: Pick<Table, 'code' | 'name'> | null) {
  const totals: {
    EUR: { totalCents: number };
    BGN?: { totalCents: number };
  } = {
    EUR: { totalCents: order.totalEurCents },
  };

  if (order.totalBgnCents !== null) {
    totals.BGN = { totalCents: order.totalBgnCents };
  }

  return {
    id: order.id,
    type: order.type,
    status: order.status,
    table: table ? { code: table.code, name: table.name } : null,
    deliveryAddress: order.deliveryAddress,
    phone: order.phone,
    customerName: order.customerName,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    totals,
  };
}

export function mapOrderDetails(
  order: Order,
  orderItems: OrderItem[],
  table?: Pick<Table, 'code' | 'name'> | null,
) {
  const summary = mapOrderSummary(order, table);

  return {
    id: summary.id,
    type: summary.type,
    status: summary.status,
    deliveryAddress: summary.deliveryAddress,
    phone: summary.phone,
    customerName: summary.customerName,
    note: summary.note,
    createdAt: summary.createdAt,
    updatedAt: order.updatedAt.toISOString(),
    totals: summary.totals,
    orderItems: orderItems.map((orderItem) => ({
      id: orderItem.id,
      itemId: orderItem.itemId,
      name: orderItem.nameSnapshot,
      qty: orderItem.qty,
      unitPrice: {
        EUR: { cents: orderItem.unitPriceEurCents },
        ...(orderItem.unitPriceBgnCents !== null
          ? { BGN: { cents: orderItem.unitPriceBgnCents } }
          : {}),
      },
      note: orderItem.note,
    })),
  };
}
