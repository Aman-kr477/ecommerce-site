import { Request, Response } from 'express';
import { Store } from '../models/types';

export function createProductController(store: Store) {
  function listProducts(_req: Request, res: Response): void {
    res.json(Array.from(store.products.values()));
  }

  function getProduct(req: Request, res: Response): void {
    const product = store.products.get(req.params.id);
    if (!product) {
      res.status(404).json({ error: `Product '${req.params.id}' not found` });
      return;
    }
    res.json(product);
  }

  return { listProducts, getProduct };
}
