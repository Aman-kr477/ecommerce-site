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

describe('GET /api/products', () => {
  it('returns all seeded products', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
  });

  it('each product has id, name, price, stock', async () => {
    const res = await request(app).get('/api/v1/products');
    for (const p of res.body) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('price');
      expect(p).toHaveProperty('stock');
    }
  });
});

describe('GET /api/products/:id', () => {
  it('returns a product by id', async () => {
    const res = await request(app).get('/api/v1/products/p1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
    expect(res.body.name).toBe('Wireless Headphones');
  });

  it('returns 404 for unknown product', async () => {
    const res = await request(app).get('/api/v1/products/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
