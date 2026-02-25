import { useT } from '../../../i18n/useT';
import type { TranslationKey } from '../../../i18n/i18n';
import { ApiErrorAlert } from '../../../shared/components/ApiErrorAlert';
import { Button } from '../../../shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../shared/ui/sheet';
import { useAdminOrderDetails } from '../useAdminOrderDetails';
import type { OrderListItem, OrderStatus } from '../orders.types';

type OrderDrawerProps = {
  open: boolean;
  orderId?: string;
  fallbackOrder?: OrderListItem;
  isUpdating: boolean;
  updateError?: unknown;
  onOpenChange: (open: boolean) => void;
  onStatusAction: (id: string, status: OrderStatus) => Promise<void>;
};

function formatDate(dateIso?: string): string {
  if (!dateIso) {
    return '-';
  }

  return new Date(dateIso).toLocaleString();
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function resolveActionLabel(status: OrderStatus): TranslationKey | null {
  if (status === 'NEW') {
    return 'admin.orders.actions.accept';
  }

  if (status === 'IN_PROGRESS') {
    return 'admin.orders.actions.ready';
  }

  if (status === 'READY') {
    return 'admin.orders.actions.complete';
  }

  return null;
}

function resolveNextStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'NEW') {
    return 'IN_PROGRESS';
  }

  if (status === 'IN_PROGRESS') {
    return 'READY';
  }

  if (status === 'READY') {
    return 'COMPLETED';
  }

  return null;
}

export function OrderDrawer({
  open,
  orderId,
  fallbackOrder,
  isUpdating,
  updateError,
  onOpenChange,
  onStatusAction,
}: OrderDrawerProps) {
  const { t } = useT();
  const detailsQuery = useAdminOrderDetails(orderId, open);

  const details = detailsQuery.data;
  const orderStatus = details?.status ?? fallbackOrder?.status;
  const actionLabelKey = orderStatus ? resolveActionLabel(orderStatus) : null;
  const nextStatus = orderStatus ? resolveNextStatus(orderStatus) : null;

  const tableCode = details?.table?.code ?? fallbackOrder?.table?.code;
  const createdAt = details?.createdAt ?? fallbackOrder?.createdAt;
  const orderType = details?.type ?? fallbackOrder?.type;
  const deliveryAddress = details?.deliveryAddress ?? fallbackOrder?.deliveryAddress;
  const phone = details?.phone ?? fallbackOrder?.phone;
  const customerName = details?.customerName ?? fallbackOrder?.customerName;
  const note = details?.note ?? fallbackOrder?.note;
  const totals = details?.totals ?? fallbackOrder?.totals;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="left-auto right-0 w-[min(100vw,44rem)] border-l border-r-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t('admin.orders.drawer.title')} {orderId ? `#${orderId.slice(-6)}` : ''}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <ApiErrorAlert error={detailsQuery.error ?? updateError} />

          {detailsQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('admin.orders.common.loading')}</p> : null}

          {!detailsQuery.isLoading ? (
            <>
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="font-medium">{t('admin.orders.fields.type')}: </span>
                  {orderType ?? '-'}
                </p>

                {orderType === 'TABLE' ? (
                  <p>
                    <span className="font-medium">{t('admin.orders.fields.table')}: </span>
                    {tableCode ?? '-'}
                  </p>
                ) : null}

                {orderType === 'DELIVERY' ? (
                  <p>
                    <span className="font-medium">{t('admin.orders.fields.address')}: </span>
                    {deliveryAddress ?? '-'}
                  </p>
                ) : null}

                <p>
                  <span className="font-medium">{t('admin.orders.fields.phone')}: </span>
                  {phone ?? '-'}
                </p>
                <p>
                  <span className="font-medium">{t('admin.orders.fields.customer')}: </span>
                  {customerName ?? '-'}
                </p>
                <p>
                  <span className="font-medium">{t('admin.orders.fields.note')}: </span>
                  {note ?? '-'}
                </p>
              </div>

              <div className="space-y-2">
                {(details?.orderItems ?? []).map((item) => {
                  const lineEurCents = item.unitPrice.EUR.cents * item.qty;
                  const lineBgnCents = item.unitPrice.BGN ? item.unitPrice.BGN.cents * item.qty : null;

                  return (
                    <div key={item.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{item.name}</p>
                        <p>x{item.qty}</p>
                      </div>
                      {item.note ? <p className="mt-1 text-xs text-muted-foreground">{item.note}</p> : null}
                      <p className="mt-2 text-xs">
                        EUR: {formatCents(lineEurCents)}
                        {lineBgnCents !== null ? ` • BGN: ${formatCents(lineBgnCents)}` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              {totals ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{t('admin.orders.fields.total')}</p>
                  <p className="mt-1">EUR: {formatCents(totals.EUR.totalCents)}</p>
                  {totals.BGN ? <p>BGN: {formatCents(totals.BGN.totalCents)}</p> : null}
                </div>
              ) : null}

              {orderId && nextStatus && actionLabelKey ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onStatusAction(orderId, nextStatus)}
                    className="w-full"
                  >
                    {t(actionLabelKey)}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
