// Seed script — demo user with Vietnamese/VND data.
// Run with: npm run seed  (or npm run setup to push schema + seed)
// Demo login: demo@demo.com / demo1234

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: build a Date at day D of a given year/month (month is 1-based).
function d(year, month, day) {
  return new Date(year, month - 1, day, 12, 0, 0);
}

async function main() {
  const email = 'demo@demo.com';

  // Fresh start: remove any existing demo user (cascades to all their data).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Người Dùng Demo',
      passwordHash,
    },
  });

  // Two wallets.
  const main = await prisma.account.create({
    data: { userId: user.id, name: 'Ví chính', accent: 'bg-indigo-500' },
  });
  const cash = await prisma.account.create({
    data: { userId: user.id, name: 'Tiền mặt', accent: 'bg-amber-500' },
  });

  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth() + 1; // 1-based current month

  // Previous month (for multi-month charts/reports).
  const prevM = M === 1 ? 12 : M - 1;
  const prevY = M === 1 ? Y - 1 : Y;
  const prev2M = prevM === 1 ? 12 : prevM - 1;
  const prev2Y = prevM === 1 ? prevY - 1 : prevY;

  // amounts in VND (đồng). Positive = thu, negative = chi.
  const tx = [
    // ----- current month -----
    { acc: main.id, date: d(Y, M, 5), amount: 18_000_000, description: 'Lương tháng — Công ty ABC', category: 'Lương', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 6), amount: -4_500_000, description: 'Tiền thuê nhà', category: 'Nhà ở', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 7), amount: -850_000, description: 'Siêu thị VinMart', category: 'Ăn uống', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 8), amount: -320_000, description: 'Đổ xăng', category: 'Di chuyển', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 10), amount: -180_000, description: 'Netflix + Spotify', category: 'Giải trí', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 12), amount: -650_000, description: 'Hóa đơn điện nước', category: 'Hóa đơn', status: 'Completed' },
    { acc: cash.id, date: d(Y, M, 2), amount: 3_000_000, description: 'Rút tiền mặt đầu tháng', category: 'Thu nhập khác', status: 'Completed' },
    { acc: cash.id, date: d(Y, M, 13), amount: -120_000, description: 'Cà phê với bạn', category: 'Ăn uống', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 14), amount: -2_000_000, description: 'Chuyển vào tiết kiệm', category: 'Tiết kiệm', status: 'Pending' },
    { acc: main.id, date: d(Y, M, 15), amount: 1_500_000, description: 'Thưởng dự án', category: 'Thưởng', status: 'Completed' },
    { acc: main.id, date: d(Y, M, 16), amount: -1_200_000, description: 'Mua quần áo', category: 'Mua sắm', status: 'Completed' },

    // ----- previous month -----
    { acc: main.id, date: d(prevY, prevM, 5), amount: 18_000_000, description: 'Lương tháng — Công ty ABC', category: 'Lương', status: 'Completed' },
    { acc: main.id, date: d(prevY, prevM, 6), amount: -4_500_000, description: 'Tiền thuê nhà', category: 'Nhà ở', status: 'Completed' },
    { acc: main.id, date: d(prevY, prevM, 9), amount: -1_100_000, description: 'Chợ + siêu thị', category: 'Ăn uống', status: 'Completed' },
    { acc: main.id, date: d(prevY, prevM, 15), amount: -900_000, description: 'Khám sức khỏe', category: 'Sức khỏe', status: 'Completed' },
    { acc: main.id, date: d(prevY, prevM, 20), amount: -450_000, description: 'Grab đi lại', category: 'Di chuyển', status: 'Completed' },
    { acc: main.id, date: d(prevY, prevM, 25), amount: -600_000, description: 'Hóa đơn điện nước', category: 'Hóa đơn', status: 'Completed' },

    // ----- two months ago -----
    { acc: main.id, date: d(prev2Y, prev2M, 5), amount: 17_500_000, description: 'Lương tháng — Công ty ABC', category: 'Lương', status: 'Completed' },
    { acc: main.id, date: d(prev2Y, prev2M, 8), amount: -4_500_000, description: 'Tiền thuê nhà', category: 'Nhà ở', status: 'Completed' },
    { acc: main.id, date: d(prev2Y, prev2M, 12), amount: -1_300_000, description: 'Ăn uống cả tháng', category: 'Ăn uống', status: 'Completed' },
    { acc: main.id, date: d(prev2Y, prev2M, 18), amount: -2_500_000, description: 'Du lịch cuối tuần', category: 'Du lịch', status: 'Completed' },
  ];

  await prisma.transaction.createMany({
    data: tx.map((t) => ({
      userId: user.id,
      accountId: t.acc,
      amount: t.amount,
      description: t.description,
      category: t.category,
      status: t.status,
      date: t.date,
    })),
  });

  // Savings goals.
  await prisma.savingsGoal.createMany({
    data: [
      { userId: user.id, name: 'Quỹ khẩn cấp', targetAmount: 50_000_000, currentAmount: 32_000_000, accent: 'bg-emerald-500', deadline: d(Y + 1, 6, 30) },
      { userId: user.id, name: 'Mua laptop mới', targetAmount: 30_000_000, currentAmount: 12_500_000, accent: 'bg-sky-500', deadline: d(Y, 12, 31) },
      { userId: user.id, name: 'Du lịch Nhật Bản', targetAmount: 60_000_000, currentAmount: 8_000_000, accent: 'bg-pink-500', deadline: d(Y + 1, 3, 1) },
    ],
  });

  // Monthly budgets (apply every month → month = null).
  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: 'Ăn uống', limit: 3_000_000, month: null },
      { userId: user.id, category: 'Di chuyển', limit: 1_000_000, month: null },
      { userId: user.id, category: 'Giải trí', limit: 500_000, month: null },
      { userId: user.id, category: 'Mua sắm', limit: 1_500_000, month: null },
      { userId: user.id, category: 'Hóa đơn', limit: 1_000_000, month: null },
    ],
  });

  console.log('✔ Seed hoàn tất. Đăng nhập demo: demo@demo.com / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
