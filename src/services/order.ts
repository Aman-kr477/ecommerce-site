import { v4 as uuidv4 } from 'uuid';
import { ErrorResult, Order, Store } from '../models/types';
import { createDiscountService } from './discount';

export function createOrderService(store: Store) {
  const discountService = createDiscountService(store);

  function checkout(cartId: string, discountCode?: string): Order | ErrorResult {
    // --- Phase 1: Validation (read-only) ---

    const cart = store.carts.get(cartId);
    if (!cart) {
      return { error: `Cart '${cartId}' not found`, statusCode: 404 };
    }
    if (cart.items.length === 0) {
      return { error: 'Cart is empty', statusCode: 400 };
    }

    // Validate discount code if provided
    let validatedCode = null;
    if (discountCode) {
      const codeResult = discountService.validateCode(discountCode);
      if ('error' in codeResult) {
        return codeResult;
      }
      validatedCode = codeResult;
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = store.products.get(item.productId);
      if (!product) {
        return { error: `Product '${item.productId}' no longer exists`, statusCode: 400 };
      }
      if (product.stock < item.quantity) {
        return {
          error: `Insufficient stock for '${product.name}': requested ${item.quantity}, available ${product.stock}`,
          statusCode: 400,
        };
      }
    }

    // --- Phase 2: Mutation ---

    const subtotal = cart.subtotal;
    const discountPercent = validatedCode ? validatedCode.discountPercent : 0;
    const discountAmount = validatedCode
      ? Math.floor((subtotal * discountPercent) / 100)
      : 0;
    const total = subtotal - discountAmount;

    const order: Order = {
      id: uuidv4(),
      cartId,
      items: cart.items.map((item) => ({ ...item })),
      subtotal,
      discountCode: validatedCode ? validatedCode.code : undefined,
      discountAmount,
      total,
      createdAt: new Date().toISOString(),
    };

    store.orders.set(order.id, order);
    store.orderCount += 1;

    if (validatedCode) {
      discountService.markCodeUsed(validatedCode.code);
    }

    // Deduct stock for each item
    for (const item of cart.items) {
      const product = store.products.get(item.productId);
      if (product) {
        product.stock -= item.quantity;
      }
    }

    // Clear the cart
    cart.items = [];
    cart.subtotal = 0;

    return order;
  }

  function getOrder(orderId: string): Order | ErrorResult {
    const order = store.orders.get(orderId);
    if (!order) {
      return { error: `Order '${orderId}' not found`, statusCode: 404 };
    }
    return order;
  }

  return { checkout, getOrder };
}
