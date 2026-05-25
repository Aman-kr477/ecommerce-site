import { Request, Response } from 'express';
import { Store } from '../models/types';
import { createDiscountService } from '../services/discount';

export function createDiscountController(store: Store) {
  const discountService = createDiscountService(store);

  function generateCode(_req: Request, res: Response): void {
    const result = discountService.generateCode();
    if ('error' in result) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }
    res.status(201).json(result);
  }

  return { generateCode };
}
