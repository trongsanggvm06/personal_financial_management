import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../data/mockData';
import StatusBadge from './StatusBadge';

const categoryDot = {
  Income: 'bg-emerald-500',
  Groceries: 'bg-sky-500',
  Transport: 'bg-amber-500',
  Housing: 'bg-violet-500',
  Entertainment: 'bg-pink-500',
  Utilities: 'bg-teal-500',
  Transfer: 'bg-zinc-400',
  Investment: 'bg-indigo-500',
  Travel: 'bg-cyan-500',
  Fees: 'bg-rose-500',
};

/**
 * RecentActivity — condensed dark table of the 5 most recent transactions across all accounts.
 */
export default function RecentActivity({ accounts, searchQuery }) {
  const recent = useMemo(() => {
    // 1. Gather all transactions across all accounts
    const all = accounts.flatMap((acc) =>
      acc.transactions.map((t) => ({
        ...t,
        accountName: acc.name,
        accountAccent: acc.accent,
      }))
    );

    // 2. Sort by date desc
    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Filter by search query if present
    if (!searchQuery) return all.slice(0, 5);
    
    const query = searchQuery.toLowerCase();
    return all
      .filter((t) =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.accountName.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [accounts, searchQuery]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-zinc-50">Recent Activity</h3>
          <p className="text-xs font-medium text-zinc-500">Across all accounts</p>
        </div>
        <span className="text-xs font-semibold rounded-full bg-zinc-850 px-2 py-0.5 text-zinc-400">
          Last 5 entries
        </span>
      </div>

      <div className="divide-y divide-zinc-800/70">
        {recent.map((t, i) => {
          const positive = t.amount > 0;
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-zinc-800/40"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  positive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {positive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {t.description}
                  </p>
                  <span className="inline-flex items-center rounded-md bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-zinc-700/50">
                    {t.accountName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${categoryDot[t.category] || 'bg-zinc-500'}`} />
                  {t.category}
                  <span className="text-zinc-700">·</span>
                  <span>
                    {new Date(t.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <StatusBadge status={t.status} />
              <p
                className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${
                  positive ? 'text-emerald-400' : 'text-zinc-200'
                }`}
              >
                {formatCurrency(t.amount, { signed: true })}
              </p>
            </div>
          );
        })}
        {recent.length === 0 && (
          <div className="px-5 py-8 text-center text-sm font-medium text-zinc-500">
            No recent activity found.
          </div>
        )}
      </div>
    </div>
  );
}
