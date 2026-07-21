import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';
import { asyncHandler, parseBody } from '../helpers.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên.').max(80),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email };
}

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = parseBody(registerSchema, req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email này đã được đăng ký.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        // Every new user gets a default wallet.
        accounts: { create: { name: 'Ví chính', accent: 'bg-indigo-500' } },
      },
    });

    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  }),
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  }),
);

// GET /api/auth/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    res.json({ user: publicUser(user) });
  }),
);

export default router;
