import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { asyncHandler, parseBody, monthKey } from '../helpers.js';

const router = Router();
router.use(requireAuth);

const budgetSchema = z.object({
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục.').max(40),
  limit: z.number().int().positive('Hạn mức phải lớn hơn 0.'),
  // "YYYY-MM" or null (applies every month).
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Tháng không hợp lệ.')
    .optional()
    .nullable(),
});

// GET /api/budgets?month=YYYY-MM — budgets with actual spending for the month.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '')
      ? req.query.month
      : monthKey(new Date());

    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        OR: [{ month }, { month: null }],
      },
      orderBy: { category: 'asc' },
    });

    // Sum this user's expenses in the target month, grouped by category.
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    const tx = await prisma.transaction.findMany({
      where: {
        userId: req.userId,
        amount: { lt: 0 },
        date: { gte: start, lt: end },
      },
    });
    const spentByCategory = {};
    for (const t of tx) {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(t.amount);
    }

    const result = budgets.map((b) => {
      const spent = spentByCategory[b.category] || 0;
      return {
        ...b,
        spent,
        remaining: b.limit - spent,
        percent: b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0,
        overBudget: spent > b.limit,
      };
    });

    res.json({ month, budgets: result });
  }),
);

// POST /api/budgets — create or update (upsert on category+month).
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(budgetSchema, req.body);
    const month = data.month ?? null;

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: { userId: req.userId, category: data.category, month },
      },
      update: { limit: data.limit },
      create: { userId: req.userId, category: data.category, limit: data.limit, month },
    });
    res.status(201).json({ budget });
  }),
);

// DELETE /api/budgets/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.budget.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy ngân sách.' });
    await prisma.budget.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);

export default router;
