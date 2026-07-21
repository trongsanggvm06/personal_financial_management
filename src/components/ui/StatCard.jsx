import { formatCurrency } from '../../data/accounts';

/**
 * StatCard — a dark metric card.
 *
 * Props:
 *   title, value (number, VND), icon, subtitle
 *   tone   'up' | 'down' | 'neutral'  — accent color of the glow/icon
 */
export default function StatCard({ title, value, icon: Icon, subtitle, tone = 'neutral' }) {
  const glow =
    tone === 'up' ? 'bg-emerald-500/15' : tone === 'down' ? 'bg-rose-500/15' : 'bg-indigo-500/15';
  const iconTone =
    tone === 'up'
      ? 'text-emerald-400'
      : tone === 'down'
        ? 'text-rose-400'
        : 'text-indigo-400';

  return (
    <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40">
      <div
        className={`pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full opacity-55 blur-3xl transition-opacity duration-500 group-hover:opacity-90 ${glow}`}
      />

      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 ${iconTone}`}
          >
            {Icon && <Icon size={18} strokeWidth={2} />}
          </span>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate font-sans text-2xl font-bold tracking-tight text-zinc-50">
            {formatCurrency(value)}
          </p>
          {subtitle && <p className="mt-1 truncate text-xs font-medium text-zinc-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
