export type CartPrice = {
  eurCents: number;
  bgnCents: number | null;
};

export type CartItem = {
  itemId: string;
  name: string;
  unitPrice: CartPrice;
  qty: number;
};

export type CartTotals = {
  eurTotalCents: number;
  bgnTotalCents: number | null;
};
