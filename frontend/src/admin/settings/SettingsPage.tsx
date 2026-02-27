import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useT } from '../../i18n/useT';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Skeleton } from '../../shared/ui/skeleton';
import {
  fetchRestaurantSettings,
  type OrderingSchedule,
  type RestaurantSettings,
  updateRestaurantSettings,
} from './settings.api';

type DayKey = keyof OrderingSchedule['days'];

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Пон',
  tue: 'Вто',
  wed: 'Сря',
  thu: 'Чет',
  fri: 'Пет',
  sat: 'Съб',
  sun: 'Нед',
};

function createDefaultSchedule(): OrderingSchedule {
  return {
    days: {
      mon: { enabled: true, start: '09:00', end: '20:00' },
      tue: { enabled: true, start: '09:00', end: '20:00' },
      wed: { enabled: true, start: '09:00', end: '20:00' },
      thu: { enabled: true, start: '09:00', end: '20:00' },
      fri: { enabled: true, start: '09:00', end: '20:00' },
      sat: { enabled: true, start: '09:00', end: '20:00' },
      sun: { enabled: true, start: '09:00', end: '20:00' },
    },
  };
}

function toFormState(settings: RestaurantSettings) {
  return {
    orderingVisible: settings.orderingVisible,
    orderingTimezone: settings.orderingTimezone,
    orderingSchedule: settings.orderingSchedule,
    phoneNumber: settings.phoneNumber ?? '',
    address: settings.address ?? '',
    socialFacebook: settings.socialLinks?.facebook ?? '',
    socialInstagram: settings.socialLinks?.instagram ?? '',
    socialGoogleBusiness: settings.socialLinks?.googleBusiness ?? '',
  };
}

function toNullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toSocialLinksPayload(values: {
  socialFacebook: string;
  socialInstagram: string;
  socialGoogleBusiness: string;
}) {
  const facebook = toNullableString(values.socialFacebook);
  const instagram = toNullableString(values.socialInstagram);
  const googleBusiness = toNullableString(values.socialGoogleBusiness);

  const socialLinks = {
    ...(facebook ? { facebook } : {}),
    ...(instagram ? { instagram } : {}),
    ...(googleBusiness ? { googleBusiness } : {}),
  };

  return Object.keys(socialLinks).length > 0 ? socialLinks : null;
}

export function SettingsPage() {
  const { t } = useT();
  const [successVisible, setSuccessVisible] = useState(false);
  const [contactValidationError, setContactValidationError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['admin-restaurant-settings'],
    queryFn: fetchRestaurantSettings,
    staleTime: 30_000,
  });

  const [formState, setFormState] = useState<{
    orderingVisible: boolean;
    orderingTimezone: string;
    orderingSchedule: OrderingSchedule | null;
    phoneNumber: string;
    address: string;
    socialFacebook: string;
    socialInstagram: string;
    socialGoogleBusiness: string;
  } | null>(null);

  const effectiveState = formState ?? (settingsQuery.data ? toFormState(settingsQuery.data) : null);

  const saveMutation = useMutation({
    mutationFn: updateRestaurantSettings,
    onSuccess: (data) => {
      setFormState(toFormState(data));
      settingsQuery.refetch();
      setSuccessVisible(true);
      window.setTimeout(() => setSuccessVisible(false), 2500);
    },
  });

  const scheduleEnabled = useMemo(() => Boolean(effectiveState?.orderingSchedule), [effectiveState?.orderingSchedule]);

  const contactsSchema = useMemo(
    () =>
      z.object({
        phoneNumber: z.string().max(50).optional(),
        address: z.string().max(300).optional(),
        socialFacebook: z.string().max(2048).optional(),
        socialInstagram: z.string().max(2048).optional(),
        socialGoogleBusiness: z.string().max(2048).optional(),
      }),
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.settings.title')}</CardTitle>
        <CardDescription>{t('admin.settings.schedule.title')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {settingsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : null}

        {!settingsQuery.isLoading && settingsQuery.error ? <ApiErrorAlert error={settingsQuery.error} /> : null}

        {!settingsQuery.isLoading && effectiveState ? (
          <>
            <div className="space-y-2 rounded-md border p-4">
              <Label className="text-sm">{t('admin.settings.orderingVisible')}</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effectiveState.orderingVisible}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: event.target.checked,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }))
                  }
                />
                {t('admin.settings.orderingVisible')}
              </label>
            </div>

            <div className="space-y-2 rounded-md border p-4">
              <Label htmlFor="orderingTimezone">Timezone</Label>
              <Input
                id="orderingTimezone"
                value={effectiveState.orderingTimezone}
                onChange={(event) =>
                  setFormState((current) => ({
                    orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                    orderingTimezone: event.target.value,
                    orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                    phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                    address: current?.address ?? effectiveState.address,
                    socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                    socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                    socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                  }))
                }
              />
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <Label className="text-sm">{t('admin.restaurant.contactsTitle')}</Label>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('admin.restaurant.phone')}</Label>
                <Input
                  id="phoneNumber"
                  value={effectiveState.phoneNumber}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: event.target.value,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('admin.restaurant.address')}</Label>
                <Input
                  id="address"
                  value={effectiveState.address}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: event.target.value,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialFacebook">{t('admin.restaurant.social.facebook')}</Label>
                <Input
                  id="socialFacebook"
                  value={effectiveState.socialFacebook}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: event.target.value,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialInstagram">{t('admin.restaurant.social.instagram')}</Label>
                <Input
                  id="socialInstagram"
                  value={effectiveState.socialInstagram}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: event.target.value,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialGoogleBusiness">{t('admin.restaurant.social.googleBusiness')}</Label>
                <Input
                  id="socialGoogleBusiness"
                  value={effectiveState.socialGoogleBusiness}
                  onChange={(event) =>
                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? effectiveState.orderingSchedule,
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <Label className="text-sm">{t('admin.settings.schedule.title')}</Label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!scheduleEnabled}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setFormState((current) => ({
                        orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                        orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                        orderingSchedule: null,
                        phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                        address: current?.address ?? effectiveState.address,
                        socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                        socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                        socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                      }));
                      return;
                    }

                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? createDefaultSchedule(),
                      phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                      address: current?.address ?? effectiveState.address,
                      socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                      socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                      socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                    }));
                  }}
                />
                {t('admin.settings.alwaysOpen')}
              </label>

              {scheduleEnabled && effectiveState.orderingSchedule ? (
                <div className="space-y-2">
                  {DAY_KEYS.map((dayKey) => {
                    const dayState = effectiveState.orderingSchedule!.days[dayKey];

                    return (
                      <div key={dayKey} className="grid grid-cols-[64px_120px_1fr_1fr] items-center gap-2 rounded border p-2">
                        <span className="text-sm font-medium">{DAY_LABELS[dayKey]}</span>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={dayState.enabled}
                            onChange={(event) =>
                              setFormState((current) => {
                                const schedule = current?.orderingSchedule ?? effectiveState.orderingSchedule;
                                if (!schedule) {
                                  return current ?? effectiveState;
                                }

                                return {
                                  orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                                  orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                                  orderingSchedule: {
                                    days: {
                                      ...schedule.days,
                                      [dayKey]: {
                                        ...schedule.days[dayKey],
                                        enabled: event.target.checked,
                                        start: event.target.checked
                                          ? schedule.days[dayKey].start ?? '09:00'
                                          : null,
                                        end: event.target.checked
                                          ? schedule.days[dayKey].end ?? '20:00'
                                          : null,
                                      },
                                    },
                                  },
                                  phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                                  address: current?.address ?? effectiveState.address,
                                  socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                                  socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                                  socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                                };
                              })
                            }
                          />
                          {t('admin.settings.schedule.enable')}
                        </label>

                        <Input
                          type="time"
                          disabled={!dayState.enabled}
                          value={dayState.start ?? '09:00'}
                          onChange={(event) =>
                            setFormState((current) => {
                              const schedule = current?.orderingSchedule ?? effectiveState.orderingSchedule;
                              if (!schedule) {
                                return current ?? effectiveState;
                              }

                              return {
                                orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                                orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                                orderingSchedule: {
                                  days: {
                                    ...schedule.days,
                                    [dayKey]: {
                                      ...schedule.days[dayKey],
                                      start: event.target.value,
                                    },
                                  },
                                },
                                phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                                address: current?.address ?? effectiveState.address,
                                socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                                socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                                socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                              };
                            })
                          }
                        />

                        <Input
                          type="time"
                          disabled={!dayState.enabled}
                          value={dayState.end ?? '20:00'}
                          onChange={(event) =>
                            setFormState((current) => {
                              const schedule = current?.orderingSchedule ?? effectiveState.orderingSchedule;
                              if (!schedule) {
                                return current ?? effectiveState;
                              }

                              return {
                                orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                                orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                                orderingSchedule: {
                                  days: {
                                    ...schedule.days,
                                    [dayKey]: {
                                      ...schedule.days[dayKey],
                                      end: event.target.value,
                                    },
                                  },
                                },
                                phoneNumber: current?.phoneNumber ?? effectiveState.phoneNumber,
                                address: current?.address ?? effectiveState.address,
                                socialFacebook: current?.socialFacebook ?? effectiveState.socialFacebook,
                                socialInstagram: current?.socialInstagram ?? effectiveState.socialInstagram,
                                socialGoogleBusiness: current?.socialGoogleBusiness ?? effectiveState.socialGoogleBusiness,
                              };
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <ApiErrorAlert error={saveMutation.error} />
            {contactValidationError ? <p className="text-sm text-destructive">{contactValidationError}</p> : null}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => {
                  if (!effectiveState) {
                    return;
                  }

                  const parsedContacts = contactsSchema.safeParse({
                    phoneNumber: effectiveState.phoneNumber,
                    address: effectiveState.address,
                    socialFacebook: effectiveState.socialFacebook,
                    socialInstagram: effectiveState.socialInstagram,
                    socialGoogleBusiness: effectiveState.socialGoogleBusiness,
                  });

                  if (!parsedContacts.success) {
                    setContactValidationError(t('public.common.error'));
                    return;
                  }

                  setContactValidationError(null);
                  setSuccessVisible(false);
                  saveMutation.mutate({
                    orderingVisible: effectiveState.orderingVisible,
                    orderingTimezone: effectiveState.orderingTimezone,
                    orderingSchedule: effectiveState.orderingSchedule,
                    phoneNumber: toNullableString(parsedContacts.data.phoneNumber ?? ''),
                    address: toNullableString(parsedContacts.data.address ?? ''),
                    socialLinks: toSocialLinksPayload({
                      socialFacebook: parsedContacts.data.socialFacebook ?? '',
                      socialInstagram: parsedContacts.data.socialInstagram ?? '',
                      socialGoogleBusiness: parsedContacts.data.socialGoogleBusiness ?? '',
                    }),
                  });
                }}
              >
                {t('admin.restaurant.save')}
              </Button>

              {successVisible ? <span className="text-sm text-emerald-600">✓</span> : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
