import { Router } from 'express';
import { Store } from '../models/types';
import { createOrderController } from '../controllers/order.controller';

export function createOrderRouter(store: Store): Router {
  const router = Router();
  const ctrl = createOrderController(store);

  router.post('/checkout', ctrl.checkout);
  router.get('/:orderId', ctrl.getOrder);

  return router;
}
