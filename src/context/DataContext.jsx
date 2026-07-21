import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { api } from '../lib/api';

const DataContext = createContext(null);

/**
 * DataProvider — loads the user's accounts + transactions and exposes
 * mutation helpers. Savings/budgets/reports are loaded by their own pages
 * (they refetch on demand) but transaction mutations here trigger a reload
 * so balances stay correct across the app.
 */
export function DataProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [transactions, setTransactions] = useState([]);
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
        if (!cancelled) setError(err.message || 'Không tải được dữ liệu.');
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
    async (payload) => {
      await api.createTransaction(payload);
      await refreshAll();
    },
    [refreshAll],
  );

  const editTransaction = useCallback(
    async (id, payload) => {
      await api.updateTransaction(id, payload);
      await refreshAll();
    },
    [refreshAll],
  );

  const removeTransaction = useCallback(
    async (id) => {
      await api.deleteTransaction(id);
      await refreshAll();
    },
    [refreshAll],
  );

  const addAccount = useCallback(
    async (payload) => {
      const { account } = await api.createAccount(payload);
      await loadAccounts();
      setActiveAccountId(account.id);
    },
    [loadAccounts],
  );

  const value = {
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
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
