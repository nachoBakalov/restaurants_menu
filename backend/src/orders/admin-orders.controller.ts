import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminOrdersQueryDto, UpdateOrderStatusDto } from './dto/admin-orders.dto';
import { OrdersService } from './orders.service';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId: string | null;
  };
};

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPERADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: AdminOrdersQueryDto) {
    return this.ordersService.getAdminOrders(req.user, query);
  }

  @Get(':id')
  getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.getAdminOrderById(req.user, id);
  }

  @Patch(':id/status')
  updateStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateAdminOrderStatus(req.user, id, dto);
  }
}
