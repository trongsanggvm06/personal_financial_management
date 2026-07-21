import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate, dotFor } from '../../data/accounts';

/**
 * RecentActivity — the most recent transactions for the given list.
 * Expects transactions with { id, date, description, category, amount }.
 */
export default function RecentActivity({ transactions = [], limit = 6 }) {
  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }, [transactions, limit]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-zinc-50">Hoạt động gần đây</h3>
          <p className="text-xs font-medium text-zinc-500">Giao dịch mới nhất</p>
        </div>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400">
          {recent.length} mục
        </span>
      </div>

      {recent.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-zinc-600">Chưa có giao dịch nào.</div>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {recent.map((t) => {
            const positive = t.amount > 0;
            return (
              <div
                key={t.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-zinc-800/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {positive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-zinc-100">
                    {t.description}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotFor(t.category)}`} />
                    {t.category} · {formatDate(t.date)}
                  </span>
                </div>

                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    positive ? 'text-emerald-400' : 'text-zinc-200'
                  }`}
                >
                  {formatCurrency(t.amount, { signed: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
