export type Category = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Item = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
  prices?: {
    priceEurCents: number;
    priceBgnCents?: number | null;
  };
  promo?: {
    promoPriceEurCents?: number | null;
    promoPriceBgnCents?: number | null;
  };
};

export type CreateCategoryDto = {
  name: string;
  sortOrder?: number;
};

export type UpdateCategoryDto = {
  name?: string;
  sortOrder?: number;
};

export type CreateItemDto = {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
  prices: {
    priceEurCents: number;
    priceBgnCents?: number;
  };
  promo?: {
    promoPriceEurCents?: number;
    promoPriceBgnCents?: number;
  };
};

export type UpdateItemDto = {
  categoryId?: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
  prices?: {
    priceEurCents?: number;
    priceBgnCents?: number | null;
  };
  promo?: {
    promoPriceEurCents?: number | null;
    promoPriceBgnCents?: number | null;
  };
};
