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

describe('POST /api/v1/carts', () => {
  it('creates a new cart with empty items and zero subtotal', async () => {
    const res = await request(app).post('/api/v1/carts');
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.items).toEqual([]);
    expect(res.body.subtotal).toBe(0);
  });
});

describe('GET /api/v1/carts/:cartId', () => {
  it('returns the cart by id', async () => {
    const createRes = await request(app).post('/api/v1/carts');
    const cartId = createRes.body.id;

    const res = await request(app).get(`/api/v1/carts/${cartId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(cartId);
  });

  it('returns 404 for unknown cart', async () => {
    const res = await request(app).get('/api/v1/carts/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/v1/carts/:cartId/items', () => {
  it('adds an item to the cart and returns updated cart', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    const res = await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productId).toBe('p1');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.subtotal).toBe(7999 * 2);
  });

  it('merges duplicate items by incrementing quantity', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 1 });
    const res = await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(4);
  });

  it('rejects quantity < 1 with 400', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    const res = await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects missing productId with 400', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    const res = await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects unknown productId with 404', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    const res = await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'unknown', quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('PATCH /api/v1/carts/:cartId/items/:productId', () => {
  it('updates item quantity', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 2 });

    const res = await request(app)
      .patch(`/api/v1/carts/${cart.id}/items/p1`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
  });

  it('removes item when quantity is 0', async () => {
    const { body: cart } = await request(app).post('/api/v1/carts');
    await request(app)
      .post(`/api/v1/carts/${cart.id}/items`)
      .send({ productId: 'p1', quantity: 2 });

    const res = await request(app)
      .patch(`/api/v1/carts/${cart.id}/items/p1`)
      .send({ quantity: 0 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.subtotal).toBe(0);
  });
});
