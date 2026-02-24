import { Pencil, Trash2 } from 'lucide-react';
import type { Category } from '../menu.types';
import { useT } from '../../../i18n/useT';
import { Button } from '../../../shared/ui/button';
import { cn } from '../../../shared/ui/cn';

type CategoryListProps = {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  onCreate: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  disabled?: boolean;
};

export function CategoryList({ categories, selectedCategoryId, onSelect, onCreate, onEdit, onDelete, disabled = false }: CategoryListProps) {
  const { t } = useT();

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={onCreate} disabled={disabled}>
        {t('admin.menu.newCategory')}
      </Button>

      {categories.length === 0 ? <p className="text-sm text-muted-foreground">{t('admin.menu.emptyCategories')}</p> : null}

      <div className="space-y-2">
        {categories.map((category) => {
          const isActive = category.id === selectedCategoryId;

          return (
            <div
              key={category.id}
              className={cn(
                'flex items-center gap-2 rounded-md border p-2',
                isActive ? 'border-primary bg-primary/10' : 'border-border bg-background',
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm"
                onClick={() => onSelect(category.id)}
                disabled={disabled}
              >
                {category.name}
              </button>

              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(category)} disabled={disabled}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onDelete(category)} disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
