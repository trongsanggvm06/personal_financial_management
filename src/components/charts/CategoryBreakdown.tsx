import { useMemo } from 'react';
import { Cell, ResponsiveContainer, Tooltip, PieChart, Pie } from 'recharts';
import { formatCurrency, colorFor } from '../../data/accounts';
import type { Transaction } from '../../types';

interface CategoryDatum {
  category: string;
  amount: number;
  color: string;
}

interface CategoryBreakdownProps {
  transactions?: Transaction[];
}

interface AnnotationProps {
  item: CategoryDatum;
  pct: string;
}

/**
 * CategoryBreakdown — total spent per category (expenses only) for the
 * given transactions, rendered as a donut with split annotation lists.
 */
export default function CategoryBreakdown({ transactions = [] }: CategoryBreakdownProps) {
  const data = useMemo<CategoryDatum[]>(() => {
    const totals: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.amount >= 0) return; // expenses only
      totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount, color: colorFor(category) }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalSpent = data.reduce((sum, d) => sum + d.amount, 0);
  const leftData = data.slice(0, Math.ceil(data.length / 2));
  const rightData = data.slice(Math.ceil(data.length / 2));

  const pct = (v: number) => (totalSpent > 0 ? `${((v / totalSpent) * 100).toFixed(1)}%` : '0%');

  return (
    <div id="category-breakdown" className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h3 className="text-base font-bold text-zinc-50">Chi tiêu theo danh mục</h3>
        <p className="text-xs font-medium text-zinc-500">Phân bổ trong kỳ</p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-zinc-600">
          Chưa có khoản chi nào.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row lg:flex-col xl:flex-row">
            {/* Left annotations */}
            <div className="hidden w-full max-w-[200px] flex-1 flex-col gap-2 md:flex lg:hidden xl:flex">
              {leftData.map((item) => (
                <Annotation key={item.category} item={item} pct={pct(item.amount)} />
              ))}
            </div>

            {/* Donut */}
            <div className="relative flex h-64 w-[240px] shrink-0 items-center justify-center">
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Tổng chi
                </span>
                <span className="font-sans text-lg font-extrabold tracking-tight text-zinc-50">
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
                    formatter={(value, name) => [
                      `${formatCurrency(Number(value))} (${pct(Number(value))})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right annotations */}
            <div className="hidden w-full max-w-[200px] flex-1 flex-col gap-2 md:flex lg:hidden xl:flex">
              {rightData.map((item) => (
                <Annotation key={item.category} item={item} pct={pct(item.amount)} />
              ))}
            </div>
          </div>

          {/* Fallback legend */}
          <div className="flex flex-wrap justify-center gap-2 px-1 md:hidden lg:flex xl:hidden">
            {data.map((item) => (
              <div
                key={item.category}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/30 px-2 py-1"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-semibold text-zinc-400">{item.category}</span>
                <span className="text-[10px] font-bold text-zinc-200">{pct(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Annotation({ item, pct }: AnnotationProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/30 p-2 transition hover:bg-zinc-950/70">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
      <span className="truncate text-[11px] font-semibold text-zinc-400">{item.category}</span>
      <span className="ml-auto text-[10px] font-bold tabular-nums text-zinc-200">{pct}</span>
    </div>
  );
}
