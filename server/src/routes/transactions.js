import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { asyncHandler, parseBody } from '../helpers.js';

const router = Router();
router.use(requireAuth);

const txSchema = z.object({
  accountId: z.string().min(1, 'Thiếu ví.'),
  // Positive = thu, negative = chi. Integer đồng (VND).
  amount: z
    .number({ invalid_type_error: 'Số tiền không hợp lệ.' })
    .int('Số tiền phải là số nguyên (đồng).')
    .refine((v) => v !== 0, 'Số tiền phải khác 0.'),
  description: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(140),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục.').max(40),
  status: z.enum(['Completed', 'Pending']).default('Completed'),
  date: z.string().min(1, 'Thiếu ngày.'),
});

// Verify the account belongs to the user.
async function assertOwnedAccount(userId, accountId) {
  const acc = await prisma.account.findFirst({ where: { id: accountId, userId } });
  return acc;
}

// GET /api/transactions?accountId=&category=&type=&search=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { accountId, category, type, search } = req.query;

    const where = { userId: req.userId };
    if (accountId) where.accountId = String(accountId);
    if (category && category !== 'All') where.category = String(category);
    // Postgres LIKE is case-sensitive; mode:'insensitive' matches any case.
    if (search) where.description = { contains: String(search), mode: 'insensitive' };

    let transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Income/expense filter is derived from amount sign.
    if (type === 'income') transactions = transactions.filter((t) => t.amount > 0);
    if (type === 'expense') transactions = transactions.filter((t) => t.amount < 0);

    res.json({ transactions });
  }),
);

// POST /api/transactions
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseBody(txSchema, req.body);
    const account = await assertOwnedAccount(req.userId, data.accountId);
    if (!account) return res.status(404).json({ error: 'Không tìm thấy ví.' });

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId,
        accountId: data.accountId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        status: data.status,
        date: new Date(data.date),
      },
    });
    res.status(201).json({ transaction });
  }),
);

// PATCH /api/transactions/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = parseBody(txSchema.partial(), req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });

    if (data.accountId && data.accountId !== existing.accountId) {
      const account = await assertOwnedAccount(req.userId, data.accountId);
      if (!account) return res.status(404).json({ error: 'Không tìm thấy ví.' });
    }

    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {}),
      },
    });
    res.json({ transaction });
  }),
);

// DELETE /api/transactions/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });

    await prisma.transaction.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  }),
);

export default router;
