import { useMemo } from 'react';
import { Wallet, TrendingDown, ArrowRight, BarChart3, Plus } from 'lucide-react';
import StatCard from './ui/StatCard';
import SpendingChart from './charts/SpendingChart';
import CategoryBreakdown from './charts/CategoryBreakdown';
import RecentActivity from './ui/RecentActivity';
import { formatCurrency } from '../data/accounts';

/**
 * DashboardHome — the "Home" view: stat cards, quick actions, charts, activity.
 */
export default function DashboardHome({ account, accounts, onNavigate, onNewTransaction, searchQuery }) {
  const actions = [
    { label: 'Go to Payments', icon: ArrowRight, primary: true, onClick: () => onNavigate('payments') },
    {
      label: 'Quick Analytics', icon: BarChart3, primary: false, onClick: () => {
        document.getElementById('category-breakdown')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    { label: 'New Transaction', icon: Plus, primary: false, onClick: onNewTransaction },
  ];

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return account.transactions;
    return account.transactions.filter((tx) =>
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [account.transactions, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-500">{account.name}</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50 font-sans">
          Welcome back, {account.owner.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Stat cards — equal-height grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Balance"
          value={account.balance}
          trend={account.trend.balance}
          icon={Wallet}
          subtitle="Across selected account"
        />
        <StatCard
          title="Monthly Spending"
          value={account.monthlySpending}
          trend={account.trend.spending}
          icon={TrendingDown}
          subtitle="vs. previous month"
        />
        <StatCard
          title="Monthly Income"
          value={account.income}
          trend={((account.income - account.monthlySpending) / account.income) * 100}
          icon={BarChart3}
          subtitle={`Net ${formatCurrency(account.income - account.monthlySpending, { signed: true })} this month`}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${a.primary
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 hover:shadow-indigo-500/40'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800'
              }`}
          >
            <a.icon size={16} />
            {a.label}
          </button>
        ))}
      </div>

      {/* Side-by-side Charts (2-Column Grid on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="category-breakdown">
        {/* Spending chart */}
        <SpendingChart data={account.series} />

        {/* Category breakdown */}
        <CategoryBreakdown transactions={filteredTransactions} />
      </div>

      {/* Recent activity */}
      <RecentActivity accounts={accounts} searchQuery={searchQuery} />
    </div>
  );
}
