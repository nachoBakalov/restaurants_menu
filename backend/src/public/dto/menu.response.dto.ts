import { RestaurantPublicResponseDto } from './restaurant-public.response.dto';

export class MoneyCurrentOriginalDto {
  currentCents!: number;
  originalCents!: number | null;
}

export class ItemPricingDto {
  promoApplied!: boolean;
  promoEndsAt!: string | null;
  prices!: {
    EUR: MoneyCurrentOriginalDto;
    BGN?: MoneyCurrentOriginalDto;
  };
}

export class PublicMenuItemResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  imageUrl!: string | null;
  allergens!: string | null;
  isAvailable!: boolean;
  sortOrder!: number;
  pricing!: ItemPricingDto;
}

export class PublicMenuCategoryResponseDto {
  id!: string;
  name!: string;
  sortOrder!: number;
  items!: PublicMenuItemResponseDto[];
}

export class PublicMenuResponseDto {
  restaurant!: RestaurantPublicResponseDto;
  generatedAt!: string;
  categories!: PublicMenuCategoryResponseDto[];
}
