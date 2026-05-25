import { Router } from 'express';
import { Store } from '../models/types';
import { createDiscountController } from '../controllers/discount.controller';
import { createAdminController } from '../controllers/admin.controller';

export function createAdminRouter(store: Store): Router {
  const router = Router();
  const discountCtrl = createDiscountController(store);
  const adminCtrl = createAdminController(store);

  router.post('/discount-codes/generate', discountCtrl.generateCode);
  router.get('/stats', adminCtrl.getStats);
  router.get('/config', adminCtrl.getConfig);
  router.patch('/config', adminCtrl.updateConfig);

  return router;
}
