import { apiClient } from '../../api/apiClient';
import type { AdminOrdersListResponse, OrderDetails, OrderListItem, OrderStatus } from './orders.types';

export async function fetchAdminOrders(params: {
  status: OrderStatus;
  restaurantId?: string;
}): Promise<OrderListItem[]> {
  const response = await apiClient.get<AdminOrdersListResponse>('/admin/orders', {
    params: {
      status: params.status,
      ...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
    },
  });

  return response.data.items;
}

export async function fetchAdminOrderDetails(id: string): Promise<OrderDetails> {
  const response = await apiClient.get<OrderDetails>(`/admin/orders/${id}`);
  return response.data;
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await apiClient.patch(`/admin/orders/${id}/status`, { status });
}
