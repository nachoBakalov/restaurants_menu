import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CreateCategoryDto, UpdateCategoryDto } from '../menu.types';
import { useT } from '../../../i18n/useT';
import { Button } from '../../../shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  initialValues?: {
    name: string;
    imageUrl: string;
    sortOrder: number;
  };
  onSubmit: (dto: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
};

type CategoryFormValues = {
  name: string;
  imageUrl: string;
  sortOrder: number;
};

export function CategoryDialog({ open, onOpenChange, mode, isSubmitting, initialValues, onSubmit }: CategoryDialogProps) {
  const { t } = useT();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('auth.validation.required')),
        imageUrl: z.string(),
        sortOrder: z.number().min(0, t('auth.validation.required')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? '',
      imageUrl: initialValues?.imageUrl ?? '',
      sortOrder: initialValues?.sortOrder ?? 0,
    },
  });

  const imagePreview = watch('imageUrl').trim();

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name ?? '',
        imageUrl: initialValues?.imageUrl ?? '',
        sortOrder: initialValues?.sortOrder ?? 0,
      });
    }
  }, [initialValues?.imageUrl, initialValues?.name, initialValues?.sortOrder, open, reset]);

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      imageUrl: values.imageUrl.trim() || null,
      sortOrder: values.sortOrder,
    };

    await onSubmit(payload);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('admin.menu.newCategory') : t('admin.menu.editCategory')}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'create' ? 'Създаване на категория за менюто.' : 'Редакция на съществуваща категория.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="category-name">{t('admin.menu.fields.name')}</Label>
            <Input id="category-name" {...register('name')} disabled={isSubmitting} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-sort">{t('admin.menu.fields.sortOrder')}</Label>
            <Input id="category-sort" type="number" min={0} {...register('sortOrder', { valueAsNumber: true })} disabled={isSubmitting} />
            {errors.sortOrder ? <p className="text-xs text-destructive">{errors.sortOrder.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-image">{t('admin.menu.fields.imageUrl')}</Label>
            <Input id="category-image" placeholder="https://..." {...register('imageUrl')} disabled={isSubmitting} />
            {imagePreview ? (
              <img src={imagePreview} alt={watch('name') || 'category preview'} className="h-16 w-16 rounded-md border object-cover" />
            ) : null}
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
