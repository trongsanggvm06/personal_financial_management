import { useMemo } from 'react';
import {
  Cell,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
} from 'recharts';
import { formatCurrency } from '../data/mockData';

// Solid color per category — kept in sync with RecentActivity dots.
const CATEGORY_COLORS = {
  Income: '#10b981',
  Groceries: '#0ea5e9',
  Transport: '#f59e0b',
  Housing: '#8b5cf6',
  Entertainment: '#ec4899',
  Utilities: '#14b8a6',
  Transfer: '#a1a1aa',
  Investment: '#6366f1',
  Travel: '#06b6d4',
  Fees: '#f43f5e',
};

/**
 * CategoryBreakdown — total amount spent per category (expenses only) for the
 * active account, rendered as a modern donut pie chart with split annotation lists.
 */
export default function CategoryBreakdown({ transactions }) {
  const data = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      if (t.amount >= 0) return; // expenses only
      const key = t.category;
      totals[key] = (totals[key] || 0) + Math.abs(t.amount);
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        color: CATEGORY_COLORS[category] || '#71717a',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);

  // Split data into left and right annotation lists
  const leftData = useMemo(() => {
    return data.slice(0, Math.ceil(data.length / 2));
  }, [data]);

  const rightData = useMemo(() => {
    return data.slice(Math.ceil(data.length / 2));
  }, [data]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h3 className="text-base font-bold text-zinc-50 font-sans">Spending by Category</h3>
        <p className="text-xs font-medium text-zinc-500">
          Monthly distribution
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Row for Pie + Left/Right Annotations */}
        <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-4 items-center justify-center">
          {/* Left Side Annotations */}
          <div className="hidden md:flex lg:hidden xl:flex flex-col gap-2 flex-1 w-full max-w-[200px]">
            {leftData.map((item) => (
              <div key={item.category} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/30 p-2 transition hover:bg-zinc-950/70">
                <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                <span className="truncate text-[11px] font-semibold text-zinc-400">{item.category}</span>
                <span className="ml-auto text-[10px] font-bold text-zinc-200 tabular-nums">
                  {totalSpent > 0 ? `${((item.amount / totalSpent) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
            {leftData.length === 0 && <div className="text-[11px] text-zinc-600">No data</div>}
          </div>

          {/* Center Pie Chart */}
          <div className="relative h-64 w-[240px] shrink-0 flex items-center justify-center">
            {/* Center Total Overlay inside the donut hole */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Total Spent
              </span>
              <span className="text-xl font-extrabold text-zinc-50 font-sans tracking-tight">
                {formatCurrency(totalSpent)}
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={3.5}
                  dataKey="amount"
                  nameKey="category"
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(value, name) => {
                    const pct = totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(1) + '%' : '0%';
                    return [`${formatCurrency(value)} (${pct})`, `${name} · spent`];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right Side Annotations */}
          <div className="hidden md:flex lg:hidden xl:flex flex-col gap-2 flex-1 w-full max-w-[200px]">
            {rightData.map((item) => (
              <div key={item.category} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/30 p-2 transition hover:bg-zinc-950/70">
                <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: item.color }} />
                <span className="truncate text-[11px] font-semibold text-zinc-400">{item.category}</span>
                <span className="ml-auto text-[10px] font-bold text-zinc-200 tabular-nums">
                  {totalSpent > 0 ? `${((item.amount / totalSpent) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
            {rightData.length === 0 && <div className="text-[11px] text-zinc-600">No data</div>}
          </div>
        </div>

        {/* Fallback Mobile / Cramped Desktop Legend */}
        <div className="flex flex-wrap gap-2 md:hidden lg:flex xl:hidden justify-center px-1">
          {data.map((item) => (
            <div key={item.category} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/30 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-semibold text-zinc-400">{item.category}</span>
              <span className="text-[10px] font-bold text-zinc-200">
                {totalSpent > 0 ? `${((item.amount / totalSpent) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
