import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
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

type CheckoutType = 'TABLE' | 'DELIVERY';

function formatMoney(cents: number, currency: 'EUR' | 'BGN'): string {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
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

function formatAllergens(allergens: string | string[] | null | undefined): string | null {
  if (Array.isArray(allergens)) {
    const values = allergens.map((entry) => entry.trim()).filter(Boolean);
    return values.length > 0 ? values.join(', ') : null;
  }

  if (typeof allergens === 'string') {
    const value = allergens.trim();
    return value.length > 0 ? value : null;
  }

  return null;
}

function PublicMenuContent() {
  const { slug } = useParams();
  const { t } = useT();
  const { theme } = usePublicTheme();
  const cart = useCart();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<CheckoutType>('TABLE');
  const [tableCode, setTableCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ orderId: string; status: string } | null>(null);

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
  const orderingEnabled = Boolean(restaurant?.features.ORDERING);
  const showBgn = Boolean(restaurant?.currency.bgnActiveNow);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (cart.items.length === 0 && isCheckoutOpen) {
      setIsCheckoutOpen(false);
    }
  }, [cart.items.length, isCheckoutOpen]);

  useEffect(() => {
    if (cart.items.length === 0 && isMobileCartOpen) {
      setIsMobileCartOpen(false);
    }
  }, [cart.items.length, isMobileCartOpen]);

  const heroStyle = useMemo(
    () => ({
      backgroundImage: restaurant?.coverImageUrl ? `linear-gradient(to top, rgba(0,0,0,0.50), rgba(0,0,0,0.15)), url(${restaurant.coverImageUrl})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    [restaurant?.coverImageUrl],
  );

  if (!slug) {
    return <p className="p-6 text-sm text-muted-foreground">{t('public.common.error')}</p>;
  }

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t('public.common.loading')}</p>;
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
          className={`${theme.heroClassName} overflow-hidden transition-all duration-300`}
          style={heroStyle}
        >
          <div className={`p-5 md:p-8 ${restaurant.coverImageUrl ? 'text-white' : ''}`}>
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
                <h1 className="text-2xl font-semibold md:text-3xl">{restaurant.name}</h1>
                {/* <p className={`text-sm ${restaurant.coverImageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>/{restaurant.slug}</p> */}
              </div>
            </div>
          </div>
        </section>

        <section className="sticky top-0 z-10 mt-4 border-y bg-background/95 py-3 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={activeCategoryId === category.id ? 'default' : 'outline'}
                onClick={() => {
                  setActiveCategoryId(category.id);
                  document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>

        <div className={`mt-5 ${theme.spacingClassName} pb-24 md:pb-8`}>
          {categories.map((category) => (
            <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold md:text-xl">{category.name}</h2>
                <Badge variant="secondary">{category.items.length}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {category.items.map((item) => (
                  <Card key={item.id} className={`${theme.cardClassName} transition-transform duration-200 hover:-translate-y-0.5`}>
                    <CardContent className="space-y-3 p-4">
                      {(() => {
                        const allergensText = formatAllergens(item.allergens as string | string[] | null | undefined);

                        return (
                          <>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="h-40 w-full rounded-md object-cover"
                        />
                      ) : null}

                      <div className="space-y-1">
                        <h3 className="text-base font-semibold">{item.name}</h3>
                        {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                        {allergensText ? (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {t('public.menu.allergensLabel')}: {allergensText}
                          </p>
                        ) : null}
                      </div>

                      <PriceBlock item={item} showBgn={showBgn} />

                      <div className="flex items-center justify-between gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                          {t('admin.menu.editItem')}
                        </Button>

                        {orderingEnabled ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={!item.isAvailable}
                            onClick={() =>
                              cart.addItem({
                                itemId: item.id,
                                name: item.name,
                                unitPrice: {
                                  eurCents: item.pricing.prices.EUR.currentCents,
                                  bgnCents: showBgn ? (item.pricing.prices.BGN?.currentCents ?? null) : null,
                                },
                                qty: 1,
                              })
                            }
                          >
                            {t('public.menu.add')}
                          </Button>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {orderingEnabled && cart.items.length > 0 ? (
        <>
          <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="min-w-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsMobileCartOpen(true)}>
                  {t('public.menu.cart')}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {cart.itemsCount} · {formatMoney(cart.totals.eurTotalCents, 'EUR')}
                  {showBgn && cart.totals.bgnTotalCents !== null ? ` / ${formatMoney(cart.totals.bgnTotalCents, 'BGN')}` : ''}
                </p>
              </div>
              <Button type="button" disabled={cart.items.length === 0} onClick={() => setIsCheckoutOpen(true)}>
                {t('public.menu.order')}
              </Button>
            </div>
          </div>

          <aside className="fixed right-6 top-24 z-20 hidden w-80 rounded-xl border bg-background p-4 shadow-sm md:block">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{t('public.menu.cart')}</h3>
              <Badge variant="secondary">{cart.itemsCount}</Badge>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto">
              {cart.items.map((entry) => (
                <div key={entry.itemId} className="rounded border p-2 text-sm">
                  <p className="font-medium">{entry.name}</p>
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
                {t('public.menu.order')}
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
              {t('public.menu.order')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedItem(null);
            setItemQty(1);
          }
        }}
      >
        <DialogContent>
          {selectedItem ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
                <DialogDescription>{selectedItem.description ?? selectedItem.allergens ?? ''}</DialogDescription>
              </DialogHeader>

              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} loading="lazy" className="h-48 w-full rounded-md object-cover" />
              ) : null}

              {formatAllergens(selectedItem.allergens as string | string[] | null | undefined) ? (
                <p className="text-sm text-muted-foreground">
                  {t('public.menu.allergensLabel')}: {formatAllergens(selectedItem.allergens as string | string[] | null | undefined)}
                </p>
              ) : null}

              <PriceBlock item={selectedItem} showBgn={showBgn} />

              {orderingEnabled ? (
                <DialogFooter className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setItemQty((current) => Math.max(1, current - 1))}>-</Button>
                    <span className="w-6 text-center">{itemQty}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setItemQty((current) => current + 1)}>+</Button>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      cart.addItem({
                        itemId: selectedItem.id,
                        name: selectedItem.name,
                        unitPrice: {
                          eurCents: selectedItem.pricing.prices.EUR.currentCents,
                          bgnCents: showBgn ? (selectedItem.pricing.prices.BGN?.currentCents ?? null) : null,
                        },
                        qty: itemQty,
                      });
                      setSelectedItem(null);
                      setItemQty(1);
                    }}
                  >
                    {t('public.menu.add')}
                  </Button>
                </DialogFooter>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

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
                <div className="flex gap-2">
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
                </div>

                {checkoutType === 'TABLE' ? (
                  <div className="space-y-2">
                    <Label htmlFor="tableCode">{t('public.checkout.tableCode')}</Label>
                    <Input id="tableCode" value={tableCode} onChange={(event) => setTableCode(event.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">{t('public.checkout.address')}</Label>
                    <Input id="deliveryAddress" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
                  </div>
                )}

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
                  }}
                >
                  {t('public.checkout.submit')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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
