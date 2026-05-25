import { Request, Response } from 'express';
import { Store } from '../models/types';
import { createOrderService } from '../services/order';

export function createOrderController(store: Store) {
  const orderService = createOrderService(store);

  function checkout(req: Request, res: Response): void {
    const { cartId, discountCode } = req.body;
    if (!cartId) {
      res.status(400).json({ error: 'cartId is required' });
      return;
    }
    const result = orderService.checkout(cartId, discountCode);
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.status(201).json(result);
  }

  function getOrder(req: Request, res: Response): void {
    const result = orderService.getOrder(req.params.orderId);
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.json(result);
  }

  return { checkout, getOrder };
}
