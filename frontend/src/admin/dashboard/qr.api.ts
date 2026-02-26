import { apiClient } from '../../api/apiClient';

export async function fetchMenuQrSvg(): Promise<string> {
  const { data } = await apiClient.get<string>('/admin/qr/menu', {
    responseType: 'text',
    headers: {
      Accept: 'image/svg+xml',
    },
  });

  return data;
}

export async function fetchMenuQrPng(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/admin/qr/menu?format=png', {
    responseType: 'blob',
    headers: {
      Accept: 'image/png',
    },
  });

  return data;
}
