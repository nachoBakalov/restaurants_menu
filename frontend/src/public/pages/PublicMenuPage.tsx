import { useMutation, useQuery } from '@tanstack/react-query';
import { Facebook, Globe, Instagram, MapPin, Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CreatePublicOrderPayload, PublicMenuItem } from '../api/public.types';
import { createPublicOrder, fetchPublicMenu, fetchPublicRestaurant } from '../api/public.api';
import { useCart } from '../cart/useCart';
import { ThemeProvider, usePublicTheme } from '../theme/ThemeProvider';
import { useT } from '../../i18n/useT';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { Card, CardContent } from '../../shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../shared/ui/dialog';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Skeleton } from '../../shared/ui/skeleton';

type CheckoutType = 'TABLE' | 'DELIVERY' | 'TAKEAWAY';

function formatMoney(cents: number, currency: 'EUR' | 'BGN'): string {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('bg-BG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function normalizePhoneForTel(phoneNumber: string): string {
  return phoneNumber.replace(/[^+\d]/g, '');
}

function PriceBlock({
  item,
  showBgn,
}: {
  item: PublicMenuItem;
  showBgn: boolean;
}) {
  const eurCurrent = item.pricing.prices.EUR.currentCents;
  const eurOriginal = item.pricing.prices.EUR.originalCents;
  const bgnCurrent = item.pricing.prices.BGN?.currentCents;
  const bgnOriginal = item.pricing.prices.BGN?.originalCents;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{formatMoney(eurCurrent, 'EUR')}</span>
        {eurOriginal ? <span className="text-xs text-muted-foreground line-through">{formatMoney(eurOriginal, 'EUR')}</span> : null}
      </div>
      {showBgn && bgnCurrent !== undefined ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{formatMoney(bgnCurrent, 'BGN')}</span>
          {bgnOriginal ? <span className="text-xs line-through">{formatMoney(bgnOriginal, 'BGN')}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function parseAllergens(allergens: string | string[] | null | undefined): string[] {
  if (Array.isArray(allergens)) {
    return allergens.map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof allergens === 'string') {
    return allergens
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function PublicMenuContent() {
  const { slug } = useParams();
  const { t } = useT();
  const { theme } = usePublicTheme();
  const cart = useCart();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('TABLE');
  const [tableCode, setTableCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderId: string; status: string } | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const clickScrollLockUntil = useRef(0);

  const restaurantQuery = useQuery({
    queryKey: ['public-restaurant', slug],
    queryFn: () => fetchPublicRestaurant(slug ?? ''),
    enabled: Boolean(slug),
  });

  const menuQuery = useQuery({
    queryKey: ['public-menu', slug],
    queryFn: () => fetchPublicMenu(slug ?? ''),
    enabled: Boolean(slug),
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreatePublicOrderPayload) => createPublicOrder(slug ?? '', payload),
    onSuccess: (data) => {
      cart.clearCart();
      setCheckoutError(null);
      setSuccessOrder({ orderId: data.orderId, status: data.status });
    },
  });

  const restaurant = restaurantQuery.data ?? menuQuery.data?.restaurant;
  const categories = menuQuery.data?.categories ?? [];
  const orderingFeatureEnabled = Boolean(restaurant?.features.ORDERING);
  const orderingVisible = Boolean(restaurant?.ordering.visible);
  const orderingAvailableNow = Boolean(restaurant?.ordering.availableNow);
  const orderingAllowedNow = orderingFeatureEnabled && orderingVisible && orderingAvailableNow;
  const showBgn = Boolean(restaurant?.currency.bgnActiveNow);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return [] as Array<PublicMenuItem & { categoryName: string }>;
    }

    return categories.flatMap((category) =>
      category.items
        .filter((item) => {
          const inName = item.name.toLowerCase().includes(normalizedSearch);
          const inDescription = (item.description ?? '').toLowerCase().includes(normalizedSearch);
          return inName || inDescription;
        })
        .map((item) => ({ ...item, categoryName: category.name })),
    );
  }, [categories, normalizedSearch]);

  const phoneNumber = restaurant?.phoneNumber?.trim() ?? '';
  const normalizedPhone = phoneNumber ? normalizePhoneForTel(phoneNumber) : '';
  const address = restaurant?.address?.trim() ?? '';
  const mapsLink = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : '';
  const facebookLink = restaurant?.socialLinks?.facebook?.trim() ?? '';
  const instagramLink = restaurant?.socialLinks?.instagram?.trim() ?? '';
  const googleBusinessLink = restaurant?.socialLinks?.googleBusiness?.trim() ?? '';
  const hasContactInfo = Boolean(phoneNumber || address || facebookLink || instagramLink || googleBusinessLink);
  const getCartQty = (itemId: string) => cart.items.find((entry) => entry.itemId === itemId)?.qty ?? 0;

  const addOrIncrementItem = (item: PublicMenuItem) => {
    const currentQty = getCartQty(item.id);

    if (currentQty > 0) {
      cart.increment(item.id);
      return;
    }

    cart.addItem({
      itemId: item.id,
      name: item.name,
      unitPrice: {
        eurCents: item.pricing.prices.EUR.currentCents,
        bgnCents: showBgn ? (item.pricing.prices.BGN?.currentCents ?? null) : null,
      },
      qty: 1,
    });
  };

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (normalizedSearch || categories.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < clickScrollLockUntil.current) {
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const firstVisible = visible[0];
        if (!firstVisible) {
          return;
        }

        const categoryId = (firstVisible.target as HTMLElement).dataset.categoryId;
        if (categoryId) {
          setActiveCategoryId(categoryId);
        }
      },
      {
        threshold: [0.4, 0.6],
      },
    );

    categories.forEach((category) => {
      const section = sectionRefs.current[category.id];
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [categories, normalizedSearch]);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    const activeTab = document.getElementById(`category-tab-${activeCategoryId}`);
    activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeCategoryId]);

  useEffect(() => {
    if (cart.items.length === 0 && isCheckoutOpen) {
      setIsCheckoutOpen(false);
    }
  }, [cart.items.length, isCheckoutOpen]);

  useEffect(() => {
    if (!orderingAllowedNow) {
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
    }
  }, [orderingAllowedNow]);

  useEffect(() => {
    if (cart.items.length === 0 && isMobileCartOpen) {
      setIsMobileCartOpen(false);
    }
  }, [cart.items.length, isMobileCartOpen]);

  const heroStyle = useMemo(
    () => ({
      backgroundImage: restaurant?.coverImageUrl
        ? `url(${restaurant.coverImageUrl})`
        : 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--accent)))',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [restaurant?.coverImageUrl],
  );

  if (!slug) {
    return <p className="p-6 text-sm text-muted-foreground">{t('public.common.error')}</p>;
  }

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <main className={`min-h-screen ${theme.pageClassName}`}>
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6">
          <section className={`${theme.heroClassName} overflow-hidden`}>
            <div className="space-y-3 p-5 md:p-8">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-9 w-60" />
            </div>
          </section>

          <section className="mt-4 space-y-2">
            <Skeleton className="h-10 w-full max-w-sm" />
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className={`${theme.cardClassName} space-y-3 p-4`}>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{t('public.common.loadingSkeleton')}</p>
        </div>
      </main>
    );
  }

  if (restaurantQuery.error || menuQuery.error || !restaurant) {
    return (
      <div className="p-6">
        <ApiErrorAlert error={restaurantQuery.error ?? menuQuery.error} />
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${theme.pageClassName}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6 ">
        <section
          className={`${theme.heroClassName} relative overflow-hidden transition-all duration-300`}
          style={heroStyle}
        >
          {restaurant.coverImageUrl ? <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" /> : null}

          <div className={`relative z-10 p-5 md:p-8 ${restaurant.coverImageUrl ? 'text-white' : ''}`}>
            <div className="flex items-center gap-4 ">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-full border-2 border-background object-cover md:h-20 md:w-20"
                />
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-background/60 bg-background/40 md:h-20 md:w-20" />
              )}
              <div>
                <h1 className="text-2xl font-semibold md:text-3xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
                  {restaurant.name}
                </h1>
                {/* <p className={`text-sm ${restaurant.coverImageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>/{restaurant.slug}</p> */}
              </div>
            </div>

            {hasContactInfo ? (
              <div className={`mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${restaurant.coverImageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
                <div className="space-y-1 text-sm">
                  {phoneNumber && normalizedPhone ? (
                    <a href={`tel:${normalizedPhone}`} className="inline-flex items-center gap-2 hover:underline">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      <span>{t('public.header.call')}: {phoneNumber}</span>
                    </a>
                  ) : null}

                  {address ? (
                    <div className="inline-flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="line-clamp-2 hover:underline">
                        {t('public.header.address')}: {address}
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {facebookLink ? (
                    <a
                      href={facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('public.header.facebook')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-current/30 transition-all duration-200 ease-out hover:scale-105 hover:bg-background/10 active:scale-95"
                    >
                      <Facebook className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}

                  {instagramLink ? (
                    <a
                      href={instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('public.header.instagram')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-current/30 transition-all duration-200 ease-out hover:scale-105 hover:bg-background/10 active:scale-95"
                    >
                      <Instagram className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}

                  {googleBusinessLink ? (
                    <a
                      href={googleBusinessLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('public.header.googleBusiness')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-current/30 transition-all duration-200 ease-out hover:scale-105 hover:bg-background/10 active:scale-95"
                    >
                      <Globe className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-4">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('public.menu.searchPlaceholder')}
            className="max-w-md"
          />
          {!orderingAllowedNow ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {!orderingFeatureEnabled
                ? t('public.common.outOfHours')
                : !orderingVisible
                  ? t('public.common.outOfHours')
                  : restaurant.ordering.nextOpenAt
                    ? `Следващо отваряне: ${formatDateTime(restaurant.ordering.nextOpenAt)}`
                    : t('public.common.outOfHours')}
            </p>
          ) : null}
        </section>

        <section className="sticky top-0 z-10 mt-3 border-y bg-background/95 py-3 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                id={`category-tab-${category.id}`}
                key={category.id}
                type="button"
                size="sm"
                variant={activeCategoryId === category.id ? 'default' : 'outline'}
                className="transition-all duration-200 ease-out"
                onClick={() => {
                  setActiveCategoryId(category.id);
                  clickScrollLockUntil.current = Date.now() + 800;
                  sectionRefs.current[category.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  document.getElementById(`category-tab-${category.id}`)?.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest',
                  });
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>

        <div className={`mt-5 ${theme.spacingClassName} pb-24 md:pb-8`}>
          {normalizedSearch ? (
            searchResults.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {searchResults.map((item) => {
                  const allergens = parseAllergens(item.allergens as string | string[] | null | undefined);
                  const visibleAllergens = allergens.slice(0, 4);
                  const moreAllergensCount = Math.max(0, allergens.length - visibleAllergens.length);
                  const qtyInCart = getCartQty(item.id);

                  return (
                    <Card key={`${item.categoryName}-${item.id}`} className={`${theme.cardClassName} group transition-all duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md`}>
                      <CardContent className="space-y-3 p-4">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = '/placeholder-food.png';
                            }}
                            className="h-40 w-full rounded-md object-cover transition-transform duration-200 ease-out md:group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="h-40 w-full rounded-md bg-gradient-to-br from-muted to-accent/50" />
                        )}

                        <div className="space-y-1">
                          <h3 className="text-base font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                          {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                          {visibleAllergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {visibleAllergens.map((allergen) => (
                                <Badge key={`${item.id}-${allergen}`} variant="secondary" className="text-[10px]">
                                  {allergen}
                                </Badge>
                              ))}
                              {moreAllergensCount > 0 ? (
                                <Badge variant="secondary" className="text-[10px]">+{moreAllergensCount}</Badge>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <PriceBlock item={item} showBgn={showBgn} />

                        {orderingAllowedNow ? (
                          <div className="flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="transition-all duration-200 ease-out hover:brightness-105 active:scale-[0.98]"
                              disabled={!item.isAvailable}
                              onClick={() => addOrIncrementItem(item)}
                            >
                              {t('public.menu.add')}
                            </Button>

                            {qtyInCart > 0 ? (
                              <div className="flex items-center gap-1 rounded-md border px-1 py-1">
                                <Button type="button" variant="outline" size="sm" onClick={() => cart.decrement(item.id)}>
                                  -
                                </Button>
                                <span className="w-6 text-center text-xs font-medium">{qtyInCart}</span>
                                <Button type="button" variant="outline" size="sm" onClick={() => cart.increment(item.id)}>
                                  +
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('public.menu.noResults')}</p>
            )
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                data-category-id={category.id}
                ref={(node) => {
                  sectionRefs.current[category.id] = node;
                }}
                className="scroll-mt-28 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold md:text-xl">{category.name}</h2>
                  <Badge variant="secondary">{category.items.length}</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {category.items.map((item) => {
                    const allergens = parseAllergens(item.allergens as string | string[] | null | undefined);
                    const visibleAllergens = allergens.slice(0, 4);
                    const moreAllergensCount = Math.max(0, allergens.length - visibleAllergens.length);
                    const qtyInCart = getCartQty(item.id);

                    return (
                      <Card key={item.id} className={`${theme.cardClassName} group transition-all duration-200 ease-out md:hover:-translate-y-0.5 md:hover:shadow-md`}>
                        <CardContent className="space-y-3 p-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = '/placeholder-food.png';
                              }}
                              className="h-40 w-full rounded-md object-cover transition-transform duration-200 ease-out md:group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="h-40 w-full rounded-md bg-gradient-to-br from-muted to-accent/50" />
                          )}

                          <div className="space-y-1">
                            <h3 className="text-base font-semibold">{item.name}</h3>
                            {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                            {visibleAllergens.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {visibleAllergens.map((allergen) => (
                                  <Badge key={`${item.id}-${allergen}`} variant="secondary" className="text-[10px]">
                                    {allergen}
                                  </Badge>
                                ))}
                                {moreAllergensCount > 0 ? (
                                  <Badge variant="secondary" className="text-[10px]">+{moreAllergensCount}</Badge>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <PriceBlock item={item} showBgn={showBgn} />

                          {orderingAllowedNow ? (
                            <div className="flex items-center justify-between gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="transition-all duration-200 ease-out hover:brightness-105 active:scale-[0.98]"
                                disabled={!item.isAvailable}
                                onClick={() => addOrIncrementItem(item)}
                              >
                                {t('public.menu.add')}
                              </Button>

                              {qtyInCart > 0 ? (
                                <div className="flex items-center gap-1 rounded-md border px-1 py-1">
                                  <Button type="button" variant="outline" size="sm" onClick={() => cart.decrement(item.id)}>
                                    -
                                  </Button>
                                  <span className="w-6 text-center text-xs font-medium">{qtyInCart}</span>
                                  <Button type="button" variant="outline" size="sm" onClick={() => cart.increment(item.id)}>
                                    +
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {orderingAllowedNow && cart.items.length > 0 ? (
        <>
          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <button type="button" className="min-w-0 text-left" onClick={() => setIsMobileCartOpen(true)}>
                <p className="text-sm font-medium">
                  {cart.itemsCount} {t('public.cart.itemsCount')} • {formatMoney(cart.totals.eurTotalCents, 'EUR')}
                </p>
              </button>
              <Button type="button" disabled={cart.items.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                {t('public.cart.checkout')}
              </Button>
            </div>
          </div>

          <aside className="fixed right-6 top-24 z-20 hidden w-80 rounded-xl border bg-background p-4 shadow-md md:block">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{t('public.menu.cart')}</h3>
              <Badge variant="secondary">{cart.itemsCount}</Badge>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {cart.items.map((entry) => (
                <div key={entry.itemId} className="rounded border p-2 text-sm transition-all duration-200 ease-out hover:bg-muted/30">
                  <p className="truncate font-medium">{entry.name}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => cart.decrement(entry.itemId)}>
                        -
                      </Button>
                      <span className="w-6 text-center text-xs text-muted-foreground">{entry.qty}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => cart.increment(entry.itemId)}>
                        +
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto px-1 py-0 text-xs"
                      onClick={() => cart.removeItem(entry.itemId)}
                    >
                      {t('public.cart.remove')}
                    </Button>
                  </div>
                </div>
              ))}
              {cart.items.length === 0 ? <p className="text-sm text-muted-foreground">{t('public.cart.empty')}</p> : null}
            </div>
            <div className="mt-3 border-t pt-3">
              <p className="text-sm font-medium">{formatMoney(cart.totals.eurTotalCents, 'EUR')}</p>
              {showBgn && cart.totals.bgnTotalCents !== null ? (
                <p className="text-xs text-muted-foreground">{formatMoney(cart.totals.bgnTotalCents, 'BGN')}</p>
              ) : null}
              <Button className="mt-3 w-full" type="button" disabled={cart.items.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                {t('public.cart.checkout')}
              </Button>
            </div>
          </aside>
        </>
      ) : null}

      <Dialog
        open={isMobileCartOpen}
        onOpenChange={(nextOpen) => {
          setIsMobileCartOpen(nextOpen);
        }}
      >
        <DialogContent className="md:hidden">
          <DialogHeader>
            <DialogTitle>{t('public.menu.cart')}</DialogTitle>
            <DialogDescription>
              {cart.itemsCount} · {formatMoney(cart.totals.eurTotalCents, 'EUR')}
              {showBgn && cart.totals.bgnTotalCents !== null ? ` / ${formatMoney(cart.totals.bgnTotalCents, 'BGN')}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-2 overflow-auto">
            {cart.items.map((entry) => (
              <div key={entry.itemId} className="rounded border p-2 text-sm">
                <p className="font-medium">{entry.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">x{entry.qty}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto px-1 py-0 text-xs"
                    onClick={() => cart.decrement(entry.itemId)}
                  >
                    {t('public.cart.remove')}
                  </Button>
                </div>
              </div>
            ))}
            {cart.items.length === 0 ? <p className="text-sm text-muted-foreground">{t('public.cart.empty')}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" disabled={cart.items.length === 0} onClick={() => {
              setIsMobileCartOpen(false);
              setIsCheckoutOpen(true);
            }}>
              {t('public.cart.checkout')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {orderingAllowedNow ? (
        <Dialog
          open={isCheckoutOpen}
          onOpenChange={(nextOpen) => {
            setIsCheckoutOpen(nextOpen);
            if (!nextOpen) {
              setCheckoutError(null);
              setSuccessOrder(null);
            }
          }}
        >
          <DialogContent>
            {successOrder ? (
              <>
                <DialogHeader>
                  <DialogTitle>{t('public.order.successTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('public.order.successDesc')} #{successOrder.orderId} ({successOrder.status})
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" onClick={() => setIsCheckoutOpen(false)}>
                    OK
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>{t('public.checkout.title')}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={checkoutType === 'TABLE' ? 'default' : 'outline'}
                      onClick={() => setCheckoutType('TABLE')}
                    >
                      {t('public.checkout.type.table')}
                    </Button>
                    <Button
                      type="button"
                      variant={checkoutType === 'DELIVERY' ? 'default' : 'outline'}
                      onClick={() => setCheckoutType('DELIVERY')}
                    >
                      {t('public.checkout.type.delivery')}
                    </Button>
                    <Button
                      type="button"
                      variant={checkoutType === 'TAKEAWAY' ? 'default' : 'outline'}
                      onClick={() => setCheckoutType('TAKEAWAY')}
                    >
                      {t('public.checkout.type.takeaway')}
                    </Button>
                  </div>

                  {checkoutType === 'TABLE' ? (
                    <div className="space-y-2">
                      <Label htmlFor="tableCode">{t('public.checkout.tableCode')}</Label>
                      <Input id="tableCode" value={tableCode} onChange={(event) => setTableCode(event.target.value)} />
                    </div>
                  ) : null}

                  {checkoutType === 'DELIVERY' ? (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">{t('public.checkout.address')}</Label>
                      <Input id="deliveryAddress" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
                    </div>
                  ) : null}

                  {checkoutType === 'TAKEAWAY' ? <p className="text-xs text-muted-foreground">{t('public.checkout.takeawayInfo')}</p> : null}

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('public.checkout.phone')}</Label>
                    <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">{t('public.checkout.name')}</Label>
                    <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">{t('public.checkout.note')}</Label>
                    <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} />
                  </div>

                  <ApiErrorAlert error={createOrderMutation.error} />
                  {checkoutError ? <p className="text-sm text-destructive">{checkoutError}</p> : null}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    disabled={createOrderMutation.isPending || cart.items.length === 0}
                    onClick={async () => {
                      setCheckoutError(null);

                      const items = cart.items.map((entry) => ({ itemId: entry.itemId, qty: entry.qty }));

                      if (checkoutType === 'TABLE') {
                        if (!tableCode.trim()) {
                          setCheckoutError(t('public.common.error'));
                          return;
                        }

                        await createOrderMutation.mutateAsync({
                          type: 'TABLE',
                          tableCode: tableCode.trim(),
                          phone: phone.trim() || undefined,
                          customerName: customerName.trim() || undefined,
                          note: note.trim() || undefined,
                          items,
                        });

                        return;
                      }

                      if (checkoutType === 'DELIVERY') {
                        if (!deliveryAddress.trim()) {
                          setCheckoutError(t('public.common.error'));
                          return;
                        }

                        await createOrderMutation.mutateAsync({
                          type: 'DELIVERY',
                          deliveryAddress: deliveryAddress.trim(),
                          phone: phone.trim() || undefined,
                          customerName: customerName.trim() || undefined,
                          note: note.trim() || undefined,
                          items,
                        });

                        return;
                      }

                      await createOrderMutation.mutateAsync({
                        type: 'TAKEAWAY',
                        phone: phone.trim() || undefined,
                        customerName: customerName.trim() || undefined,
                        note: note.trim() || undefined,
                        items,
                      });
                    }}
                  >
                    {t('public.checkout.submit')}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </main>
  );
}

export function PublicMenuPage() {
  return (
    <ThemeProvider themeKey="standard">
      <PublicMenuContent />
    </ThemeProvider>
  );
}
