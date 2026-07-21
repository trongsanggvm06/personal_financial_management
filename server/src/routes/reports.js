import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { asyncHandler, monthKey } from '../helpers.js';

const router = Router();
router.use(requireAuth);

// GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Aggregate totals + per-category + per-month series for the range (default: this year).
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(now.getFullYear(), 0, 1);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const tx = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });

    let income = 0;
    let expense = 0;
    const byCategory = {};
    const byMonth = {};

    for (const t of tx) {
      if (t.amount > 0) income += t.amount;
      else expense += Math.abs(t.amount);

      // Category breakdown (expenses only).
      if (t.amount < 0) {
        byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
      }

      // Monthly income/expense series.
      const key = monthKey(t.date);
      if (!byMonth[key]) byMonth[key] = { month: key, income: 0, expense: 0 };
      if (t.amount > 0) byMonth[key].income += t.amount;
      else byMonth[key].expense += Math.abs(t.amount);
    }

    res.json({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      totals: { income, expense, net: income - expense, count: tx.length },
      byCategory: Object.entries(byCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      byMonth: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
    });
  }),
);

// GET /api/reports/export.csv?from=&to= — download all transactions as CSV.
router.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const where = { userId: req.userId };
    if (req.query.from || req.query.to) {
      where.date = {};
      if (req.query.from) where.date.gte = new Date(String(req.query.from));
      if (req.query.to) where.date.lte = new Date(String(req.query.to));
    }

    const tx = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { account: { select: { name: true } } },
    });

    const esc = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['Ngay', 'Noi dung', 'Danh muc', 'Vi', 'So tien (VND)', 'Trang thai'];
    const rows = tx.map((t) =>
      [
        new Date(t.date).toISOString().slice(0, 10),
        t.description,
        t.category,
        t.account?.name ?? '',
        t.amount,
        t.status,
      ]
        .map(esc)
        .join(','),
    );

    // Prepend UTF-8 BOM so Excel opens Vietnamese text correctly.
    const csv = '﻿' + [header.join(','), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="giao-dich.csv"');
    res.send(csv);
  }),
);

export default router;
