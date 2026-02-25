export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'COMPLETED';

export type OrderType = 'TABLE' | 'DELIVERY' | 'TAKEAWAY';

export type OrderTotals = {
  EUR: { totalCents: number };
  BGN?: { totalCents: number };
};

export type OrderTableInfo = {
  code: string;
  name?: string | null;
};

export type OrderListItem = {
  id: string;
  type: OrderType;
  status: OrderStatus;
  table?: OrderTableInfo | null;
  deliveryAddress?: string | null;
  phone?: string | null;
  customerName?: string | null;
  note?: string | null;
  createdAt: string;
  totals: OrderTotals;
};

export type OrderDetailsItem = {
  id: string;
  itemId?: string | null;
  name: string;
  qty: number;
  unitPrice: {
    EUR: { cents: number };
    BGN?: { cents: number };
  };
  note?: string | null;
};

export type OrderDetails = {
  id: string;
  type: OrderType;
  status: OrderStatus;
  table?: OrderTableInfo | null;
  deliveryAddress?: string | null;
  phone?: string | null;
  customerName?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string;
  totals: OrderTotals;
  orderItems: OrderDetailsItem[];
};

export type AdminOrdersListResponse = {
  items: OrderListItem[];
  nextCursor: string | null;
};
