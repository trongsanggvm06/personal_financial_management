import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ChevronDown,
  Check,
} from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { api } from '../lib/api';
import { formatCurrency, EXPENSE_CATEGORIES, dotFor, monthKey } from '../data/accounts';

function MonthLabel({ month }) {
  const [y, m] = month.split('-');
  return <>Tháng {Number(m)}/{y}</>;
}

// ----- Budget create/edit modal -----
function BudgetModal({ open, onClose, onSaved, month, existingCategories }) {
  const available = EXPENSE_CATEGORIES.filter((c) => !existingCategories.includes(c));
  const [category, setCategory] = useState(available[0] || EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const value = Math.round(Number(limit));
  const valid = category && Number.isFinite(value) && value > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Chọn danh mục và nhập hạn mức lớn hơn 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.saveBudget({ category, limit: value, month });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Không lưu được ngân sách.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between rounded-t-2xl border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-50">Đặt hạn mức chi</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Danh mục
            </label>
            <button
              type="button"
              onClick={() => setSelectOpen(!selectOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-200 outline-none transition hover:bg-zinc-900"
            >
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dotFor(category)}`} />
                {category}
              </span>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform ${selectOpen ? 'rotate-180' : ''}`} />
            </button>
            {selectOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSelectOpen(false)} />
                <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
                  {EXPENSE_CATEGORIES.map((c) => {
                    const taken = existingCategories.includes(c);
                    const selected = c === category;
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={taken}
                        onClick={() => {
                          setCategory(c);
                          setSelectOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold transition ${
                          taken
                            ? 'cursor-not-allowed text-zinc-600'
                            : selected
                              ? 'bg-zinc-800/40 text-indigo-400'
                              : 'text-zinc-300 hover:bg-zinc-800/70'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dotFor(c)}`} />
                          {c}
                          {taken && <span className="text-[10px] text-zinc-600">(đã có)</span>}
                        </span>
                        {selected && <Check size={13} className="shrink-0 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Hạn mức tháng (₫)
            </label>
            <input
              type="number"
              min="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60"
            />
            {value > 0 && (
              <p className="mt-1 text-[11px] font-medium text-zinc-500">{formatCurrency(value)}</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!valid || saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BudgetsPage() {
  const [month] = useState(() => monthKey(new Date()));
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { budgets } = await api.getBudgets(month);
    setBudgets(budgets);
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không tải được ngân sách.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const totals = useMemo(() => {
    const limit = budgets.reduce((s, b) => s + b.limit, 0);
    const spent = budgets.reduce((s, b) => s + b.spent, 0);
    const over = budgets.filter((b) => b.overBudget).length;
    return { limit, spent, over };
  }, [budgets]);

  const existingCategories = budgets.map((b) => b.category);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteBudget(deleting.id);
      await load();
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-50">Ngân sách</h1>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            <MonthLabel month={month} /> · đã chi {formatCurrency(totals.spent)} / {formatCurrency(totals.limit)}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-[0.98]"
        >
          <Plus size={16} /> Đặt hạn mức
        </button>
      </div>

      {/* Over-budget alert */}
      {totals.over > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 text-sm font-medium text-rose-400">
          <AlertTriangle size={18} className="shrink-0" />
          Có {totals.over} danh mục đã vượt hạn mức chi trong tháng này.
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-indigo-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-400">
          {error}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Wallet size={24} />
          </span>
          <p className="text-sm font-medium text-zinc-400">
            Chưa đặt hạn mức nào. Đặt hạn mức chi để kiểm soát ngân sách theo danh mục.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const pct = b.limit > 0 ? Math.min(100, (b.spent / b.limit) * 100) : 0;
            const over = b.overBudget;
            const near = !over && pct >= 80;
            const barColor = over ? 'bg-rose-500' : near ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div
                key={b.id}
                className={`rounded-2xl border bg-zinc-900/80 p-5 shadow-lg shadow-black/20 transition ${
                  over ? 'border-rose-500/40' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${dotFor(b.category)}`} />
                    <h3 className="text-sm font-bold text-zinc-100">{b.category}</h3>
                    {over && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                        Vượt hạn mức
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleting(b)}
                    aria-label="Xóa"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className={`font-sans text-lg font-bold ${over ? 'text-rose-400' : 'text-zinc-50'}`}>
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold">
                    <span className={over ? 'text-rose-400' : near ? 'text-amber-400' : 'text-emerald-400'}>
                      {b.percent}%
                    </span>
                    <span className="text-zinc-500">
                      {b.remaining >= 0
                        ? `Còn ${formatCurrency(b.remaining)}`
                        : `Vượt ${formatCurrency(Math.abs(b.remaining))}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        month={month}
        existingCategories={existingCategories}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa hạn mức?"
        message={deleting ? `Hạn mức cho "${deleting.category}" sẽ bị xóa.` : ''}
        confirmLabel="Xóa"
        danger
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
