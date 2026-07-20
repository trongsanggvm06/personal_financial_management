import { useEffect, useState, useMemo } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '../data/mockData';

const CATEGORIES = ['Groceries', 'Transport', 'Housing', 'Entertainment', 'Utilities', 'Transfer', 'Investment', 'Travel', 'Fees', 'Income'];

const today = () => new Date().toISOString().slice(0, 10);

function ModalSelect({ label, value, options, disabled, onChange }) {
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(() => {
    return options.find((o) => o.value === value)?.label || value;
  }, [value, options]);

  return (
    <div className={`relative w-full ${disabled ? 'opacity-50' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 transition outline-none disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="truncate">{activeLabel}</span>
        {!disabled && (
          <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1.5 z-50 max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-2xl animate-fade-in custom-scrollbar">
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
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${selected ? 'text-indigo-400 bg-zinc-800/40' : 'text-zinc-300 hover:bg-zinc-800/70'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && <Check size={13} className="text-indigo-400 shrink-0" />}
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
 * NewTransactionModal — form to add a transaction to the active account.
 * Mount this with a fresh `key` per open so initial state resets cleanly.
 *
 * Props:
 *   open      boolean
 *   onClose   () => void
 *   onSubmit  (tx) => void   // tx shape: { date, description, category, amount, status }
 */
export default function NewTransactionModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState('Completed');
  const [error, setError] = useState('');

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const categoryOptions = useMemo(() => {
    return CATEGORIES.map((c) => ({ value: c, label: c }));
  }, []);

  if (!open) return null;

  const parsedAmount = parseFloat(amount);
  const valid = description.trim() && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) {
      setError('Please enter a description and a valid amount greater than zero.');
      return;
    }
    onSubmit({
      date,
      description: description.trim(),
      category: type === 'income' ? 'Income' : category,
      amount: type === 'income' ? Math.abs(parsedAmount) : -Math.abs(parsedAmount),
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-zinc-50">New Transaction</h2>
            <p className="text-xs font-medium text-zinc-500">Add an entry to this account</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${type === 'expense'
                  ? 'bg-rose-500/15 text-rose-400 ring-1 ring-inset ring-rose-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <ArrowUpRight size={15} /> Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${type === 'income'
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
                }`}
            >
              <ArrowDownLeft size={15} /> Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2.5 pl-7 pr-3 text-sm font-semibold text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Coffee at Blue Bottle"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category + Date row */}
          <div className="grid grid-cols-2 gap-2">
            <ModalSelect
              label="Category"
              value={category}
              options={categoryOptions}
              disabled={type === 'income'}
              onChange={setCategory}
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm font-medium text-zinc-100 outline-none transition focus:border-indigo-500/60 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Completed', 'Pending'].map((s) => {
                const isActive = status === s;
                const isCompleted = s === 'Completed';
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border py-2 text-sm font-semibold transition cursor-pointer ${isActive
                        ? isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4 ${valid ? '' : 'rounded-b-2xl'}`}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Transaction
          </button>
        </div>

        {/* Preview hint */}
        {valid && (
          <div className="border-t border-zinc-800 bg-zinc-950/40 px-5 py-3 text-center text-xs font-medium text-zinc-500 rounded-b-2xl">
            This will add{' '}
            <span className={type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(
                (type === 'income' ? 1 : -1) * Math.abs(parsedAmount || 0),
                { signed: true },
              )}
            </span>{' '}
            to the account.
          </div>
        )}
      </form>
    </div>
  );
}
