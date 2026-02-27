export type PublicCurrency = {
  primary: 'EUR' | 'BGN';
  secondaryEnabled: boolean;
  bgnDisabledAt: string | null;
  bgnActiveNow: boolean;
};

export type PublicFeatures = {
  ORDERING: boolean;
};

export type PublicRestaurant = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    googleBusiness?: string;
  } | null;
  currency: PublicCurrency;
  features: PublicFeatures;
  ordering: {
    visible: boolean;
    availableNow: boolean;
    timezone: string;
    schedule: Record<string, unknown> | null;
    nextOpenAt: string | null;
  };
};

export type MoneyCurrentOriginal = {
  currentCents: number;
  originalCents: number | null;
};

export type ItemPricing = {
  promoApplied: boolean;
  promoEndsAt: string | null;
  prices: {
    EUR: MoneyCurrentOriginal;
    BGN?: MoneyCurrentOriginal;
  };
};

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  allergens: string | null;
  isAvailable: boolean;
  sortOrder: number;
  pricing: ItemPricing;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  items: PublicMenuItem[];
};

export type PublicMenuResponse = {
  restaurant: PublicRestaurant;
  generatedAt: string;
  categories: PublicMenuCategory[];
};

export type PublicOrderItemInput = {
  itemId: string;
  qty: number;
  note?: string;
};

export type CreatePublicOrderPayload =
  | {
      type: 'TABLE';
      tableCode: string;
      phone?: string;
      customerName?: string;
      note?: string;
      items: PublicOrderItemInput[];
    }
  | {
      type: 'DELIVERY';
      deliveryAddress: string;
      phone?: string;
      customerName?: string;
      note?: string;
      items: PublicOrderItemInput[];
    }
  | {
      type: 'TAKEAWAY';
      phone?: string;
      customerName?: string;
      note?: string;
      items: PublicOrderItemInput[];
    };

export type CreatePublicOrderResponse = {
  orderId: string;
  status: string;
  type: 'TABLE' | 'DELIVERY' | 'TAKEAWAY';
  createdAt: string;
  totals: {
    EUR: { totalCents: number };
    BGN?: { totalCents: number };
  };
};
