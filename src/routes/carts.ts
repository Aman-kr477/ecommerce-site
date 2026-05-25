import { Router } from 'express';
import { Store } from '../models/types';
import { createCartController } from '../controllers/cart.controller';

export function createCartRouter(store: Store): Router {
  const router = Router();
  const ctrl = createCartController(store);

  router.post('/', ctrl.createCart);
  router.get('/:cartId', ctrl.getCart);
  router.post('/:cartId/items', ctrl.addItem);
  router.patch('/:cartId/items/:productId', ctrl.updateItemQuantity);

  return router;
}
