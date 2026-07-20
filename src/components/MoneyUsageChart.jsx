import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../data/mockData';

/**
 * MoneyUsageChart — emerald income area vs. rose spend line (with neon glow).
 */
export default function MoneyUsageChart({ data }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-50">Money Usage</h3>
          <p className="text-xs font-medium text-zinc-500">Monthly spending vs. income</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px] shadow-rose-500" />
            Spending
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500" />
            Income
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <filter id="glow-rose" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} dy={8} />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 12,
              }}
              labelStyle={{ color: '#fafafa', fontWeight: 600 }}
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'spending' ? 'Spending' : 'Income',
              ]}
            />

            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              filter="url(#glow-emerald)"
            />
            <Area
              type="monotone"
              dataKey="spending"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fill="none"
              filter="url(#glow-rose)"
              activeDot={{ r: 5, fill: '#f43f5e', stroke: '#09090b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
