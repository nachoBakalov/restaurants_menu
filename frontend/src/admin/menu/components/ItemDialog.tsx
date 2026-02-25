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
  allergens: string;
  imageUrl: string;
  sortOrder: number;
  isAvailable: boolean;
  priceEur: string;
  promoEur: string;
  promoStartsAt: string;
  promoEndsAt: string;
};

const FX = 1.95583;

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

function eurCentsToBgnCents(eurCents: number | null): number | null {
  if (eurCents === null) {
    return null;
  }

  return Math.round(eurCents * FX);
}

function sameOrEmpty(left?: string, right?: string): boolean {
  return (left ?? '').trim() === (right ?? '').trim();
}

function toDateInputValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
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
        allergens: z.string(),
        imageUrl: z.string(),
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
        promoEur: z
          .string()
          .refine((value) => {
            if (!value || !value.trim()) {
              return true;
            }
            const cents = toCents(value);
            return cents !== null && cents > 0;
          }, t('auth.validation.required')),
        promoStartsAt: z.string(),
        promoEndsAt: z.string(),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      allergens: item?.allergens ?? '',
      imageUrl: item?.imageUrl ?? '',
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
      priceEur: centsToDecimal(item?.prices?.priceEurCents),
      promoEur: centsToDecimal(item?.promo?.promoPriceEurCents),
      promoStartsAt: toDateInputValue(item?.promo?.promoStartsAt),
      promoEndsAt: toDateInputValue(item?.promo?.promoEndsAt),
    },
  });

  const watchedPriceEur = watch('priceEur');
  const watchedPromoEur = watch('promoEur');
  const watchedImageUrl = watch('imageUrl');

  const priceBgnPreview = centsToDecimal(eurCentsToBgnCents(toCents(watchedPriceEur ?? '')));
  const promoBgnPreview = centsToDecimal(eurCentsToBgnCents(toCents(watchedPromoEur ?? '')));
  const imagePreview = watchedImageUrl.trim();

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: item?.name ?? '',
      description: item?.description ?? '',
      allergens: item?.allergens ?? '',
      imageUrl: item?.imageUrl ?? '',
      sortOrder: item?.sortOrder ?? 0,
      isAvailable: item?.isAvailable ?? true,
      priceEur: centsToDecimal(item?.prices?.priceEurCents),
      promoEur: centsToDecimal(item?.promo?.promoPriceEurCents),
      promoStartsAt: toDateInputValue(item?.promo?.promoStartsAt),
      promoEndsAt: toDateInputValue(item?.promo?.promoEndsAt),
    });
  }, [item, open, reset]);

  const submit = handleSubmit(async (values) => {
    const priceEurCents = toCents(values.priceEur);
    const priceBgnCents = eurCentsToBgnCents(priceEurCents);
    const promoPriceEurCents = toCents(values.promoEur);
    const promoPriceBgnCents = eurCentsToBgnCents(promoPriceEurCents);
    const promoStartsAt = values.promoStartsAt.trim();
    const promoEndsAt = values.promoEndsAt.trim();
    const normalizedAllergens = values.allergens.trim();
    const normalizedImageUrl = values.imageUrl.trim() || null;

    if (priceEurCents === null) {
      return;
    }

    if (mode === 'create') {
      const payload: CreateItemDto = {
        categoryId,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        allergens: normalizedAllergens || undefined,
        imageUrl: normalizedImageUrl,
        isAvailable: values.isAvailable,
        sortOrder: values.sortOrder,
        prices: {
          priceEurCents,
          ...(priceBgnCents !== null ? { priceBgnCents } : {}),
        },
        ...(promoPriceEurCents !== null || promoPriceBgnCents !== null || Boolean(promoStartsAt) || Boolean(promoEndsAt)
          ? {
              promo: {
                ...(promoPriceEurCents !== null ? { promoPriceEurCents } : {}),
                ...(promoPriceBgnCents !== null ? { promoPriceBgnCents } : {}),
                ...(promoStartsAt ? { promoStartsAt } : {}),
                ...(promoEndsAt ? { promoEndsAt } : {}),
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

    const normalizedAllergensValue = normalizedAllergens || null;
    const initialAllergens = item.allergens ?? null;
    if (normalizedAllergensValue !== initialAllergens) {
      updatePayload.allergens = normalizedAllergensValue;
    }

    const initialImageUrl = item.imageUrl ?? null;
    if (normalizedImageUrl !== initialImageUrl) {
      updatePayload.imageUrl = normalizedImageUrl;
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
    const initialPromoStartsAt = toDateInputValue(item.promo?.promoStartsAt);
    const initialPromoEndsAt = toDateInputValue(item.promo?.promoEndsAt);
    let promoPayload: NonNullable<UpdateItemDto['promo']> | undefined;

    if (promoPriceEurCents !== initialPromoEur || promoPriceBgnCents !== initialPromoBgn) {
      promoPayload = {
        promoPriceEurCents,
        promoPriceBgnCents,
      };
    }

    if (promoStartsAt !== initialPromoStartsAt) {
      promoPayload = {
        ...(promoPayload ?? {}),
        promoStartsAt: promoStartsAt || null,
      };
    }

    if (promoEndsAt !== initialPromoEndsAt) {
      promoPayload = {
        ...(promoPayload ?? {}),
        promoEndsAt: promoEndsAt || null,
      };
    }

    if (promoPayload) {
      updatePayload.promo = promoPayload;
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

          <div className="space-y-2">
            <Label htmlFor="item-allergens">{t('admin.menu.fields.allergens')}</Label>
            <textarea
              id="item-allergens"
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('allergens')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-imageUrl">{t('admin.menu.fields.imageUrl')}</Label>
            <Input id="item-imageUrl" placeholder="https://..." {...register('imageUrl')} disabled={isSubmitting} />
            {imagePreview ? (
              <img src={imagePreview} alt={watch('name') || 'item preview'} className="h-16 w-16 rounded-md border object-cover" />
            ) : null}
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
              <Input id="item-priceBgn" placeholder="19.53" value={priceBgnPreview} readOnly disabled />
              <p className="text-xs text-muted-foreground">{t('admin.menu.fx.rate')}</p>
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
              <Input id="item-promoBgn" placeholder="15.63" value={promoBgnPreview} readOnly disabled />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-promoStartsAt">{t('admin.menu.fields.promoStartsAt')}</Label>
              <Input id="item-promoStartsAt" type="date" {...register('promoStartsAt')} disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-promoEndsAt">{t('admin.menu.fields.promoEndsAt')}</Label>
              <Input id="item-promoEndsAt" type="date" {...register('promoEndsAt')} disabled={isSubmitting} />
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
