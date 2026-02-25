export class ItemActivePriceDto {
  priceEurCents!: number;
  priceBgnCents?: number;
  promoApplied!: boolean;
}

export class PublicMenuItemDto {
  id!: string;
  name!: string;
  description!: string | null;
  imageUrl!: string | null;
  allergens!: string | null;
  isAvailable!: boolean;
  sortOrder!: number;
  activePrice!: ItemActivePriceDto;
}

export class PublicMenuCategoryDto {
  id!: string;
  name!: string;
  imageUrl!: string | null;
  sortOrder!: number;
  items!: PublicMenuItemDto[];
}

export class PublicMenuResponseDto {
  restaurant!: {
    id: string;
    name: string;
    slug: string;
    currencyPrimary: 'EUR' | 'BGN';
    currencySecondaryEnabled: boolean;
    bgnDisabledAt: string | null;
  };
  categories!: PublicMenuCategoryDto[];
}
