// Shared domain types for the finance app frontend.
// These mirror the JSON shapes returned by the backend API (see server/src/routes).

export type TransactionStatus = 'Completed' | 'Pending';

/** Authenticated user (public fields only). */
export interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Account as returned by GET /api/accounts — includes derived balance and
 * monthly stats. Creating an account (POST) returns the raw row without the
 * derived fields, so those are optional.
 */
export interface Account {
  id: string;
  name: string;
  accent: string;
  balance?: number;
  monthlyIncome?: number;
  monthlySpending?: number;
  userId?: string;
  createdAt?: string;
}

/** A single income/expense transaction. Amount in VND (positive = thu). */
export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  status: TransactionStatus;
  date: string;
  createdAt?: string;
}

/** Payload for creating/editing a transaction. */
export interface TransactionPayload {
  accountId: string;
  amount: number;
  description: string;
  category: string;
  status: TransactionStatus;
  date: string;
}

/** A savings goal. */
export interface SavingsGoal {
  id: string;
  userId?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  accent: string;
  createdAt?: string;
}

export interface SavingsGoalPayload {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | null;
  accent?: string;
}

/** A budget row with computed spending, as returned by GET /api/budgets. */
export interface Budget {
  id: string;
  userId?: string;
  category: string;
  limit: number;
  month: string | null;
  spent: number;
  remaining: number;
  percent: number;
  overBudget: boolean;
}

export interface BudgetPayload {
  category: string;
  limit: number;
  month?: string | null;
}

/** Report summary aggregates (GET /api/reports/summary). */
export interface CategoryTotal {
  category: string;
  amount: number;
}

export interface MonthTotal {
  month: string;
  income: number;
  expense: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  totals: {
    income: number;
    expense: number;
    net: number;
    count: number;
  };
  byCategory: CategoryTotal[];
  byMonth: MonthTotal[];
}

// --- API response envelopes ---
export interface AuthResponse {
  token: string;
  user: User;
}
export interface MeResponse {
  user: User;
}
export interface AccountsResponse {
  accounts: Account[];
}
export interface AccountResponse {
  account: Account;
}
export interface TransactionsResponse {
  transactions: Transaction[];
}
export interface TransactionResponse {
  transaction: Transaction;
}
export interface SavingsResponse {
  goals: SavingsGoal[];
}
export interface SavingsGoalResponse {
  goal: SavingsGoal;
}
export interface BudgetsResponse {
  month: string;
  budgets: Budget[];
}
export interface BudgetResponse {
  budget: Budget;
}

/** Context provided by DashboardLayout's <Outlet> to child pages. */
export interface OutletContext {
  openNewTransaction: () => void;
}
