import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type { Account, Transaction, TransactionPayload } from '../types';

interface DataContextValue {
  accounts: Account[];
  activeAccount: Account | null;
  activeAccountId: string | null;
  setActiveAccountId: (id: string | null) => void;
  transactions: Transaction[];
  accountTransactions: Transaction[];
  loading: boolean;
  error: string;
  refreshAll: () => Promise<void>;
  addTransaction: (payload: TransactionPayload) => Promise<void>;
  editTransaction: (id: string, payload: Partial<TransactionPayload>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addAccount: (payload: { name: string; accent?: string }) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * DataProvider — loads the user's accounts + transactions and exposes
 * mutation helpers. Savings/budgets/reports are loaded by their own pages
 * (they refetch on demand) but transaction mutations here trigger a reload
 * so balances stay correct across the app.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    const { accounts } = await api.getAccounts();
    setAccounts(accounts);
    setActiveAccountId((prev) => {
      if (prev && accounts.some((a) => a.id === prev)) return prev;
      return accounts[0]?.id ?? null;
    });
    return accounts;
  }, []);

  const loadTransactions = useCallback(async () => {
    // All transactions for the user (across accounts) — pages filter as needed.
    const { transactions } = await api.getTransactions();
    setTransactions(transactions);
    return transactions;
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadAccounts(), loadTransactions()]);
  }, [loadAccounts, loadTransactions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        await refreshAll();
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Không tải được dữ liệu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAll]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null,
    [accounts, activeAccountId],
  );

  // Transactions for the currently selected account.
  const accountTransactions = useMemo(
    () => transactions.filter((t) => t.accountId === activeAccountId),
    [transactions, activeAccountId],
  );

  // --- Mutations (reload accounts + transactions afterwards) ---

  const addTransaction = useCallback(
    async (payload: TransactionPayload) => {
      await api.createTransaction(payload);
      await refreshAll();
    },
    [refreshAll],
  );

  const editTransaction = useCallback(
    async (id: string, payload: Partial<TransactionPayload>) => {
      await api.updateTransaction(id, payload);
      await refreshAll();
    },
    [refreshAll],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await api.deleteTransaction(id);
      await refreshAll();
    },
    [refreshAll],
  );

  const addAccount = useCallback(
    async (payload: { name: string; accent?: string }) => {
      const { account } = await api.createAccount(payload);
      await loadAccounts();
      setActiveAccountId(account.id);
    },
    [loadAccounts],
  );

  const value: DataContextValue = {
    accounts,
    activeAccount,
    activeAccountId,
    setActiveAccountId,
    transactions,
    accountTransactions,
    loading,
    error,
    refreshAll,
    addTransaction,
    editTransaction,
    removeTransaction,
    addAccount,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
