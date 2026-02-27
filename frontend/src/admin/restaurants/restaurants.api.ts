import { apiClient } from '../../api/apiClient';

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    googleBusiness?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type RestaurantsResponse = {
  items: Restaurant[];
  nextCursor: string | null;
};

export type UpdateRestaurantDto = {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    googleBusiness?: string;
  } | null;
};

export type CreateWithOwnerDto = {
  restaurantName: string;
  slug: string;
  email: string;
  password: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    googleBusiness?: string;
  } | null;
};

export type CreateWithOwnerResponse = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    coverImageUrl?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      googleBusiness?: string;
    } | null;
    createdAt?: string;
    updatedAt?: string;
  };
  owner?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
  };
};

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data } = await apiClient.get<RestaurantsResponse>('/admin/restaurants');
  return data.items;
}

export async function updateRestaurant(id: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
  const { data } = await apiClient.patch<Restaurant>(`/admin/restaurants/${id}`, dto);
  return data;
}

export async function createWithOwner(dto: CreateWithOwnerDto): Promise<CreateWithOwnerResponse> {
  const { data } = await apiClient.post<CreateWithOwnerResponse>('/admin/restaurants/create-with-owner', dto);
  return data;
}
