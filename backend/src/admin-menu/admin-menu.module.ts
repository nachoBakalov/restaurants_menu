import { Module } from '@nestjs/common';
import { AdminMenuController } from './admin-menu.controller';
import { AdminMenuService } from './admin-menu.service';

@Module({
  controllers: [AdminMenuController],
  providers: [AdminMenuService],
})
export class AdminMenuModule {}
