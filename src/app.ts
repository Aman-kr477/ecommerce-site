import express, { Application, Request, Response, NextFunction } from 'express';
import { Store } from './models/types';
import { createProductRouter } from './routes/products';
import { createCartRouter } from './routes/carts';
import { createAdminRouter } from './routes/admin';

export function createApp(store: Store): Application {
  const app = express();

  app.use(express.json());

  // Routes
  app.use('/api/v1/products', createProductRouter(store));
  app.use('/api/v1/carts', createCartRouter(store));
  app.use('/api/v1/admin', createAdminRouter(store));

  // 404 handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
