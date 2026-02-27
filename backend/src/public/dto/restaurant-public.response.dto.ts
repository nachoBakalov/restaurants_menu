export class RestaurantCurrencyDto {
  primary!: 'EUR' | 'BGN';
  secondaryEnabled!: boolean;
  bgnDisabledAt!: string | null;
  bgnActiveNow!: boolean;
}

export class RestaurantPublicFeaturesDto {
  ORDERING!: boolean;
}

export class RestaurantPublicOrderingDto {
  visible!: boolean;
  availableNow!: boolean;
  timezone!: string;
  schedule!: Record<string, unknown> | null;
  nextOpenAt!: string | null;
}

export class RestaurantPublicResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  logoUrl!: string | null;
  coverImageUrl!: string | null;
  phoneNumber!: string | null;
  address!: string | null;
  socialLinks!: Record<string, string> | null;
  currency!: RestaurantCurrencyDto;
  features!: RestaurantPublicFeaturesDto;
  ordering!: RestaurantPublicOrderingDto;
}
