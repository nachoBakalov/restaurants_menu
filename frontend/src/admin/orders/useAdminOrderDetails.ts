import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrderDetails } from './orders.api';

export function useAdminOrderDetails(orderId?: string, open?: boolean) {
  return useQuery({
    queryKey: ['admin-order', orderId ?? null],
    queryFn: () => fetchAdminOrderDetails(orderId as string),
    enabled: Boolean(open && orderId),
  });
}
