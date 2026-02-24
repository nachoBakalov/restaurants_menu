import { apiClient } from '../../api/apiClient';
import type { Category, CreateCategoryDto, CreateItemDto, Item, UpdateCategoryDto, UpdateItemDto } from './menu.types';

type RawItem = Item & {
  priceEurCents?: number;
  priceBgnCents?: number | null;
  promoPriceEurCents?: number | null;
  promoPriceBgnCents?: number | null;
};

function normalizeItem(raw: RawItem): Item {
  const nestedPriceEur = raw.prices?.priceEurCents;
  const flatPriceEur = raw.priceEurCents;
  const priceEurCents = nestedPriceEur ?? flatPriceEur;

  const nestedPriceBgn = raw.prices?.priceBgnCents;
  const flatPriceBgn = raw.priceBgnCents;
  const priceBgnCents = nestedPriceBgn ?? flatPriceBgn;

  const nestedPromoEur = raw.promo?.promoPriceEurCents;
  const flatPromoEur = raw.promoPriceEurCents;
  const promoPriceEurCents = nestedPromoEur ?? flatPromoEur;

  const nestedPromoBgn = raw.promo?.promoPriceBgnCents;
  const flatPromoBgn = raw.promoPriceBgnCents;
  const promoPriceBgnCents = nestedPromoBgn ?? flatPromoBgn;

  return {
    ...raw,
    prices:
      typeof priceEurCents === 'number'
        ? {
            priceEurCents,
            ...(priceBgnCents !== undefined ? { priceBgnCents } : {}),
          }
        : undefined,
    promo:
      promoPriceEurCents !== undefined || promoPriceBgnCents !== undefined
        ? {
            ...(promoPriceEurCents !== undefined ? { promoPriceEurCents } : {}),
            ...(promoPriceBgnCents !== undefined ? { promoPriceBgnCents } : {}),
          }
        : undefined,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>('/admin/categories');
  return response.data;
}

export async function createCategory(dto: CreateCategoryDto): Promise<Category> {
  const response = await apiClient.post<Category>('/admin/categories', dto);
  return response.data;
}

export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
  const response = await apiClient.patch<Category>(`/admin/categories/${id}`, dto);
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`);
}

export async function fetchItems(categoryId: string): Promise<Item[]> {
  const response = await apiClient.get<RawItem[]>('/admin/items', {
    params: { categoryId },
  });
  return response.data.map((item) => normalizeItem(item));
}

export async function createItem(dto: CreateItemDto): Promise<Item> {
  const response = await apiClient.post<RawItem>('/admin/items', dto);
  return normalizeItem(response.data);
}

export async function updateItem(id: string, dto: UpdateItemDto): Promise<Item> {
  const response = await apiClient.patch<RawItem>(`/admin/items/${id}`, dto);
  return normalizeItem(response.data);
}

export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/admin/items/${id}`);
}
