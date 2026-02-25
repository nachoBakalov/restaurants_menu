import { IsBoolean, IsObject, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateRestaurantSettingsDto {
  @IsOptional()
  @IsBoolean()
  orderingVisible?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  orderingTimezone?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsObject()
  orderingSchedule?: Record<string, unknown> | null;
}

export class RestaurantSettingsResponseDto {
  orderingVisible!: boolean;
  orderingTimezone!: string;
  orderingSchedule!: Record<string, unknown> | null;
}
