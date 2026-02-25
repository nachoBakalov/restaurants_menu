import { useMemo, useState } from 'react';
import type { CartItem, CartTotals } from './cart.types';

type AddCartItemInput = {
  itemId: string;
  name: string;
  unitPrice: {
    eurCents: number;
    bgnCents: number | null;
  };
  qty?: number;
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (input: AddCartItemInput) => {
    const qtyToAdd = Math.max(1, input.qty ?? 1);

    setItems((current) => {
      const existing = current.find((entry) => entry.itemId === input.itemId);
      if (existing) {
        return current.map((entry) =>
          entry.itemId === input.itemId ? { ...entry, qty: entry.qty + qtyToAdd } : entry,
        );
      }

      return [
        ...current,
        {
          itemId: input.itemId,
          name: input.name,
          unitPrice: {
            eurCents: input.unitPrice.eurCents,
            bgnCents: input.unitPrice.bgnCents,
          },
          qty: qtyToAdd,
        },
      ];
    });
  };

  const increment = (itemId: string) => {
    setItems((current) =>
      current.map((entry) => (entry.itemId === itemId ? { ...entry, qty: entry.qty + 1 } : entry)),
    );
  };

  const decrement = (itemId: string) => {
    setItems((current) =>
      current
        .map((entry) => (entry.itemId === itemId ? { ...entry, qty: entry.qty - 1 } : entry))
        .filter((entry) => entry.qty > 0),
    );
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((entry) => entry.itemId !== itemId));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo<CartTotals>(() => {
    const eurTotalCents = items.reduce((sum, entry) => sum + entry.unitPrice.eurCents * entry.qty, 0);

    const canComputeBgn = items.every((entry) => entry.unitPrice.bgnCents !== null);

    if (!canComputeBgn) {
      return { eurTotalCents, bgnTotalCents: null };
    }

    const bgnTotalCents = items.reduce(
      (sum, entry) => sum + (entry.unitPrice.bgnCents ?? 0) * entry.qty,
      0,
    );

    return { eurTotalCents, bgnTotalCents };
  }, [items]);

  const itemsCount = useMemo(() => items.reduce((sum, entry) => sum + entry.qty, 0), [items]);

  return {
    items,
    addItem,
    increment,
    decrement,
    removeItem,
    clearCart,
    remove: removeItem,
    clear: clearCart,
    totals,
    itemsCount,
  };
}
