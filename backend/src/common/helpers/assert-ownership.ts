import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/auth-user.type';

export function assertOwnership(entityRestaurantId: string, user: AuthUser): void {
  if (user.role === UserRole.SUPERADMIN) {
    return;
  }

  if (!user.restaurantId || user.restaurantId !== entityRestaurantId) {
    throw new ForbiddenException({
      code: 'FORBIDDEN',
      message: 'Forbidden',
    });
  }
}
