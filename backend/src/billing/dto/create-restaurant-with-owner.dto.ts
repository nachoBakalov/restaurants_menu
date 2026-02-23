import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateRestaurantWithOwnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  restaurantName!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MinLength(3)
  @MaxLength(80)
  slug!: string;
}
