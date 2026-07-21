import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { asyncHandler, parseBody } from '../helpers.js';

const router = Router();
router.use(requireAuth);

const goalSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên mục tiêu.').max(80),
  targetAmount: z.number().int().positive('Số tiền mục tiêu phải lớn hơn 0.'),
  currentAmount: z.number().int().min(0).optional(),
  deadline: z.string().datetime().optional().nullable(),
  accent: z.string().trim().max(40).optional(),
});

const depositSchema = z.object({
  // Positive = nạp vào, negative = rút ra.
  amount: z.number().int().refine((v) => v !== 0, 'Số tiền phải khác 0.'),
});

// GET /api/savings — all savings goals for the user.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ goals });
  }),
);

// POST /api/savings
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(goalSchema, req.body);
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
        accent: data.accent ?? 'bg-emerald-500',
      },
    });
    res.status(201).json({ goal });
  }),
);

// PATCH /api/savings/:id — edit goal fields.
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(goalSchema.partial(), req.body);
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy mục tiêu.' });

    const goal = await prisma.savingsGoal.update({
      where: { id: existing.id },
      data: {
        ...data,
        deadline:
          data.deadline === undefined
            ? undefined
            : data.deadline
              ? new Date(data.deadline)
              : null,
      },
    });
    res.json({ goal });
  }),
);

// POST /api/savings/:id/deposit — add/withdraw from a goal (clamped to >= 0).
router.post(
  '/:id/deposit',
  asyncHandler(async (req, res) => {
    const { amount } = parseBody(depositSchema, req.body);
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy mục tiêu.' });

    const next = Math.max(0, existing.currentAmount + amount);
    const goal = await prisma.savingsGoal.update({
      where: { id: existing.id },
      data: { currentAmount: next },
    });
    res.json({ goal });
  }),
);

// DELETE /api/savings/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.savingsGoal.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy mục tiêu.' });
    await prisma.savingsGoal.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);

export default router;
