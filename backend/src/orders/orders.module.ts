import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { RestaurantResolverService } from '../restaurants/restaurant-resolver.service';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BillingModule],
  controllers: [AdminOrdersController],
  providers: [OrdersService, RestaurantResolverService],
  exports: [OrdersService],
})
export class OrdersModule {}
