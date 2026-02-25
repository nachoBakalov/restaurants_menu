import { apiClient } from '../../api/apiClient';

export type OrderingDayConfig = {
  enabled: boolean;
  start: string | null;
  end: string | null;
};

export type OrderingSchedule = {
  days: {
    mon: OrderingDayConfig;
    tue: OrderingDayConfig;
    wed: OrderingDayConfig;
    thu: OrderingDayConfig;
    fri: OrderingDayConfig;
    sat: OrderingDayConfig;
    sun: OrderingDayConfig;
  };
};

export type RestaurantSettings = {
  orderingVisible: boolean;
  orderingTimezone: string;
  orderingSchedule: OrderingSchedule | null;
};

export type UpdateRestaurantSettingsPayload = {
  orderingVisible?: boolean;
  orderingTimezone?: string;
  orderingSchedule?: OrderingSchedule | null;
};

export async function fetchRestaurantSettings(): Promise<RestaurantSettings> {
  const { data } = await apiClient.get<RestaurantSettings>('/admin/restaurant/settings');
  return data;
}

export async function updateRestaurantSettings(
  payload: UpdateRestaurantSettingsPayload,
): Promise<RestaurantSettings> {
  const { data } = await apiClient.patch<RestaurantSettings>('/admin/restaurant/settings', payload);
  return data;
}
