import { useEffect, useState, useMemo } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ChevronDown, Check, Loader2 } from 'lucide-react';
import {
  formatCurrency,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  isIncomeCategory,
} from '../../data/accounts';

const today = () => new Date().toISOString().slice(0, 10);

function Select({ label, value, options, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const activeLabel = useMemo(
    () => options.find((o) => o.value === value)?.label || value,
    [options, value],
  );

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-200 outline-none transition hover:bg-zinc-900 disabled:cursor-not-allowed"
      >
        <span className="truncate">{activeLabel}</span>
        {!disabled && (
          <ChevronDown
            size={14}
            className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold transition ${
                    selected ? 'bg-zinc-800/40 text-indigo-400' : 'text-zinc-300 hover:bg-zinc-800/70'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && <Check size={13} className="shrink-0 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * NewTransactionModal — add or edit a transaction.
 * Mount with a fresh `key` per open so initial state resets cleanly.
 *
 * Props:
 *   open, onClose, onSubmit(payload)
 *   accounts        [{ id, name }]
 *   defaultAccountId
 *   initial         existing transaction (edit mode) or null (add mode)
 */
export default function NewTransactionModal({
  open,
  onClose,
  onSubmit,
  accounts = [],
  defaultAccountId,
  initial = null,
}) {
  const editing = Boolean(initial);

  const [type, setType] = useState(
    initial ? (initial.amount >= 0 ? 'income' : 'expense') : 'expense',
  );
  const [amount, setAmount] = useState(initial ? String(Math.abs(initial.amount)) : '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(
    initial?.category || EXPENSE_CATEGORIES[0],
  );
  const [accountId, setAccountId] = useState(
    initial?.accountId || defaultAccountId || accounts[0]?.id || '',
  );
  const [date, setDate] = useState(
    initial ? new Date(initial.date).toISOString().slice(0, 10) : today(),
  );
  const [status, setStatus] = useState(initial?.status || 'Completed');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Switch type and snap the category to a valid one for that type.
  const changeType = (next) => {
    setType(next);
    if (next === 'income' && !isIncomeCategory(category)) {
      setCategory(INCOME_CATEGORIES[0]);
    } else if (next === 'expense' && isIncomeCategory(category)) {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  if (!open) return null;

  const parsedAmount = Math.round(Number(amount));
  const valid =
    description.trim() && Number.isFinite(parsedAmount) && parsedAmount > 0 && accountId;

  const categoryOptions = (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
    (c) => ({ value: c, label: c }),
  );
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Vui lòng nhập nội dung và số tiền lớn hơn 0.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        accountId,
        date: new Date(date).toISOString(),
        description: description.trim(),
        category,
        amount: type === 'income' ? Math.abs(parsedAmount) : -Math.abs(parsedAmount),
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Không lưu được giao dịch.');
    } finally {
      setSubmitting(false);
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
          <div>
            <h2 className="text-base font-bold text-zinc-50">
              {editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}
            </h2>
            <p className="text-xs font-medium text-zinc-500">
              {editing ? 'Cập nhật thông tin giao dịch' : 'Thêm một khoản thu hoặc chi'}
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
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => changeType('expense')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight size={15} /> Chi
            </button>
            <button
              type="button"
              onClick={() => changeType('income')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft size={15} /> Thu
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Số tiền (₫)
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2.5 pl-3 pr-12 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                ₫
              </span>
            </div>
            {parsedAmount > 0 && (
              <p className="mt-1 text-[11px] font-medium text-zinc-500">
                {formatCurrency(parsedAmount)}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Nội dung
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Ăn trưa, tiền điện..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category + Account */}
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Danh mục"
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            />
            <Select
              label="Ví"
              value={accountId}
              options={accountOptions}
              onChange={setAccountId}
            />
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 outline-none transition focus:border-indigo-500/60 [color-scheme:dark]"
              />
            </div>
            <Select
              label="Trạng thái"
              value={status}
              options={[
                { value: 'Completed', label: 'Hoàn thành' },
                { value: 'Pending', label: 'Chờ xử lý' },
              ]}
              onChange={setStatus}
            />
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
            disabled={!valid || submitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {editing ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </button>
        </div>
      </form>
    </div>
  );
}
