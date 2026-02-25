import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStore';
import type { RefreshResponse } from '../auth/auth.types';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const AUTH_LOGOUT_EVENT = 'auth:logout';
const ACTIVE_RESTAURANT_STORAGE_KEY = 'fy_active_restaurant_id';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

function shouldAutoScopeAdminUrl(url: string): boolean {
  if (!url.startsWith('/admin')) {
    return false;
  }

  if (url.startsWith('/admin/restaurants')) {
    return false;
  }

  if (url.startsWith('/admin/owners')) {
    return false;
  }

  return true;
}

function mergeRestaurantIdIntoUrl(
  url: string,
  params: InternalAxiosRequestConfig['params'],
  restaurantId: string,
): { url: string; params: undefined } {
  const [path, queryString = ''] = url.split('?');
  const searchParams = new URLSearchParams(queryString);

  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => {
      searchParams.set(key, String(value));
    });
  } else if (params && typeof params === 'object') {
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      searchParams.set(key, String(value));
    });
  }

  searchParams.set('restaurantId', restaurantId);

  return {
    url: `${path}?${searchParams.toString()}`,
    params: undefined,
  };
}

function dispatchLogoutEvent() {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    dispatchLogoutEvent();
    return null;
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const activeRestaurantId = localStorage.getItem(ACTIVE_RESTAURANT_STORAGE_KEY);
  const requestUrl = config.url ?? '';

  if (activeRestaurantId && shouldAutoScopeAdminUrl(requestUrl)) {
    const merged = mergeRestaurantIdIntoUrl(requestUrl, config.params, activeRestaurantId);
    config.url = merged.url;
    config.params = merged.params;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      dispatchLogoutEvent();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextAccessToken = await refreshPromise;
    if (!nextAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

    return apiClient(originalRequest);
  },
);

export { AUTH_LOGOUT_EVENT };
