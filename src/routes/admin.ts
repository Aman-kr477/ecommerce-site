import { Router } from 'express';
import { Store } from '../models/types';
import { createDiscountController } from '../controllers/discount.controller';

export function createAdminRouter(store: Store): Router {
  const router = Router();
  const discountCtrl = createDiscountController(store);

  router.post('/discount-codes/generate', discountCtrl.generateCode);

  return router;
}
