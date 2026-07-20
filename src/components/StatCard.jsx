import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../data/mockData';

/**
 * StatCard — a premium dark metric card with a positive/negative trend chip.
 *
 * Props:
 *   title, value, trend (number, signed), icon, subtitle
 */
export default function StatCard({ title, value, trend, icon: Icon, subtitle }) {
  const positive = trend >= 0;
  const glowColor = positive ? 'bg-emerald-500/15' : 'bg-rose-500/15';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40 flex justify-between items-center">
      {/* soft bottom-right glow matches status colors */}
      <div className={`pointer-events-none absolute -right-12 -bottom-12 h-36 w-36 rounded-full blur-3xl opacity-55 group-hover:opacity-90 transition-opacity duration-500 ${glowColor}`} />

      {/* Left side info */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-300">
            {Icon && <Icon size={18} strokeWidth={2} />}
          </span>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
            {formatCurrency(value)}
          </p>
          {subtitle && <p className="mt-1 text-xs font-medium text-zinc-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right side trend (large, centered vertically, no pill wrapper) */}
      <div className={`relative z-10 flex items-center gap-1.5 font-extrabold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {positive ? (
          <TrendingUp size={24} strokeWidth={2.5} />
        ) : (
          <TrendingDown size={24} strokeWidth={2.5} />
        )}
        <span className="text-xl tracking-tight font-sans">
          {positive ? '+' : '-'}{Math.abs(trend).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
