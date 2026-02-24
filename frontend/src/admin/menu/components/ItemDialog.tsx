import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CreateItemDto, Item, UpdateItemDto } from '../menu.types';
import { useT } from '../../../i18n/useT';
import { ApiErrorAlert } from '../../../shared/components/ApiErrorAlert';
import { Button } from '../../../shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';

type ItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  categoryId: string;
  item?: Item;
  isSubmitting: boolean;
  error?: unknown;
  onCreate: (dto: CreateItemDto) => Promise<void>;
  onUpdate: (id: string, dto: UpdateItemDto) => Promise<void>;
};

type ItemFormValues = {
  name: string;
  description: string;
  sortOrder: number;
  isAvailable: boolean;
  priceEur: string;
  priceBgn: string;
  promoEur: string;
  promoBgn: string;
};

function centsToDecimal(cents?: number | null): string {
  if (typeof cents !== 'number') {
    return '';
  }
  return (cents / 100).toFixed(2);
}

function toCents(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(',', '.');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(numeric * 100);
}

function sameOrEmpty(left?: string, right?: string): boolean {
  return (left ?? '').trim() === (right ?? '').trim();
}

export function ItemDialog({
  open,
  onOpenChange,
  mode,
  categoryId,
  item,
  isSubmitting,
  error,
  onCreate,
  onUpdate,
}: ItemDialogProps) {
  const { t } = useT();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('auth.validation.required')),
        description: z.string(),
        sortOrder: z.number().min(0, t('auth.validation.required')),
        isAvailable: z.boolean(),
        priceEur: z
          .string()
          .trim()
          .min(1, t('auth.validation.required'))
          .refine((value) => {
            const cents = toCents(value);
            return cents !== null && cents > 0;
          }, t('auth.validation.required')),
        priceBgn: z
          .string()
          .refine((value) => {
            if (!value || !value.trim()) {
              return true;
            }
            const cents = toCents(value);
            return cents !== null && cents > 0;
          }, t('auth.validation.required')),
        promoEur: z
          .string()
          .refine((value) => {
            if (!value || !value.trim()) {
              return true;
            }
            const cents = toCents(value);
            return cents !== null && cents > 0;
          }, t('auth.validation.required')),
        promoBgn: z
          .string()
          .refine((value) => {
            if (!value || !value.trim()) {
              return true;
            }
            const cents = toCents(value);
            return cents !== null && cents > 0;
          }, t('auth.validation.required')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
      priceEur: centsToDecimal(item?.prices?.priceEurCents),
      priceBgn: centsToDecimal(item?.prices?.priceBgnCents),
      promoEur: centsToDecimal(item?.promo?.promoPriceEurCents),
      promoBgn: centsToDecimal(item?.promo?.promoPriceBgnCents),
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: item?.name ?? '',
      description: item?.description ?? '',
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
      priceEur: centsToDecimal(item?.prices?.priceEurCents),
      priceBgn: centsToDecimal(item?.prices?.priceBgnCents),
      promoEur: centsToDecimal(item?.promo?.promoPriceEurCents),
      promoBgn: centsToDecimal(item?.promo?.promoPriceBgnCents),
    });
  }, [item, open, reset]);

  const submit = handleSubmit(async (values) => {
    const priceEurCents = toCents(values.priceEur);
    const priceBgnCents = toCents(values.priceBgn);
    const promoPriceEurCents = toCents(values.promoEur);
    const promoPriceBgnCents = toCents(values.promoBgn);

    if (priceEurCents === null) {
      return;
    }

    if (mode === 'create') {
      const payload: CreateItemDto = {
        categoryId,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        isAvailable: values.isAvailable,
        sortOrder: values.sortOrder,
        prices: {
          priceEurCents,
          ...(priceBgnCents !== null ? { priceBgnCents } : {}),
        },
        ...(promoPriceEurCents !== null || promoPriceBgnCents !== null
          ? {
              promo: {
                ...(promoPriceEurCents !== null ? { promoPriceEurCents } : {}),
                ...(promoPriceBgnCents !== null ? { promoPriceBgnCents } : {}),
              },
            }
          : {}),
      };

      await onCreate(payload);
      return;
    }

    if (!item) {
      return;
    }

    const updatePayload: UpdateItemDto = {};

    if (!sameOrEmpty(values.name, item.name)) {
      updatePayload.name = values.name.trim();
    }

    if (!sameOrEmpty(values.description, item.description)) {
      updatePayload.description = values.description.trim() || undefined;
    }

    if (values.sortOrder !== item.sortOrder) {
      updatePayload.sortOrder = values.sortOrder;
    }

    if (values.isAvailable !== item.isAvailable) {
      updatePayload.isAvailable = values.isAvailable;
    }

    const initialPriceEur = item.prices?.priceEurCents ?? null;
    const initialPriceBgn = item.prices?.priceBgnCents ?? null;
    if (priceEurCents !== initialPriceEur || priceBgnCents !== initialPriceBgn) {
      updatePayload.prices = {
        priceEurCents,
        priceBgnCents,
      };
    }

    const initialPromoEur = item.promo?.promoPriceEurCents ?? null;
    const initialPromoBgn = item.promo?.promoPriceBgnCents ?? null;
    if (promoPriceEurCents !== initialPromoEur || promoPriceBgnCents !== initialPromoBgn) {
      updatePayload.promo = {
        promoPriceEurCents,
        promoPriceBgnCents,
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      onOpenChange(false);
      return;
    }

    await onUpdate(item.id, updatePayload);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('admin.menu.newItem') : t('admin.menu.editItem')}</DialogTitle>
        </DialogHeader>

        <ApiErrorAlert error={error} />

        <form className="grid gap-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="item-name">{t('admin.menu.fields.name')}</Label>
            <Input id="item-name" {...register('name')} disabled={isSubmitting} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">{t('admin.menu.fields.description')}</Label>
            <textarea
              id="item-description"
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-sortOrder">{t('admin.menu.fields.sortOrder')}</Label>
              <Input id="item-sortOrder" type="number" min={0} {...register('sortOrder', { valueAsNumber: true })} disabled={isSubmitting} />
              {errors.sortOrder ? <p className="text-xs text-destructive">{errors.sortOrder.message}</p> : null}
            </div>

            <label className="mt-7 flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" {...register('isAvailable')} disabled={isSubmitting} />
              {t('admin.menu.fields.available')}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-priceEur">{t('admin.menu.fields.priceEur')}</Label>
              <Input id="item-priceEur" placeholder="9.99" {...register('priceEur')} disabled={isSubmitting} />
              {errors.priceEur ? <p className="text-xs text-destructive">{errors.priceEur.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-priceBgn">{t('admin.menu.fields.priceBgn')}</Label>
              <Input id="item-priceBgn" placeholder="19.53" {...register('priceBgn')} disabled={isSubmitting} />
              {errors.priceBgn ? <p className="text-xs text-destructive">{errors.priceBgn.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-promoEur">{t('admin.menu.fields.promoEur')}</Label>
              <Input id="item-promoEur" placeholder="7.99" {...register('promoEur')} disabled={isSubmitting} />
              {errors.promoEur ? <p className="text-xs text-destructive">{errors.promoEur.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-promoBgn">{t('admin.menu.fields.promoBgn')}</Label>
              <Input id="item-promoBgn" placeholder="15.63" {...register('promoBgn')} disabled={isSubmitting} />
              {errors.promoBgn ? <p className="text-xs text-destructive">{errors.promoBgn.message}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t('admin.menu.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t('admin.menu.actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
