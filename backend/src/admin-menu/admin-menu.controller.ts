import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthUser } from '../common/auth/auth-user.type';
import { AdminMenuService } from './admin-menu.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { CreateItemDto, UpdateItemDto } from './dto/items.dto';

type AuthenticatedRequest = Request & { user: AuthUser };

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPERADMIN)
export class AdminMenuController {
  constructor(private readonly adminMenuService: AdminMenuService) {}

  @Get('qr/menu')
  @Roles(UserRole.OWNER, UserRole.SUPERADMIN)
  @Header('Content-Type', 'image/svg+xml')
  getMenuQr(@Req() req: AuthenticatedRequest, @Query('restaurantId') restaurantId?: string) {
    return this.adminMenuService.getMenuQrSvg(req.user, restaurantId);
  }

  @Get('categories')
  getCategories(@Req() req: AuthenticatedRequest, @Query('restaurantId') restaurantId?: string) {
    return this.adminMenuService.getCategories(req.user, restaurantId);
  }

  @Post('categories')
  createCategory(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto, @Query('restaurantId') restaurantId?: string) {
    return this.adminMenuService.createCategory(req.user, dto, restaurantId);
  }

  @Patch('categories/:id')
  updateCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminMenuService.updateCategory(req.user, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminMenuService.deleteCategory(req.user, id);
  }

  @Get('items')
  getItems(
    @Req() req: AuthenticatedRequest,
    @Query('categoryId') categoryId?: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.adminMenuService.getItems(req.user, categoryId, restaurantId);
  }

  @Post('items')
  createItem(@Req() req: AuthenticatedRequest, @Body() dto: CreateItemDto, @Query('restaurantId') restaurantId?: string) {
    return this.adminMenuService.createItem(req.user, dto, restaurantId);
  }

  @Patch('items/:id')
  updateItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.adminMenuService.updateItem(req.user, id, dto);
  }

  @Delete('items/:id')
  deleteItem(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminMenuService.deleteItem(req.user, id);
  }
}
