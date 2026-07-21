import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import cors from 'cors';
import { config } from './config.js';
import type { HttpError } from './helpers.js';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import savingsRoutes from './routes/savings.js';
import budgetRoutes from './routes/budgets.js';
import reportRoutes from './routes/reports.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/reports', reportRoutes);

  // 404 for unknown API routes.
  app.use('/api', (_req: Request, res: Response) =>
    res.status(404).json({ error: 'Không tìm thấy endpoint.' }),
  );

  // Central error handler.
  app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.message || 'Lỗi máy chủ.' });
  });

  return app;
}
