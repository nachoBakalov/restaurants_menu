import { useT } from '../../../i18n/useT';
import type { TranslationKey } from '../../../i18n/i18n';
import { ApiErrorAlert } from '../../../shared/components/ApiErrorAlert';
import { Card, CardContent } from '../../../shared/ui/card';
import type { OrderListItem, OrderStatus } from '../orders.types';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrdersListProps = {
  status: OrderStatus;
  orders: OrderListItem[];
  isLoading: boolean;
  error: unknown;
  onSelectOrder: (order: OrderListItem) => void;
};

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleString();
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function getEmptyStateKey(status: OrderStatus): TranslationKey {
  if (status === 'NEW') {
    return 'admin.orders.empty.new';
  }

  if (status === 'IN_PROGRESS') {
    return 'admin.orders.empty.inProgress';
  }

  if (status === 'READY') {
    return 'admin.orders.empty.ready';
  }

  return 'admin.orders.empty.completed';
}

export function OrdersList({ status, orders, isLoading, error, onSelectOrder }: OrdersListProps) {
  const { t } = useT();

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <ApiErrorAlert error={error} />

        {isLoading ? <p className="text-sm text-muted-foreground">{t('admin.orders.common.loading')}</p> : null}

        {!isLoading && !error && orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(getEmptyStateKey(status))}</p>
        ) : null}

        {!isLoading && !error && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                className="w-full rounded-md border p-3 text-left hover:bg-muted/40"
                onClick={() => onSelectOrder(order)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">#{order.id.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span>{order.type}</span>
                  <span>
                    EUR: <strong>{formatCents(order.totals.EUR.totalCents)}</strong>
                  </span>
                  {order.totals.BGN ? (
                    <span>
                      BGN: <strong>{formatCents(order.totals.BGN.totalCents)}</strong>
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
