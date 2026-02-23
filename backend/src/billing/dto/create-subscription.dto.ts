import { SubscriptionStatus } from '@prisma/client';
import { IsEnum, IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planKey!: string;

  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;
}
