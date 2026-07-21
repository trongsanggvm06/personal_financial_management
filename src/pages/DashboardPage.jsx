import { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Wallet, TrendingDown, TrendingUp, ArrowRight, BarChart3, Plus } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import SpendingChart from '../components/charts/SpendingChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import RecentActivity from '../components/ui/RecentActivity';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, monthKey } from '../data/accounts';

// Build a 6-month income/expense series for the account's transactions.
function buildSeries(transactions) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), label: `Th${d.getMonth() + 1}`, income: 0, expense: 0 });
  }
  const index = Object.fromEntries(months.map((m) => [m.key, m]));
  transactions.forEach((t) => {
    const k = monthKey(t.date);
    if (index[k]) {
      if (t.amount > 0) index[k].income += t.amount;
      else index[k].expense += Math.abs(t.amount);
    }
  });
  return months;
}

export default function DashboardPage() {
  const { openNewTransaction } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeAccount, accountTransactions } = useData();

  const series = useMemo(() => buildSeries(accountTransactions), [accountTransactions]);

  const thisMonth = monthKey(new Date());
  const monthTx = accountTransactions.filter((t) => monthKey(t.date) === thisMonth);
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spending = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - spending;

  if (!activeAccount) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-10 text-center text-sm text-zinc-500">
        Chưa có ví nào.
      </div>
    );
  }

  const actions = [
    { label: 'Thêm giao dịch', icon: Plus, primary: true, onClick: openNewTransaction },
    { label: 'Xem thu / chi', icon: ArrowRight, onClick: () => navigate('/giao-dich') },
    { label: 'Báo cáo', icon: BarChart3, onClick: () => navigate('/bao-cao') },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-500">{activeAccount.name}</p>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-50">
          Xin chào, {(user?.name || '').split(' ').slice(-1)[0] || 'bạn'} 👋
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Số dư ví"
          value={activeAccount.balance}
          icon={Wallet}
          subtitle="Số dư hiện tại của ví"
          tone={activeAccount.balance >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Thu nhập tháng này"
          value={income}
          icon={TrendingUp}
          subtitle="Tổng khoản thu trong tháng"
          tone="up"
        />
        <StatCard
          title="Chi tiêu tháng này"
          value={spending}
          icon={TrendingDown}
          subtitle={`Còn lại ${formatCurrency(net, { signed: true })}`}
          tone={net >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
              a.primary
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600'
                : 'border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <a.icon size={16} />
            {a.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SpendingChart data={series} />
        <CategoryBreakdown transactions={monthTx} />
      </div>

      {/* Recent activity */}
      <RecentActivity transactions={accountTransactions} />
    </div>
  );
}
