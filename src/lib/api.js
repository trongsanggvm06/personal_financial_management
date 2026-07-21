// Tiny API client for the finance backend.
// Base URL comes from VITE_API_URL (set in .env for production), defaulting to
// the local dev server.

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Module-level token, kept in sync by AuthContext. Avoids threading the token
// through every call site.
let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  const useToken = token !== undefined ? token : authToken;
  if (useToken) headers.Authorization = `Bearer ${useToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
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

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/api/auth/me', { token }),

  // Accounts
  getAccounts: () => request('/api/accounts'),
  createAccount: (payload) => request('/api/accounts', { method: 'POST', body: payload }),
  updateAccount: (id, payload) => request(`/api/accounts/${id}`, { method: 'PATCH', body: payload }),
  deleteAccount: (id) => request(`/api/accounts/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== ''),
    ).toString();
    return request(`/api/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (payload) => request('/api/transactions', { method: 'POST', body: payload }),
  updateTransaction: (id, payload) =>
    request(`/api/transactions/${id}`, { method: 'PATCH', body: payload }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),

  // Savings
  getSavings: () => request('/api/savings'),
  createGoal: (payload) => request('/api/savings', { method: 'POST', body: payload }),
  updateGoal: (id, payload) => request(`/api/savings/${id}`, { method: 'PATCH', body: payload }),
  depositGoal: (id, amount) =>
    request(`/api/savings/${id}/deposit`, { method: 'POST', body: { amount } }),
  deleteGoal: (id) => request(`/api/savings/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (month) => request(`/api/budgets${month ? `?month=${month}` : ''}`),
  saveBudget: (payload) => request('/api/budgets', { method: 'POST', body: payload }),
  deleteBudget: (id) => request(`/api/budgets/${id}`, { method: 'DELETE' }),

  // Reports
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== ''),
    ).toString();
    return request(`/api/reports/summary${qs ? `?${qs}` : ''}`);
  },
  // Returns the absolute CSV URL (auth is via query-less download — see ReportsPage).
  csvUrl: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== ''),
    ).toString();
    return `${BASE_URL}/api/reports/export.csv${qs ? `?${qs}` : ''}`;
  },
};

export { BASE_URL };
