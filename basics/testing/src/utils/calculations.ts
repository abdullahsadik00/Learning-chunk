export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function applyDiscount(total: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100)
    throw new Error('Discount must be between 0 and 100');
  return total * (1 - discountPercent / 100);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  data: T[];
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
