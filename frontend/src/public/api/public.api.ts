import axios from 'axios';
import type {
  CreatePublicOrderPayload,
  CreatePublicOrderResponse,
  PublicMenuResponse,
  PublicRestaurant,
} from './public.types';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const publicClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchPublicRestaurant(slug: string): Promise<PublicRestaurant> {
  const { data } = await publicClient.get<PublicRestaurant>(`/public/restaurants/${slug}`);
  return data;
}

export async function fetchPublicMenu(slug: string): Promise<PublicMenuResponse> {
  const { data } = await publicClient.get<PublicMenuResponse>(`/public/restaurants/${slug}/menu`);
  return data;
}

export async function createPublicOrder(
  slug: string,
  payload: CreatePublicOrderPayload,
): Promise<CreatePublicOrderResponse> {
  const { data } = await publicClient.post<CreatePublicOrderResponse>(`/public/restaurants/${slug}/orders`, payload);
  return data;
}
