import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  fetchCategories,
  fetchItems,
  updateCategory,
  updateItem,
} from './menu.api';
import { CategoryDialog } from './components/CategoryDialog';
import { CategoryList } from './components/CategoryList';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ItemDialog } from './components/ItemDialog';
import { ItemList } from './components/ItemList';
import type { Category, CreateCategoryDto, CreateItemDto, Item, UpdateCategoryDto, UpdateItemDto } from './menu.types';
import { useT } from '../../i18n/useT';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Separator } from '../../shared/ui/separator';
import { Skeleton } from '../../shared/ui/skeleton';

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name);
  });
}

function sortItems(items: Item[]): Item[] {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name);
  });
}

export function MenuPage() {
  const { t } = useT();
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [toggleLoadingItemId, setToggleLoadingItemId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categories = useMemo(() => sortCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);

  const itemsQuery = useQuery({
    queryKey: ['items', selectedCategoryId],
    queryFn: () => fetchItems(selectedCategoryId as string),
    enabled: Boolean(selectedCategoryId),
  });

  const items = useMemo(() => sortItems(itemsQuery.data ?? []), [itemsQuery.data]);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategoryId(null);
      return;
    }

    if (!selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
      return;
    }

    const stillExists = categories.some((category) => category.id === selectedCategoryId);
    if (!stillExists) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const categoryCreateMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async (createdCategory) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategoryId(createdCategory.id);
      setIsCategoryDialogOpen(false);
    },
  });

  const categoryUpdateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) => updateCategory(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
    },
  });

  const categoryDeleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
    },
  });

  const itemCreateMutation = useMutation({
    mutationFn: createItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items', selectedCategoryId] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
    },
  });

  const itemUpdateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateItemDto }) => updateItem(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items', selectedCategoryId] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
    },
  });

  const itemDeleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items', selectedCategoryId] });
      setItemToDelete(null);
    },
  });

  const categoryError =
    categoriesQuery.error ?? categoryCreateMutation.error ?? categoryUpdateMutation.error ?? categoryDeleteMutation.error ?? null;
  const itemError = itemsQuery.error ?? itemCreateMutation.error ?? itemUpdateMutation.error ?? itemDeleteMutation.error ?? null;

  const handleCategorySubmit = async (dto: CreateCategoryDto | UpdateCategoryDto) => {
    if (editingCategory) {
      await categoryUpdateMutation.mutateAsync({
        id: editingCategory.id,
        dto: dto as UpdateCategoryDto,
      });
      return;
    }

    await categoryCreateMutation.mutateAsync(dto as CreateCategoryDto);
  };

  const handleItemCreate = async (dto: CreateItemDto) => {
    await itemCreateMutation.mutateAsync(dto);
  };

  const handleItemUpdate = async (id: string, dto: UpdateItemDto) => {
    await itemUpdateMutation.mutateAsync({ id, dto });
  };

  const handleToggleAvailability = async (item: Item) => {
    setToggleLoadingItemId(item.id);
    try {
      await itemUpdateMutation.mutateAsync({
        id: item.id,
        dto: { isAvailable: !item.isAvailable },
      });
    } finally {
      setToggleLoadingItemId(null);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.menu.categories')}</CardTitle>
            <CardDescription>{t('admin.pageTitles.menu')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ApiErrorAlert error={categoryError} />

            {categoriesQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <CategoryList
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onCreate={() => {
                  setEditingCategory(null);
                  setIsCategoryDialogOpen(true);
                }}
                onEdit={(category) => {
                  setEditingCategory(category);
                  setIsCategoryDialogOpen(true);
                }}
                onDelete={(category) => {
                  setCategoryToDelete(category);
                }}
                disabled={
                  categoryCreateMutation.isPending || categoryUpdateMutation.isPending || categoryDeleteMutation.isPending
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.menu.items')}</CardTitle>
            <CardDescription>{selectedCategoryId ?? t('admin.menu.emptyCategories')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ApiErrorAlert error={itemError} />
            <Separator />

            {selectedCategoryId ? (
              itemsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <ItemList
                  items={items}
                  onCreate={() => {
                    setEditingItem(null);
                    setIsItemDialogOpen(true);
                  }}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setIsItemDialogOpen(true);
                  }}
                  onDelete={(item) => {
                    setItemToDelete(item);
                  }}
                  onToggleAvailability={handleToggleAvailability}
                  loadingItemId={toggleLoadingItemId}
                  disabled={
                    itemCreateMutation.isPending || itemUpdateMutation.isPending || itemDeleteMutation.isPending
                  }
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">{t('admin.menu.emptyCategories')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        mode={editingCategory ? 'edit' : 'create'}
        initialValues={
          editingCategory
            ? {
                name: editingCategory.name,
                imageUrl: editingCategory.imageUrl ?? '',
                sortOrder: editingCategory.sortOrder,
              }
            : undefined
        }
        isSubmitting={categoryCreateMutation.isPending || categoryUpdateMutation.isPending}
        onSubmit={handleCategorySubmit}
      />

      {selectedCategoryId ? (
        <ItemDialog
          open={isItemDialogOpen}
          onOpenChange={setIsItemDialogOpen}
          mode={editingItem ? 'edit' : 'create'}
          categoryId={selectedCategoryId}
          item={editingItem ?? undefined}
          isSubmitting={itemCreateMutation.isPending || itemUpdateMutation.isPending}
          error={itemCreateMutation.error ?? itemUpdateMutation.error}
          onCreate={handleItemCreate}
          onUpdate={handleItemUpdate}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToDelete(null);
          }
        }}
        title={t('admin.menu.confirmDeleteTitle')}
        description={t('admin.menu.confirmDeleteDesc')}
        confirmLabel={t('admin.menu.deleteCategory')}
        cancelLabel={t('admin.menu.actions.cancel')}
        isLoading={categoryDeleteMutation.isPending}
        onConfirm={async () => {
          if (!categoryToDelete) {
            return;
          }

          await categoryDeleteMutation.mutateAsync(categoryToDelete.id);
        }}
      />

      <ConfirmDialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setItemToDelete(null);
          }
        }}
        title={t('admin.menu.confirmDeleteTitle')}
        description={t('admin.menu.confirmDeleteDesc')}
        confirmLabel={t('admin.menu.deleteItem')}
        cancelLabel={t('admin.menu.actions.cancel')}
        isLoading={itemDeleteMutation.isPending}
        onConfirm={async () => {
          if (!itemToDelete) {
            return;
          }

          await itemDeleteMutation.mutateAsync(itemToDelete.id);
        }}
      />
    </>
  );
}
