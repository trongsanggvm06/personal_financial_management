import { Router } from 'express';
import { z } from 'zod';
import type { Transaction } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { asyncHandler, parseBody } from '../helpers.js';

const router = Router();
router.use(requireAuth);

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên ví.').max(80),
  accent: z.string().trim().max(40).optional(),
});

// Compute the current balance of an account from its transactions.
function balanceOf(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

// GET /api/accounts — accounts with derived balance + basic monthly stats.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = await prisma.account.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      include: { transactions: true },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = accounts.map((acc) => {
      const monthTx = acc.transactions.filter((t) => new Date(t.date) >= monthStart);
      const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const spending = monthTx
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      return {
        id: acc.id,
        name: acc.name,
        accent: acc.accent,
        balance: balanceOf(acc.transactions),
        monthlyIncome: income,
        monthlySpending: spending,
      };
    });

    res.json({ accounts: result });
  }),
);

// POST /api/accounts
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(accountSchema, req.body);
    const account = await prisma.account.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json({ account });
  }),
);

// PATCH /api/accounts/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(accountSchema.partial(), req.body);
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy ví.' });

    const account = await prisma.account.update({
      where: { id: existing.id },
      data,
    });
    res.json({ account });
  }),
);

// DELETE /api/accounts/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy ví.' });

    const count = await prisma.account.count({ where: { userId: req.userId } });
    if (count <= 1) {
      return res.status(400).json({ error: 'Phải giữ lại ít nhất một ví.' });
    }

    await prisma.account.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);

export default router;
