import { Request, Response } from 'express';
import { Store } from '../models/types';
import { createAdminService } from '../services/admin';

export function createAdminController(store: Store) {
  const adminService = createAdminService(store);

  function getStats(_req: Request, res: Response): void {
    res.json(adminService.getStats());
  }

  function getConfig(_req: Request, res: Response): void {
    res.json(adminService.getConfig());
  }

  function updateConfig(req: Request, res: Response): void {
    const { nthOrder, discountPercent } = req.body;
    const patch: { nthOrder?: number; discountPercent?: number } = {};

    if (nthOrder !== undefined) {
      if (!Number.isInteger(nthOrder) || nthOrder < 1) {
        res.status(400).json({ error: 'nthOrder must be an integer >= 1' });
        return;
      }
      patch.nthOrder = nthOrder;
    }

    if (discountPercent !== undefined) {
      if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
        res.status(400).json({ error: 'discountPercent must be a number between 0 and 100' });
        return;
      }
      patch.discountPercent = discountPercent;
    }

    res.json(adminService.updateConfig(patch));
  }

  return { getStats, getConfig, updateConfig };
}
