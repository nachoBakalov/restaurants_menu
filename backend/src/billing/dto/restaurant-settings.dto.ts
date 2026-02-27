import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';

export class RestaurantSocialLinksDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2048)
  facebook?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2048)
  instagram?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2048)
  googleBusiness?: string | null;
}

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

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(50)
  phoneNumber?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  @ValidateNested()
  @Type(() => RestaurantSocialLinksDto)
  socialLinks?: RestaurantSocialLinksDto | null;
}

export class RestaurantSettingsResponseDto {
  orderingVisible!: boolean;
  orderingTimezone!: string;
  orderingSchedule!: Record<string, unknown> | null;
  phoneNumber!: string | null;
  address!: string | null;
  socialLinks!: Record<string, string> | null;
}
