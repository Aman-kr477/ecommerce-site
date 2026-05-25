import { Router } from 'express';
import { Store } from '../models/types';
import { createProductController } from '../controllers/product.controller';

export function createProductRouter(store: Store): Router {
  const router = Router();
  const ctrl = createProductController(store);

  router.get('/', ctrl.listProducts);
  router.get('/:id', ctrl.getProduct);

  return router;
}
