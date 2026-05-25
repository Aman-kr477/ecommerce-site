import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { createStore } from '../models/store';
import { Store } from '../models/types';

let store: Store;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  store = createStore();
  app = createApp(store);
});

async function createCartWithItem(productId = 'p1', quantity = 2) {
  const { body: cart } = await request(app).post('/api/v1/carts');
  await request(app)
    .post(`/api/v1/carts/${cart.id}/items`)
    .send({ productId, quantity });
  return cart.id;
}

describe('POST /api/v1/orders/checkout', () => {
  it('creates an order from a non-empty cart', async () => {
    const cartId = await createCartWithItem();
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.cartId).toBe(cartId);
    expect(res.body.total).toBe(7999 * 2);
    expect(res.body.discountAmount).toBe(0);
  });

  it('clears the cart after successful checkout', async () => {
    const cartId = await createCartWithItem();
    await request(app).post('/api/v1/orders/checkout').send({ cartId });

    const cartRes = await request(app).get(`/api/v1/carts/${cartId}`);
    expect(cartRes.body.items).toHaveLength(0);
    expect(cartRes.body.subtotal).toBe(0);
  });

  it('rejects checkout of an empty cart with 400', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId: cart.id });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects checkout with missing cartId with 400', async () => {
    const res = await request(app).post('/api/v1/orders/checkout').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('applies a valid discount code and computes total correctly', async () => {
    // Place 5 orders to reach the nth threshold
    for (let i = 0; i < 5; i++) {
      const cartId = await createCartWithItem();
      await request(app).post('/api/v1/orders/checkout').send({ cartId });
    }

    // Generate a discount code
    const codeRes = await request(app).post('/api/v1/admin/discount-codes/generate');
    expect(codeRes.status).toBe(201);
    const code = codeRes.body.code;

    // Use the code at checkout
    const cartId = await createCartWithItem('p1', 1);
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId, discountCode: code });

    expect(res.status).toBe(201);
    const subtotal = 7999;
    const expectedDiscount = Math.floor(subtotal * 10 / 100);
    expect(res.body.discountAmount).toBe(expectedDiscount);
    expect(res.body.total).toBe(subtotal - expectedDiscount);
  });

  it('rejects an invalid discount code with 400', async () => {
    const cartId = await createCartWithItem();
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId, discountCode: 'INVALID-CODE' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects a used discount code with 400', async () => {
    // Reach nth order threshold
    for (let i = 0; i < 5; i++) {
      const cartId = await createCartWithItem();
      await request(app).post('/api/v1/orders/checkout').send({ cartId });
    }
    const codeRes = await request(app).post('/api/v1/admin/discount-codes/generate');
    const code = codeRes.body.code;

    // Use the code once
    const cartId1 = await createCartWithItem();
    await request(app).post('/api/v1/orders/checkout').send({ cartId: cartId1, discountCode: code });

    // Try to use it again
    const cartId2 = await createCartWithItem();
    const res = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId: cartId2, discountCode: code });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/orders/:orderId', () => {
  it('returns an order by id', async () => {
    const cartId = await createCartWithItem();
    const { body: order } = await request(app)
      .post('/api/v1/orders/checkout')
      .send({ cartId });

    const res = await request(app).get(`/api/v1/orders/${order.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(order.id);
  });

  it('returns 404 for unknown order', async () => {
    const res = await request(app).get('/api/v1/orders/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
