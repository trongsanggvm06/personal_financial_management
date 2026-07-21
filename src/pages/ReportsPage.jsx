import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, Loader2, TrendingUp, TrendingDown, Wallet, Hash } from 'lucide-react';
import { api, BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatCompact, colorFor } from '../data/accounts';

// Build the default range: first day of 6 months ago -> today.
function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

function StatBox({ icon: Icon, label, value, tone }) {
  const toneClass =
    tone === 'up' ? 'text-emerald-400' : tone === 'down' ? 'text-rose-400' : 'text-indigo-400';
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon size={16} className={toneClass} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 truncate font-sans text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const { token } = useAuth();
  const [range, setRange] = useState(defaultRange);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    const data = await api.getSummary({ from: range.from, to: range.to });
    setSummary(data);
  }, [range.from, range.to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không tải được báo cáo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Monthly series with friendly labels.
  const monthly = useMemo(() => {
    if (!summary) return [];
    return summary.byMonth.map((m) => {
      const [y, mm] = m.month.split('-');
      return { ...m, label: `Th${Number(mm)}/${y.slice(2)}` };
    });
  }, [summary]);

  // Authenticated CSV download via blob (endpoint requires Bearer token).
  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/reports/export.csv?from=${range.from}&to=${range.to}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Không tải được file CSV.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-${range.from}-den-${range.to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Không tải được file CSV.');
    } finally {
      setDownloading(false);
    }
  };

  const totals = summary?.totals || { income: 0, expense: 0, net: 0, count: 0 };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-50">Báo cáo</h1>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            Tổng hợp thu chi theo khoảng thời gian
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Từ ngày
            </label>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-100 outline-none transition focus:border-indigo-500/60 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Đến ngày
            </label>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs font-medium text-zinc-100 outline-none transition focus:border-indigo-500/60 [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={downloading || loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Xuất CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-indigo-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-400">
          {error}
        </div>
      ) : (
        <>
          {/* Stat boxes */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatBox icon={TrendingUp} label="Tổng thu" value={formatCurrency(totals.income)} tone="up" />
            <StatBox icon={TrendingDown} label="Tổng chi" value={formatCurrency(totals.expense)} tone="down" />
            <StatBox
              icon={Wallet}
              label="Chênh lệch"
              value={formatCurrency(totals.net, { signed: true })}
              tone={totals.net >= 0 ? 'up' : 'down'}
            />
            <StatBox icon={Hash} label="Số giao dịch" value={String(totals.count)} tone="neutral" />
          </div>

          {/* Monthly income/expense bar chart */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20">
            <h3 className="mb-4 text-base font-bold text-zinc-50">Thu chi theo tháng</h3>
            {monthly.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">Không có dữ liệu trong khoảng này.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} dy={8} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(63,63,70,0.25)' }}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name === 'income' ? 'Thu' : 'Chi',
                      ]}
                    />
                    <Legend
                      formatter={(value) => (value === 'income' ? 'Thu' : 'Chi')}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category breakdown table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20">
            <h3 className="mb-4 text-base font-bold text-zinc-50">Chi tiêu theo danh mục</h3>
            {summary.byCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">Chưa có khoản chi nào.</p>
            ) : (
              <div className="space-y-3">
                {summary.byCategory.map((c) => {
                  const pct = totals.expense > 0 ? (c.amount / totals.expense) * 100 : 0;
                  return (
                    <div key={c.category}>
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-300">{c.category}</span>
                        <span className="text-zinc-400 tabular-nums">
                          {formatCurrency(c.amount)} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: colorFor(c.category) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
