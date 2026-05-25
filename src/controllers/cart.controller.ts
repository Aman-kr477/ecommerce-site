import { Request, Response } from 'express';
import { Store } from '../models/types';
import { createCartService } from '../services/cart';

export function createCartController(store: Store) {
  const cartService = createCartService(store);

  function createCart(_req: Request, res: Response): void {
    const cart = cartService.createCart();
    res.status(201).json(cart);
  }

  function getCart(req: Request, res: Response): void {
    const result = cartService.getCart(req.params.cartId);
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.json(result);
  }

  function addItem(req: Request, res: Response): void {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      res.status(400).json({ error: 'productId and quantity are required' });
      return;
    }
    const result = cartService.addItem(req.params.cartId, productId, quantity);
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.json(result);
  }

  function updateItemQuantity(req: Request, res: Response): void {
    const { quantity } = req.body;
    if (quantity === undefined) {
      res.status(400).json({ error: 'quantity is required' });
      return;
    }
    const result = cartService.updateItemQuantity(
      req.params.cartId,
      req.params.productId,
      quantity
    );
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.json(result);
  }

  return { createCart, getCart, addItem, updateItemQuantity };
}
