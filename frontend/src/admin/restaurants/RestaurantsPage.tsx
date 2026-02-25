import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../auth/auth.context';
import { useT } from '../../i18n/useT';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shared/ui/dialog';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';

type RestaurantListItem = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

type RestaurantsResponse = {
  items: RestaurantListItem[];
  nextCursor: string | null;
};

type CreateRestaurantPayload = {
  restaurantName: string;
  slug: string;
  email: string;
  password: string;
};

type CreateRestaurantResponse = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export function RestaurantsPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, activeRestaurantId, setActiveRestaurantId } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const restaurantsQuery = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: async () => {
      const response = await apiClient.get<RestaurantsResponse>('/admin/restaurants');
      return response.data.items;
    },
    enabled: user?.role === 'SUPERADMIN',
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateRestaurantPayload) => {
      const response = await apiClient.post<CreateRestaurantResponse>('/admin/restaurants/create-with-owner', payload);
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setIsDialogOpen(false);
      setRestaurantName('');
      setSlug('');
      setOwnerEmail('');
      setOwnerPassword('');

      if (data?.restaurant?.id) {
        setActiveRestaurantId(data.restaurant.id);
        navigate('/admin/menu');
      }
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
            <Button type="button" onClick={() => setIsDialogOpen(true)}>
              {t('admin.restaurants.actions.create')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <ApiErrorAlert error={restaurantsQuery.error} />
          <ApiErrorAlert error={createMutation.error} />

          {restaurantsQuery.isLoading ? <p className="text-sm text-muted-foreground">{t('admin.common.loading')}</p> : null}

          {!restaurantsQuery.isLoading && (restaurantsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.comingSoon')}</p>
          ) : null}

          {(restaurantsQuery.data ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
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
                      <td className="py-2 pr-3 font-medium">{restaurant.name}</td>
                      <td className="py-2 pr-3">{restaurant.slug}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{restaurant.id}</td>
                      <td className="py-2 pr-3">{formatDate(restaurant.createdAt)}</td>
                      <td className="py-2 pr-0 text-right">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.restaurants.create.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              Създаване на нов ресторант и owner акаунт.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();

              if (!restaurantName.trim() || !slug.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
                return;
              }

              await createMutation.mutateAsync({
                restaurantName: restaurantName.trim(),
                slug: slug.trim(),
                email: ownerEmail.trim(),
                password: ownerPassword,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">{t('admin.restaurants.create.restaurantName')}</Label>
              <Input id="restaurant-name" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} disabled={createMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-slug">{t('admin.restaurants.create.slug')}</Label>
              <Input id="restaurant-slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={createMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-email">{t('admin.restaurants.create.ownerEmail')}</Label>
              <Input id="owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} disabled={createMutation.isPending} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-password">{t('admin.restaurants.create.ownerPassword')}</Label>
              <Input id="owner-password" type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} disabled={createMutation.isPending} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={createMutation.isPending}>
                {t('admin.menu.actions.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {t('admin.restaurants.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
