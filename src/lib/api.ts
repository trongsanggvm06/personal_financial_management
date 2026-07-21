// Tiny API client for the finance backend.
// Base URL comes from VITE_API_URL (set in .env for production), defaulting to
// the local dev server.

import type {
  AuthResponse,
  MeResponse,
  AccountsResponse,
  AccountResponse,
  TransactionsResponse,
  TransactionResponse,
  SavingsResponse,
  SavingsGoalResponse,
  BudgetsResponse,
  BudgetResponse,
  ReportSummary,
  TransactionPayload,
  SavingsGoalPayload,
  BudgetPayload,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Module-level token, kept in sync by AuthContext. Avoids threading the token
// through every call site.
let authToken: string | null = null;

export function setAuthToken(token: string | null | undefined): void {
  authToken = token || null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T = unknown>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const useToken = token !== undefined ? token : authToken;
  if (useToken) headers.Authorization = `Bearer ${useToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Không thể kết nối tới máy chủ. Kiểm tra backend đã chạy chưa.', 0);
  }

  if (!res.ok) {
    let message = 'Đã có lỗi xảy ra.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

type QueryParams = Record<string, string | number | null | undefined>;

function toQuery(params: QueryParams): string {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: payload }),
  me: (token?: string | null) => request<MeResponse>('/api/auth/me', { token }),

  // Accounts
  getAccounts: () => request<AccountsResponse>('/api/accounts'),
  createAccount: (payload: { name: string; accent?: string }) =>
    request<AccountResponse>('/api/accounts', { method: 'POST', body: payload }),
  updateAccount: (id: string, payload: { name?: string; accent?: string }) =>
    request<AccountResponse>(`/api/accounts/${id}`, { method: 'PATCH', body: payload }),
  deleteAccount: (id: string) =>
    request<{ ok: true }>(`/api/accounts/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params: QueryParams = {}) =>
    request<TransactionsResponse>(`/api/transactions${toQuery(params)}`),
  createTransaction: (payload: TransactionPayload) =>
    request<TransactionResponse>('/api/transactions', { method: 'POST', body: payload }),
  updateTransaction: (id: string, payload: Partial<TransactionPayload>) =>
    request<TransactionResponse>(`/api/transactions/${id}`, { method: 'PATCH', body: payload }),
  deleteTransaction: (id: string) =>
    request<{ ok: true }>(`/api/transactions/${id}`, { method: 'DELETE' }),

  // Savings
  getSavings: () => request<SavingsResponse>('/api/savings'),
  createGoal: (payload: SavingsGoalPayload) =>
    request<SavingsGoalResponse>('/api/savings', { method: 'POST', body: payload }),
  updateGoal: (id: string, payload: Partial<SavingsGoalPayload>) =>
    request<SavingsGoalResponse>(`/api/savings/${id}`, { method: 'PATCH', body: payload }),
  depositGoal: (id: string, amount: number) =>
    request<SavingsGoalResponse>(`/api/savings/${id}/deposit`, {
      method: 'POST',
      body: { amount },
    }),
  deleteGoal: (id: string) =>
    request<{ ok: true }>(`/api/savings/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (month?: string) =>
    request<BudgetsResponse>(`/api/budgets${month ? `?month=${month}` : ''}`),
  saveBudget: (payload: BudgetPayload) =>
    request<BudgetResponse>('/api/budgets', { method: 'POST', body: payload }),
  deleteBudget: (id: string) =>
    request<{ ok: true }>(`/api/budgets/${id}`, { method: 'DELETE' }),

  // Reports
  getSummary: (params: QueryParams = {}) =>
    request<ReportSummary>(`/api/reports/summary${toQuery(params)}`),
  // Returns the absolute CSV URL (auth is via query-less download — see ReportsPage).
  csvUrl: (params: QueryParams = {}) => `${BASE_URL}/api/reports/export.csv${toQuery(params)}`,
};

export { BASE_URL };
