import type { OrderStatus } from '../orders.types';
import { useT } from '../../../i18n/useT';
import { Button } from '../../../shared/ui/button';

type OrdersTabsProps = {
  selectedStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
};

const STATUSES: OrderStatus[] = ['NEW', 'IN_PROGRESS', 'READY', 'COMPLETED'];

export function OrdersTabs({ selectedStatus, onStatusChange }: OrdersTabsProps) {
  const { t } = useT();

  const getStatusLabel = (status: OrderStatus) => {
    if (status === 'NEW') {
      return t('admin.orders.tabs.new');
    }

    if (status === 'IN_PROGRESS') {
      return t('admin.orders.tabs.inProgress');
    }

    if (status === 'READY') {
      return t('admin.orders.tabs.ready');
    }

    return t('admin.orders.tabs.completed');
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => (
        <Button
          key={status}
          variant={selectedStatus === status ? 'default' : 'outline'}
          onClick={() => onStatusChange(status)}
          type="button"
        >
          {getStatusLabel(status)}
        </Button>
      ))}
    </div>
  );
}
