export class RestaurantCurrencyDto {
  primary!: 'EUR' | 'BGN';
  secondaryEnabled!: boolean;
  bgnDisabledAt!: string | null;
  bgnActiveNow!: boolean;
}

export class RestaurantPublicResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  logoUrl!: string | null;
  coverImageUrl!: string | null;
  currency!: RestaurantCurrencyDto;
}
