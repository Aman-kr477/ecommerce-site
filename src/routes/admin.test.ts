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

async function createCartWithItem(productId = 'p1', quantity = 1) {
  const { body: cart } = await request(app).post('/api/v1/carts');
  await request(app)
    .post(`/api/v1/carts/${cart.id}/items`)
    .send({ productId, quantity });
  return cart.id;
}

async function placeOrders(count: number) {
  for (let i = 0; i < count; i++) {
    const cartId = await createCartWithItem();
    await request(app).post('/api/v1/orders/checkout').send({ cartId });
  }
}

describe('POST /api/v1/admin/discount-codes/generate', () => {
  it('generates a code when nth order condition is met', async () => {
    await placeOrders(5);
    const res = await request(app).post('/api/v1/admin/discount-codes/generate');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('code');
    expect(res.body.used).toBe(false);
  });

  it('rejects generation when condition is not met', async () => {
    await placeOrders(3);
    const res = await request(app).post('/api/v1/admin/discount-codes/generate');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects duplicate generation for the same cycle', async () => {
    await placeOrders(5);
    await request(app).post('/api/v1/admin/discount-codes/generate');
    const res = await request(app).post('/api/v1/admin/discount-codes/generate');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v1/admin/stats', () => {
  it('returns zero stats for empty store', async () => {
    const res = await request(app).get('/api/v1/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalItemsPurchased).toBe(0);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.totalDiscountsGiven).toBe(0);
    expect(res.body.discountCodes).toEqual([]);
  });

  it('returns correct stats after orders', async () => {
    const cartId = await createCartWithItem('p1', 2);
    await request(app).post('/api/v1/orders/checkout').send({ cartId });

    const res = await request(app).get('/api/v1/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalItemsPurchased).toBe(2);
    expect(res.body.totalRevenue).toBe(7999 * 2);
    expect(res.body.totalDiscountsGiven).toBe(0);
  });

  it('includes discount codes in stats', async () => {
    await placeOrders(5);
    await request(app).post('/api/v1/admin/discount-codes/generate');

    const res = await request(app).get('/api/v1/admin/stats');
    expect(res.body.discountCodes).toHaveLength(1);
  });
});

describe('GET /api/v1/admin/config', () => {
  it('returns the current config', async () => {
    const res = await request(app).get('/api/v1/admin/config');
    expect(res.status).toBe(200);
    expect(res.body.nthOrder).toBe(5);
    expect(res.body.discountPercent).toBe(10);
  });
});

describe('PATCH /api/v1/admin/config', () => {
  it('updates nthOrder', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/config')
      .send({ nthOrder: 3 });
    expect(res.status).toBe(200);
    expect(res.body.nthOrder).toBe(3);
  });

  it('updates discountPercent', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/config')
      .send({ discountPercent: 20 });
    expect(res.status).toBe(200);
    expect(res.body.discountPercent).toBe(20);
  });

  it('rejects invalid nthOrder', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/config')
      .send({ nthOrder: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects discountPercent > 100', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/config')
      .send({ discountPercent: 150 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
