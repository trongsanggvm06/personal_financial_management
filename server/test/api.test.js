import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/prisma.js';

const app = createApp();

// Unique email per run so repeated test runs don't collide.
const email = `test_${Date.now()}@example.com`;
const password = 'test1234';
let token;
let accountId;
let txId;

after(async () => {
  // Clean up the user created by this run (cascades to all owned rows).
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

test('health check responds ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('register creates a user + default wallet and returns a token', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Người Test', email, password });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, email);
  token = res.body.token;
});

test('register rejects duplicate email', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Trùng', email, password });
  assert.equal(res.status, 409);
});

test('register validates password length (Vietnamese message)', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'X', email: `x_${Date.now()}@e.com`, password: '123' });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Mật khẩu/);
});

test('login succeeds with correct credentials', async () => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test('login fails with wrong password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'wrong-pass' });
  assert.equal(res.status, 401);
});

test('protected route rejects missing token', async () => {
  const res = await request(app).get('/api/accounts');
  assert.equal(res.status, 401);
});

test('new user has a default wallet "Ví chính"', async () => {
  const res = await request(app)
    .get('/api/accounts')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.accounts.length, 1);
  assert.equal(res.body.accounts[0].name, 'Ví chính');
  accountId = res.body.accounts[0].id;
});

test('create transaction updates wallet balance', async () => {
  const income = await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      accountId,
      amount: 10_000_000,
      description: 'Lương tháng 7',
      category: 'Lương',
      date: '2026-07-01',
    });
  assert.equal(income.status, 201);
  txId = income.body.transaction.id;

  const expense = await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      accountId,
      amount: -2_500_000,
      description: 'Tiền thuê nhà',
      category: 'Nhà ở',
      date: '2026-07-02',
    });
  assert.equal(expense.status, 201);

  const accounts = await request(app)
    .get('/api/accounts')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(accounts.body.accounts[0].balance, 7_500_000);
});

test('edit transaction changes its fields', async () => {
  const res = await request(app)
    .patch(`/api/transactions/${txId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'Lương tháng 7 (đã sửa)' });
  assert.equal(res.status, 200);
  assert.equal(res.body.transaction.description, 'Lương tháng 7 (đã sửa)');
});

test('filter transactions by type=expense', async () => {
  const res = await request(app)
    .get('/api/transactions?type=expense')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.transactions.every((t) => t.amount < 0));
});

test('delete transaction removes it', async () => {
  const res = await request(app)
    .delete(`/api/transactions/${txId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  const list = await request(app)
    .get('/api/transactions')
    .set('Authorization', `Bearer ${token}`);
  assert.ok(!list.body.transactions.some((t) => t.id === txId));
});

test('savings goal: create + deposit + withdraw clamps at 0', async () => {
  const created = await request(app)
    .post('/api/savings')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Quỹ khẩn cấp', targetAmount: 50_000_000 });
  assert.equal(created.status, 201);
  const goalId = created.body.goal.id;

  const deposit = await request(app)
    .post(`/api/savings/${goalId}/deposit`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 5_000_000 });
  assert.equal(deposit.body.goal.currentAmount, 5_000_000);

  const withdraw = await request(app)
    .post(`/api/savings/${goalId}/deposit`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: -9_000_000 });
  assert.equal(withdraw.body.goal.currentAmount, 0);
});

test('budget: upsert + reports over-budget spending', async () => {
  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      accountId,
      amount: -3_000_000,
      description: 'Đi chợ',
      category: 'Ăn uống',
      date: '2026-07-10',
    });

  const created = await request(app)
    .post('/api/budgets')
    .set('Authorization', `Bearer ${token}`)
    .send({ category: 'Ăn uống', limit: 2_000_000, month: '2026-07' });
  assert.equal(created.status, 201);

  const res = await request(app)
    .get('/api/budgets?month=2026-07')
    .set('Authorization', `Bearer ${token}`);
  const b = res.body.budgets.find((x) => x.category === 'Ăn uống');
  assert.equal(b.spent, 3_000_000);
  assert.equal(b.overBudget, true);
});

test('reports summary aggregates income and expense', async () => {
  const res = await request(app)
    .get('/api/reports/summary?from=2026-01-01&to=2026-12-31')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.totals.income >= 0);
  assert.ok(res.body.totals.expense >= 0);
  assert.ok(Array.isArray(res.body.byMonth));
});

test('CSV export returns a downloadable file', async () => {
  const res = await request(app)
    .get('/api/reports/export.csv')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/csv/);
  assert.match(res.headers['content-disposition'], /giao-dich\.csv/);
});
