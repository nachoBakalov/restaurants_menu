export type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sortOrder: number;
};

export type Item = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  allergens?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  prices?: {
    priceEurCents: number;
    priceBgnCents?: number | null;
  };
  promo?: {
    promoPriceEurCents?: number | null;
    promoPriceBgnCents?: number | null;
    promoStartsAt?: string | null;
    promoEndsAt?: string | null;
  };
};

export type CreateCategoryDto = {
  name: string;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type UpdateCategoryDto = {
  name?: string;
  imageUrl?: string | null;
  sortOrder?: number;
};

export type CreateItemDto = {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  allergens?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
  prices: {
    priceEurCents: number;
    priceBgnCents?: number;
  };
  promo?: {
    promoPriceEurCents?: number;
    promoPriceBgnCents?: number;
    promoStartsAt?: string | null;
    promoEndsAt?: string | null;
  };
};

export type UpdateItemDto = {
  categoryId?: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  allergens?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
  prices?: {
    priceEurCents?: number;
    priceBgnCents?: number | null;
  };
  promo?: {
    promoPriceEurCents?: number | null;
    promoPriceBgnCents?: number | null;
    promoStartsAt?: string | null;
    promoEndsAt?: string | null;
  };
};
