export class PublicRestaurantDto {
  id!: string;
  name!: string;
  slug!: string;
  logoUrl!: string | null;
  coverImageUrl!: string | null;
  currencyPrimary!: 'EUR' | 'BGN';
  currencySecondaryEnabled!: boolean;
  bgnDisabledAt!: string | null;
  fxRateBgnToEur!: string | null;
}
