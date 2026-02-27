import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../auth/auth.context';
import { useT } from '../../i18n/useT';
import { createWithOwner, fetchRestaurants, updateRestaurant } from './restaurants.api';
import type { Restaurant, UpdateRestaurantDto } from './restaurants.api';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shared/ui/dialog';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function toOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toSocialLinksPayload(values: { facebook?: string; instagram?: string; googleBusiness?: string }) {
  const facebook = toNullableString(values.facebook ?? '');
  const instagram = toNullableString(values.instagram ?? '');
  const googleBusiness = toNullableString(values.googleBusiness ?? '');

  const socialLinks = {
    ...(facebook ? { facebook } : {}),
    ...(instagram ? { instagram } : {}),
    ...(googleBusiness ? { googleBusiness } : {}),
  };

  return Object.keys(socialLinks).length > 0 ? socialLinks : null;
}

export function RestaurantsPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRestaurantId, setActiveRestaurantId } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const createSchema = useMemo(
    () =>
      z.object({
        restaurantName: z.string().min(1, t('auth.validation.required')),
        slug: z
          .string()
          .min(1, t('auth.validation.required'))
          .regex(/^[a-z0-9-]+$/, t('auth.validation.slugPattern')),
        ownerEmail: z.string().email(t('auth.validation.email')),
        ownerPassword: z.string().min(6, t('auth.validation.passwordMin')),
        logoUrl: z.string().optional(),
        coverImageUrl: z.string().optional(),
        phoneNumber: z.string().max(50).optional(),
        address: z.string().max(300).optional(),
        facebook: z.string().max(2048).optional(),
        instagram: z.string().max(2048).optional(),
        googleBusiness: z.string().max(2048).optional(),
      }),
    [t],
  );

  const editSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('auth.validation.required')),
        slug: z
          .string()
          .min(1, t('auth.validation.required'))
          .regex(/^[a-z0-9-]+$/, t('auth.validation.slugPattern')),
        logoUrl: z.string().optional(),
        coverImageUrl: z.string().optional(),
        phoneNumber: z.string().max(50).optional(),
        address: z.string().max(300).optional(),
        facebook: z.string().max(2048).optional(),
        instagram: z.string().max(2048).optional(),
        googleBusiness: z.string().max(2048).optional(),
      }),
    [t],
  );

  type CreateFormValues = z.infer<typeof createSchema>;
  type EditFormValues = z.infer<typeof editSchema>;

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      restaurantName: '',
      slug: '',
      ownerEmail: '',
      ownerPassword: '',
      logoUrl: '',
      coverImageUrl: '',
    },
  });

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      slug: '',
      logoUrl: '',
      coverImageUrl: '',
      phoneNumber: '',
      address: '',
      facebook: '',
      instagram: '',
      googleBusiness: '',
    },
  });

  const watchedLogoUrl = editForm.watch('logoUrl');
  const watchedCoverImageUrl = editForm.watch('coverImageUrl');
  const watchedFacebook = editForm.watch('facebook');
  const watchedInstagram = editForm.watch('instagram');
  const watchedGoogleBusiness = editForm.watch('googleBusiness');

  const restaurantsQuery = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: fetchRestaurants,
    enabled: user?.role === 'SUPERADMIN',
  });

  const createMutation = useMutation({
    mutationFn: createWithOwner,
    onSuccess: async (data, variables) => {
      const createdRestaurantId = data?.restaurant?.id;
      const logoUrl = toOptionalString(variables.logoUrl ?? '');
      const coverImageUrl = toOptionalString(variables.coverImageUrl ?? '');

      if (createdRestaurantId && (logoUrl || coverImageUrl)) {
        const brandingDto: UpdateRestaurantDto = {};
        if (logoUrl !== undefined) {
          brandingDto.logoUrl = logoUrl;
        }
        if (coverImageUrl !== undefined) {
          brandingDto.coverImageUrl = coverImageUrl;
        }

        await updateRestaurant(createdRestaurantId, brandingDto);
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setIsCreateDialogOpen(false);
      createForm.reset();

      if (createdRestaurantId) {
        setActiveRestaurantId(createdRestaurantId);
        navigate('/admin/menu');
      }
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      if (!editingRestaurant) {
        throw new Error('Missing restaurant to edit');
      }

      const payload: UpdateRestaurantDto = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        logoUrl: toOptionalString(values.logoUrl ?? '') ?? null,
        coverImageUrl: toOptionalString(values.coverImageUrl ?? '') ?? null,
        phoneNumber: toNullableString(values.phoneNumber ?? ''),
        address: toNullableString(values.address ?? ''),
        socialLinks: toSocialLinksPayload({
          facebook: values.facebook,
          instagram: values.instagram,
          googleBusiness: values.googleBusiness,
        }),
      };

      return updateRestaurant(editingRestaurant.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setIsEditDialogOpen(false);
      setEditingRestaurant(null);
    },
  });

  const activeRestaurant = useMemo(
    () => (restaurantsQuery.data ?? []).find((restaurant) => restaurant.id === activeRestaurantId),
    [restaurantsQuery.data, activeRestaurantId],
  );

  if (user?.role !== 'SUPERADMIN') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.restaurants.title')}</CardTitle>
          <CardDescription>{t('admin.common.noAccess')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            {t('admin.nav.dashboard')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('admin.restaurants.title')}</CardTitle>
            <CardDescription>{t('admin.pageTitles.billing')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeRestaurantId ? (
              <Badge variant="secondary">
                {t('admin.restaurants.scopeBadge')}: {activeRestaurant?.slug ?? activeRestaurantId.slice(0, 8)}
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveRestaurantId(null)}
              disabled={!activeRestaurantId}
            >
              {t('admin.restaurants.actions.clearScope')}
            </Button>
            <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>
              {t('admin.restaurants.actions.create')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <ApiErrorAlert error={restaurantsQuery.error} />
          <ApiErrorAlert error={createMutation.error} />
          <ApiErrorAlert error={editMutation.error} />

          {restaurantsQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('admin.common.loading')}</p> : null}

          {!restaurantsQuery.isLoading && (restaurantsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.comingSoon')}</p>
          ) : null}

          {(restaurantsQuery.data ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Logo</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Slug</th>
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-0 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(restaurantsQuery.data ?? []).map((restaurant) => (
                    <tr key={restaurant.id} className="border-b">
                      <td className="py-2 pr-3 align-middle">
                        {restaurant.logoUrl ? (
                          <img src={restaurant.logoUrl} alt={restaurant.name} className="h-8 w-8 rounded object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded border bg-muted" />
                        )}
                      </td>
                      <td className="py-2 pr-3 font-medium">{restaurant.name}</td>
                      <td className="py-2 pr-3">{restaurant.slug}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{restaurant.id}</td>
                      <td className="py-2 pr-3">{formatDate(restaurant.createdAt)}</td>
                      <td className="py-2 pr-0 text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRestaurant(restaurant);
                              editForm.reset({
                                name: restaurant.name,
                                slug: restaurant.slug,
                                logoUrl: restaurant.logoUrl ?? '',
                                coverImageUrl: restaurant.coverImageUrl ?? '',
                                phoneNumber: restaurant.phoneNumber ?? '',
                                address: restaurant.address ?? '',
                                facebook: restaurant.socialLinks?.facebook ?? '',
                                instagram: restaurant.socialLinks?.instagram ?? '',
                                googleBusiness: restaurant.socialLinks?.googleBusiness ?? '',
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            {t('admin.restaurants.actions.edit')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setActiveRestaurantId(restaurant.id);
                              navigate('/admin/menu');
                            }}
                          >
                            {t('admin.restaurants.actions.enter')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateDialogOpen(nextOpen);
          if (!nextOpen) {
            createForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.restaurants.create.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              Създаване на нов ресторант и owner акаунт.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit(async (values) => {
              await createMutation.mutateAsync({
                restaurantName: values.restaurantName.trim(),
                slug: values.slug.trim(),
                email: values.ownerEmail.trim(),
                password: values.ownerPassword,
                logoUrl: toOptionalString(values.logoUrl ?? '') ?? null,
                coverImageUrl: toOptionalString(values.coverImageUrl ?? '') ?? null,
              });
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">{t('admin.restaurants.create.restaurantName')}</Label>
              <Input id="restaurant-name" {...createForm.register('restaurantName')} disabled={createMutation.isPending} />
              {createForm.formState.errors.restaurantName ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.restaurantName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-slug">{t('admin.restaurants.create.slug')}</Label>
              <Input id="restaurant-slug" {...createForm.register('slug')} disabled={createMutation.isPending} />
              {createForm.formState.errors.slug ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.slug.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-email">{t('admin.restaurants.create.ownerEmail')}</Label>
              <Input id="owner-email" type="email" {...createForm.register('ownerEmail')} disabled={createMutation.isPending} />
              {createForm.formState.errors.ownerEmail ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.ownerEmail.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-password">{t('admin.restaurants.create.ownerPassword')}</Label>
              <Input id="owner-password" type="password" {...createForm.register('ownerPassword')} disabled={createMutation.isPending} />
              {createForm.formState.errors.ownerPassword ? (
                <p className="text-xs text-destructive">{createForm.formState.errors.ownerPassword.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-logo-url">{t('admin.restaurants.fields.logoUrl')}</Label>
              <Input id="create-logo-url" {...createForm.register('logoUrl')} disabled={createMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-cover-url">{t('admin.restaurants.fields.coverImageUrl')}</Label>
              <Input id="create-cover-url" {...createForm.register('coverImageUrl')} disabled={createMutation.isPending} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={createMutation.isPending}>
                {t('admin.menu.actions.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('admin.restaurants.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(nextOpen) => {
          setIsEditDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingRestaurant(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.restaurants.edit.title')}</DialogTitle>
            <DialogDescription className="sr-only">Редакция на ресторант и branding полета.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={editForm.handleSubmit(async (values) => {
              await editMutation.mutateAsync(values);
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="edit-restaurant-name">{t('admin.restaurants.create.restaurantName')}</Label>
              <Input id="edit-restaurant-name" {...editForm.register('name')} disabled={editMutation.isPending} />
              {editForm.formState.errors.name ? <p className="text-xs text-destructive">{editForm.formState.errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-restaurant-slug">{t('admin.restaurants.create.slug')}</Label>
              <Input id="edit-restaurant-slug" {...editForm.register('slug')} disabled={editMutation.isPending} />
              {editForm.formState.errors.slug ? <p className="text-xs text-destructive">{editForm.formState.errors.slug.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-logo-url">{t('admin.restaurants.fields.logoUrl')}</Label>
              <Input id="edit-logo-url" {...editForm.register('logoUrl')} disabled={editMutation.isPending} />
            </div>

            {toOptionalString(watchedLogoUrl ?? '') ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('admin.restaurants.preview.logo')}</p>
                <img
                  src={toOptionalString(watchedLogoUrl ?? '')}
                  alt={t('admin.restaurants.preview.logo')}
                  className="h-16 w-16 rounded border object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="edit-cover-url">{t('admin.restaurants.fields.coverImageUrl')}</Label>
              <Input id="edit-cover-url" {...editForm.register('coverImageUrl')} disabled={editMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t('admin.restaurant.phone')}</Label>
              <Input id="edit-phone" {...editForm.register('phoneNumber')} disabled={editMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">{t('admin.restaurant.address')}</Label>
              <Input id="edit-address" {...editForm.register('address')} disabled={editMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-facebook">{t('admin.restaurant.social.facebook')}</Label>
              <Input id="edit-facebook" {...editForm.register('facebook')} disabled={editMutation.isPending} />
              {toOptionalString(watchedFacebook ?? '') ? (
                <a
                  href={toOptionalString(watchedFacebook ?? '')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  {toOptionalString(watchedFacebook ?? '')}
                </a>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instagram">{t('admin.restaurant.social.instagram')}</Label>
              <Input id="edit-instagram" {...editForm.register('instagram')} disabled={editMutation.isPending} />
              {toOptionalString(watchedInstagram ?? '') ? (
                <a
                  href={toOptionalString(watchedInstagram ?? '')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  {toOptionalString(watchedInstagram ?? '')}
                </a>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-google-business">{t('admin.restaurant.social.googleBusiness')}</Label>
              <Input id="edit-google-business" {...editForm.register('googleBusiness')} disabled={editMutation.isPending} />
              {toOptionalString(watchedGoogleBusiness ?? '') ? (
                <a
                  href={toOptionalString(watchedGoogleBusiness ?? '')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  {toOptionalString(watchedGoogleBusiness ?? '')}
                </a>
              ) : null}
            </div>

            {toOptionalString(watchedCoverImageUrl ?? '') ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('admin.restaurants.preview.cover')}</p>
                <img
                  src={toOptionalString(watchedCoverImageUrl ?? '')}
                  alt={t('admin.restaurants.preview.cover')}
                  className="h-24 w-full rounded border object-cover"
                />
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={editMutation.isPending}>
                {t('admin.menu.actions.cancel')}
              </Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {t('admin.menu.actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
