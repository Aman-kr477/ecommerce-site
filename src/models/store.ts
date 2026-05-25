import { Store } from './types';

export function createStore(): Store {
  const products = new Map([
    ['p1', { id: 'p1', name: 'Wireless Headphones', price: 7999, stock: 50 }],
    ['p2', { id: 'p2', name: 'Mechanical Keyboard', price: 12999, stock: 30 }],
    ['p3', { id: 'p3', name: 'USB-C Hub', price: 3499, stock: 100 }],
    ['p4', { id: 'p4', name: 'Webcam HD', price: 5999, stock: 25 }],
    ['p5', { id: 'p5', name: 'Mouse Pad XL', price: 1499, stock: 200 }],
  ]);

  return {
    products,
    carts: new Map(),
    orders: new Map(),
    discountCodes: new Map(),
    config: {
      nthOrder: 5,
      discountPercent: 10,
    },
    orderCount: 0,
    lastGeneratedAtOrderCount: 0,
  };
}
