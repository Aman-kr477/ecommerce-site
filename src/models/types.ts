// All monetary values are stored as integers in paise (e.g. $12.99 = 1299)

export interface Product {
  id: string;
  name: string;
  price: number;   // in paise
  stock: number;   // available quantity
}

export interface CartItem {
  productId: string;
  name: string;
  priceAtAdd: number; // unit price in paise, snapshotted at time of add
  quantity: number;   // >= 1
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number; // computed in paise: sum of priceAtAdd * quantity
}

export interface Order {
  id: string;
  cartId: string;
  items: CartItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number; // in paise, 0 if no code applied; uses Math.floor
  total: number;          // subtotal - discountAmount, in paise
  createdAt: string;      // ISO timestamp
}

export interface DiscountCode {
  code: string;           // unique alphanumeric string (SAVE-XXXX-XXXX format)
  discountPercent: number; // x% off
  used: boolean;
  createdAt: string;
}

export interface StoreConfig {
  nthOrder: number;       // every nth order triggers eligibility
  discountPercent: number; // x — percentage discount
}

export interface AnalyticsReport {
  totalItemsPurchased: number;
  totalRevenue: number;        // in paise
  discountCodes: DiscountCode[];
  totalDiscountsGiven: number; // in paise
}

export interface Store {
  products: Map<string, Product>;
  carts: Map<string, Cart>;
  orders: Map<string, Order>;
  discountCodes: Map<string, DiscountCode>;
  config: StoreConfig;
  orderCount: number;
  lastGeneratedAtOrderCount: number; // tracks which nth cycle a code was generated for
}

// Result union type used by all service methods
export type ErrorResult = { error: string; statusCode: number };
