import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CreatePublicOrderDto } from '../orders/dto/create-public-order.dto';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('restaurants/:slug')
  @Header('Cache-Control', 'public, max-age=60')
  getRestaurant(@Param('slug') slug: string) {
    return this.publicService.getRestaurantPublicInfo(slug);
  }

  @Get('restaurants/:slug/menu')
  @Header('Cache-Control', 'public, max-age=60')
  getRestaurantMenu(@Param('slug') slug: string) {
    return this.publicService.getRestaurantMenu(slug);
  }

  @Post('restaurants/:slug/orders')
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Param('slug') slug: string, @Body() dto: CreatePublicOrderDto) {
    return this.publicService.createOrder(slug, dto);
  }
}
