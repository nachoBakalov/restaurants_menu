import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrders } from './orders.api';
import type { OrderStatus } from './orders.types';

export function useAdminOrders(status: OrderStatus, restaurantId?: string) {
  return useQuery({
    queryKey: ['admin-orders', status, restaurantId ?? null],
    queryFn: () => fetchAdminOrders({ status, restaurantId }),
    refetchInterval: status === 'NEW' ? 5_000 : false,
  });
}
