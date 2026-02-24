import { apiClient } from '../../api/apiClient';
import type { Category, CreateCategoryDto, CreateItemDto, Item, UpdateCategoryDto, UpdateItemDto } from './menu.types';

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
  const response = await apiClient.get<Item[]>('/admin/items', {
    params: { categoryId },
  });
  return response.data;
}

export async function createItem(dto: CreateItemDto): Promise<Item> {
  const response = await apiClient.post<Item>('/admin/items', dto);
  return response.data;
}

export async function updateItem(id: string, dto: UpdateItemDto): Promise<Item> {
  const response = await apiClient.patch<Item>(`/admin/items/${id}`, dto);
  return response.data;
}

export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/admin/items/${id}`);
}
