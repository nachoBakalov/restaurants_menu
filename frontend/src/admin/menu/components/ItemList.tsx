import { Pencil, Trash2 } from 'lucide-react';
import type { Item } from '../menu.types';
import { useT } from '../../../i18n/useT';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';

type ItemListProps = {
  items: Item[];
  disabled?: boolean;
  loadingItemId?: string | null;
  onCreate: () => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onToggleAvailability: (item: Item) => void;
};

function formatPrice(cents?: number | null, currency?: 'EUR' | 'BGN'): string | null {
  if (typeof cents !== 'number') {
    return null;
  }

  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export function ItemList({ items, disabled = false, loadingItemId = null, onCreate, onEdit, onDelete, onToggleAvailability }: ItemListProps) {
  const { t } = useT();

  return (
    <div className="space-y-3">
      <Button onClick={onCreate} disabled={disabled}>
        {t('admin.menu.newItem')}
      </Button>

      {items.length === 0 ? <p className="text-sm text-muted-foreground">{t('admin.menu.emptyItems')}</p> : null}

      <div className="space-y-2">
        {items.map((item) => {
          const priceEur = formatPrice(item.prices?.priceEurCents, 'EUR');
          const priceBgn = formatPrice(item.prices?.priceBgnCents, 'BGN');
          const promoEur = formatPrice(item.promo?.promoPriceEurCents, 'EUR');
          const promoBgn = formatPrice(item.promo?.promoPriceBgnCents, 'BGN');
          const isBusy = loadingItemId === item.id;

          return (
            <div key={item.id} className="rounded-md border p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                      {item.isAvailable ? t('admin.features.enabled') : t('admin.features.disabled')}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {priceEur ? `${priceEur}${priceBgn ? ` • ${priceBgn}` : ''}` : '—'}
                    {promoEur || promoBgn ? ` | Promo: ${promoEur ?? '-'}${promoBgn ? ` • ${promoBgn}` : ''}` : ''}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onToggleAvailability(item)} disabled={disabled || isBusy}>
                    {t('admin.menu.fields.available')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)} disabled={disabled || isBusy}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onDelete(item)} disabled={disabled || isBusy}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
