import { CheckCircle2, Clock } from 'lucide-react';

/**
 * StatusBadge — subtle pill for Hoàn thành / Chờ xử lý transaction states.
 */
export default function StatusBadge({ status }) {
  const completed = status === 'Completed';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        completed
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
      }`}
    >
      {completed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      {completed ? 'Hoàn thành' : 'Chờ xử lý'}
    </span>
  );
}
