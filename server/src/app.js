import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
import savingsRoutes from './routes/savings.js';
import budgetRoutes from './routes/budgets.js';
import reportRoutes from './routes/reports.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/reports', reportRoutes);

  // 404 for unknown API routes.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy endpoint.' }));

  // Central error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err.message || 'Lỗi máy chủ.' });
  });

  return app;
}
