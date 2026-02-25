import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
  };
}

export function SettingsPage() {
  const { t } = useT();
  const [successVisible, setSuccessVisible] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['admin-restaurant-settings'],
    queryFn: fetchRestaurantSettings,
    staleTime: 30_000,
  });

  const [formState, setFormState] = useState<{
    orderingVisible: boolean;
    orderingTimezone: string;
    orderingSchedule: OrderingSchedule | null;
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
                  }))
                }
              />
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
                      }));
                      return;
                    }

                    setFormState((current) => ({
                      orderingVisible: current?.orderingVisible ?? effectiveState.orderingVisible,
                      orderingTimezone: current?.orderingTimezone ?? effectiveState.orderingTimezone,
                      orderingSchedule: current?.orderingSchedule ?? createDefaultSchedule(),
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

            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => {
                  if (!effectiveState) {
                    return;
                  }

                  setSuccessVisible(false);
                  saveMutation.mutate({
                    orderingVisible: effectiveState.orderingVisible,
                    orderingTimezone: effectiveState.orderingTimezone,
                    orderingSchedule: effectiveState.orderingSchedule,
                  });
                }}
              >
                {t('admin.settings.save')}
              </Button>

              {successVisible ? <span className="text-sm text-emerald-600">✓</span> : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
