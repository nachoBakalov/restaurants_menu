import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CreateCategoryDto, UpdateCategoryDto } from '../menu.types';
import { useT } from '../../../i18n/useT';
import { Button } from '../../../shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  isSubmitting: boolean;
  initialValues?: {
    name: string;
    sortOrder: number;
  };
  onSubmit: (dto: CreateCategoryDto | UpdateCategoryDto) => Promise<void>;
};

type CategoryFormValues = {
  name: string;
  sortOrder: number;
};

export function CategoryDialog({ open, onOpenChange, mode, isSubmitting, initialValues, onSubmit }: CategoryDialogProps) {
  const { t } = useT();

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(2, t('auth.validation.required')),
        sortOrder: z.number().min(0, t('auth.validation.required')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? '',
      sortOrder: initialValues?.sortOrder ?? 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: initialValues?.name ?? '',
        sortOrder: initialValues?.sortOrder ?? 0,
      });
    }
  }, [initialValues?.name, initialValues?.sortOrder, open, reset]);

  const submit = handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      sortOrder: values.sortOrder,
    };

    await onSubmit(payload);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('admin.menu.newCategory') : t('admin.menu.editCategory')}</DialogTitle>
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
