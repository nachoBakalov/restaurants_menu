import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { FeatureFlagService } from './feature-flag.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, FeatureFlagService],
  exports: [FeatureFlagService],
})
export class BillingModule {}
