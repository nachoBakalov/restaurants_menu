import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { OrdersModule } from '../orders/orders.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { RestaurantResolverService } from '../restaurants/restaurant-resolver.service';

@Module({
  imports: [OrdersModule, BillingModule],
  controllers: [PublicController],
  providers: [PublicService, RestaurantResolverService],
})
export class PublicModule {}
