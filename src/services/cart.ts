import { v4 as uuidv4 } from 'uuid';
import { Cart, ErrorResult, Store } from '../models/types';

function computeSubtotal(items: Cart['items']): number {
  return items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);
}

export function createCartService(store: Store) {
  function createCart(): Cart {
    const cart: Cart = { id: uuidv4(), items: [], subtotal: 0 };
    store.carts.set(cart.id, cart);
    return cart;
  }

  function getCart(cartId: string): Cart | ErrorResult {
    const cart = store.carts.get(cartId);
    if (!cart) return { error: `Cart '${cartId}' not found`, statusCode: 404 };
    return cart;
  }

  function addItem(
    cartId: string,
    productId: string,
    quantity: number
  ): Cart | ErrorResult {
    // Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: 'quantity must be an integer >= 1', statusCode: 400 };
    }

    // Validate product exists
    const product = store.products.get(productId);
    if (!product) {
      return { error: `Product '${productId}' not found`, statusCode: 404 };
    }

    const cart = store.carts.get(cartId);
    if (!cart) return { error: `Cart '${cartId}' not found`, statusCode: 404 };

    // Merge if duplicate
    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        priceAtAdd: product.price,
        quantity,
      });
    }

    cart.subtotal = computeSubtotal(cart.items);
    return cart;
  }

  function updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number
  ): Cart | ErrorResult {
    if (!Number.isInteger(quantity) || quantity < 0) {
      return { error: 'quantity must be an integer >= 0', statusCode: 400 };
    }

    const cart = store.carts.get(cartId);
    if (!cart) return { error: `Cart '${cartId}' not found`, statusCode: 404 };

    const idx = cart.items.findIndex((i) => i.productId === productId);
    if (idx === -1) {
      return { error: `Product '${productId}' not in cart`, statusCode: 404 };
    }

    if (quantity === 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = quantity;
    }

    cart.subtotal = computeSubtotal(cart.items);
    return cart;
  }

  return { createCart, getCart, addItem, updateItemQuantity };
}
