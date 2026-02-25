import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../common/auth/auth-user.type';
import { BillingService } from './billing.service';
import { CreateRestaurantWithOwnerDto } from './dto/create-restaurant-with-owner.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';
import { SetFeatureOverrideDto } from './dto/set-feature-override.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

type AuthenticatedRequest = Request & { user: AuthUser };

@Controller('admin')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('restaurants/create-with-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  createRestaurantWithOwner(@Body() dto: CreateRestaurantWithOwnerDto) {
    return this.billingService.createRestaurantWithOwner(dto);
  }

  @Get('restaurants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  listRestaurants() {
    return this.billingService.listRestaurants();
  }

  @Patch('restaurants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  updateRestaurant(@Param('id') restaurantId: string, @Body() dto: UpdateRestaurantDto) {
    return this.billingService.updateRestaurant(restaurantId, dto);
  }

  @Get('restaurants/:id/owners')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  listRestaurantOwners(@Param('id') restaurantId: string) {
    return this.billingService.listRestaurantOwners(restaurantId);
  }

  @Post('owners/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  resetOwnerPassword(@Param('id') ownerId: string, @Body() dto: ResetOwnerPasswordDto) {
    return this.billingService.resetOwnerPassword(ownerId, dto);
  }

  @Post('restaurants/:id/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  createSubscription(@Param('id') restaurantId: string, @Body() dto: CreateSubscriptionDto) {
    return this.billingService.createRestaurantSubscription(restaurantId, dto);
  }

  @Post('restaurants/:id/features/:featureKey/override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  setFeatureOverride(
    @Param('id') restaurantId: string,
    @Param('featureKey') featureKey: string,
    @Body() dto: SetFeatureOverrideDto,
  ) {
    return this.billingService.setFeatureOverride(restaurantId, featureKey, dto);
  }

  @Get('billing/features')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPERADMIN)
  getResolvedFeatures(@Req() req: AuthenticatedRequest, @Query('restaurantId') restaurantId?: string) {
    return this.billingService.getResolvedFeatures(req.user, restaurantId);
  }
}
