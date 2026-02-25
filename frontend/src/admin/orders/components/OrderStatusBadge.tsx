import { Badge } from '../../../shared/ui/badge';
import { useT } from '../../../i18n/useT';
import type { OrderStatus } from '../orders.types';

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useT();

  if (status === 'NEW') {
    return <Badge>{t('admin.orders.tabs.new')}</Badge>;
  }

  if (status === 'IN_PROGRESS') {
    return <Badge variant="secondary">{t('admin.orders.tabs.inProgress')}</Badge>;
  }

  if (status === 'READY') {
    return <Badge variant="outline">{t('admin.orders.tabs.ready')}</Badge>;
  }

  return <Badge variant="secondary">{t('admin.orders.tabs.completed')}</Badge>;
}
