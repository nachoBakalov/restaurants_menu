import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeatures } from '../../billing/useFeatures';
import { useT } from '../../i18n/useT';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { updateAdminOrderStatus } from './orders.api';
import { OrderDrawer } from './components/OrderDrawer';
import { OrdersList } from './components/OrdersList';
import { OrdersTabs } from './components/OrdersTabs';
import type { OrderListItem, OrderStatus } from './orders.types';
import { useAdminOrders } from './useAdminOrders';

export function OrdersPage() {
  const { t } = useT();
  const { isEnabled, isLoading } = useFeatures();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('NEW');
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ordersQuery = useAdminOrders(selectedStatus);

  const selectedOrder = useMemo(
    () => (ordersQuery.data ?? []).find((order) => order.id === selectedOrderId),
    [ordersQuery.data, selectedOrderId],
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateAdminOrderStatus(id, status),
    onSuccess: async () => {
      setDrawerOpen(false);
      setSelectedOrderId(undefined);

      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-order'] });
    },
  });

  const orderingEnabled = isEnabled('ORDERING');
  const isLocked = !isLoading && !orderingEnabled;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.orders.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('admin.orders.common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.locked.orders.title')}</CardTitle>
          <CardDescription>{t('admin.locked.orders.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/admin/billing')}>{t('admin.locked.goToBilling')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>{t('admin.orders.title')}</CardTitle>
          <CardDescription>{t('admin.pageTitles.orders')}</CardDescription>
          <OrdersTabs selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
        </CardHeader>
      </Card>

      <ApiErrorAlert error={updateStatusMutation.error} />

      <OrdersList
        status={selectedStatus}
        orders={ordersQuery.data ?? []}
        isLoading={ordersQuery.isLoading}
        error={ordersQuery.error}
        onSelectOrder={(order: OrderListItem) => {
          setSelectedOrderId(order.id);
          setDrawerOpen(true);
        }}
      />

      <OrderDrawer
        open={drawerOpen}
        orderId={selectedOrderId}
        fallbackOrder={selectedOrder}
        isUpdating={updateStatusMutation.isPending}
        updateError={updateStatusMutation.error}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setSelectedOrderId(undefined);
          }
        }}
        onStatusAction={async (id, status) => {
          await updateStatusMutation.mutateAsync({ id, status });
        }}
      />
    </div>
  );
}
