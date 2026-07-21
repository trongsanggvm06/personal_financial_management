import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PiggyBank,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Target,
  Calendar,
} from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../data/accounts';

const ACCENTS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-violet-500',
];

// ----- Goal create/edit modal -----
function GoalModal({ open, onClose, onSaved, initial }) {
  const editing = Boolean(initial);
  const [name, setName] = useState(initial?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    initial ? String(initial.targetAmount) : '',
  );
  const [currentAmount, setCurrentAmount] = useState(
    initial ? String(initial.currentAmount) : '0',
  );
  const [deadline, setDeadline] = useState(
    initial?.deadline ? new Date(initial.deadline).toISOString().slice(0, 10) : '',
  );
  const [accent, setAccent] = useState(initial?.accent || ACCENTS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const target = Math.round(Number(targetAmount));
  const current = Math.round(Number(currentAmount || 0));
  const valid = name.trim() && Number.isFinite(target) && target > 0 && current >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Vui lòng nhập tên và số tiền mục tiêu hợp lệ.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        targetAmount: target,
        currentAmount: current,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        accent,
      };
      if (editing) await api.updateGoal(initial.id, payload);
      else await api.createGoal(payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Không lưu được mục tiêu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between rounded-t-2xl border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-50">
            {editing ? 'Sửa mục tiêu' : 'Mục tiêu tiết kiệm mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tên mục tiêu
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Quỹ khẩn cấp"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Mục tiêu (₫)
              </label>
              <input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Đã có (₫)
              </label>
              <input
                type="number"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Hạn hoàn thành (tùy chọn)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 outline-none transition focus:border-indigo-500/60 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Màu
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccent(a)}
                  className={`h-8 w-8 rounded-lg ${a} transition ${
                    accent === a ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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
            {editing ? 'Lưu' : 'Tạo mục tiêu'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----- Deposit / withdraw modal -----
function DepositModal({ open, goal, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('in'); // in | out
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !goal) return null;

  const value = Math.round(Number(amount));
  const valid = Number.isFinite(value) && value > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Nhập số tiền lớn hơn 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.depositGoal(goal.id, direction === 'in' ? value : -value);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thực hiện được.');
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
          <div>
            <h2 className="text-base font-bold text-zinc-50">{goal.name}</h2>
            <p className="text-xs font-medium text-zinc-500">
              Đã có {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => setDirection('in')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                direction === 'in'
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Nạp vào
            </button>
            <button
              type="button"
              onClick={() => setDirection('out')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                direction === 'out'
                  ? 'bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Rút ra
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Số tiền (₫)
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SavingsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { goals } = await api.getSavings();
    setGoals(goals);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không tải được mục tiêu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const totals = useMemo(() => {
    const saved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    return { saved, target };
  }, [goals]);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteGoal(deleting.id);
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
          <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-50">Tiết kiệm</h1>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            Đã tiết kiệm {formatCurrency(totals.saved)} / {formatCurrency(totals.target)}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-[0.98]"
        >
          <Plus size={16} /> Mục tiêu mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-indigo-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-400">
          {error}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <PiggyBank size={24} />
          </span>
          <p className="text-sm font-medium text-zinc-400">
            Chưa có mục tiêu tiết kiệm nào. Tạo mục tiêu đầu tiên của bạn!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
            const done = g.currentAmount >= g.targetAmount;
            return (
              <div
                key={g.id}
                className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg shadow-black/20 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${g.accent}`}>
                      <Target size={18} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-zinc-100">{g.name}</h3>
                      {g.deadline && (
                        <p className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                          <Calendar size={11} /> {formatDate(g.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(g);
                        setModalOpen(true);
                      }}
                      aria-label="Sửa"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-indigo-400"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting(g)}
                      aria-label="Xóa"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-sans text-lg font-bold text-zinc-50">
                      {formatCurrency(g.currentAmount)}
                    </span>
                    <span className="text-xs font-medium text-zinc-500">
                      / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        done ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${done ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {pct.toFixed(0)}%{done ? ' · Hoàn thành 🎉' : ''}
                    </span>
                    <button
                      onClick={() => setDepositGoal(g)}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      Nạp / Rút
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
      <DepositModal
        open={Boolean(depositGoal)}
        goal={depositGoal}
        onClose={() => setDepositGoal(null)}
        onSaved={load}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa mục tiêu?"
        message={deleting ? `"${deleting.name}" sẽ bị xóa vĩnh viễn.` : ''}
        confirmLabel="Xóa"
        danger
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
