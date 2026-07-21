import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronDown,
  Check,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import NewTransactionModal from '../components/ui/NewTransactionModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useData } from '../context/DataContext';
import {
  formatCurrency,
  formatDate,
  ALL_CATEGORIES,
  dotFor,
} from '../data/accounts';

function FilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const activeLabel = useMemo(
    () => options.find((o) => o.value === value)?.label || value,
    [options, value],
  );

  return (
    <div className="relative w-full">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 active:scale-[0.98]"
      >
        <span className="truncate">{activeLabel}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
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
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
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

export default function TransactionsPage() {
  const { openNewTransaction } = useOutletContext();
  const {
    activeAccount,
    accountTransactions,
    accounts,
    activeAccountId,
    editTransaction,
    removeTransaction,
  } = useData();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all | income | expense
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [editing, setEditing] = useState(null); // transaction being edited
  const [deleting, setDeleting] = useState(null); // transaction being deleted
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return accountTransactions.filter((t) => {
      if (typeFilter === 'income' && t.amount <= 0) return false;
      if (typeFilter === 'expense' && t.amount >= 0) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.description.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [accountTransactions, typeFilter, categoryFilter, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else expense += Math.abs(t.amount);
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await removeTransaction(deleting.id);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-zinc-50">Thu / Chi</h1>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            {activeAccount?.name} · {filtered.length} giao dịch
          </p>
        </div>
        <button
          onClick={openNewTransaction}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-[0.98]"
        >
          <Plus size={16} /> Thêm giao dịch
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Thu</p>
          <p className="mt-1 font-sans text-lg font-bold text-emerald-400">
            {formatCurrency(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Chi</p>
          <p className="mt-1 font-sans text-lg font-bold text-rose-400">
            {formatCurrency(totals.expense)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Chênh lệch
          </p>
          <p
            className={`mt-1 font-sans text-lg font-bold ${
              totals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(totals.net, { signed: true })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Tìm kiếm
          </span>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung hoặc danh mục..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-9 pr-3 text-xs font-medium text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <FilterSelect
          label="Loại"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'income', label: 'Thu' },
            { value: 'expense', label: 'Chi' },
          ]}
        />
        <FilterSelect
          label="Danh mục"
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: 'All', label: 'Tất cả danh mục' },
            ...ALL_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {/* Transaction list */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/20">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-500">
            Không có giao dịch nào khớp bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70">
            {filtered.map((t) => {
              const positive = t.amount > 0;
              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors duration-200 hover:bg-zinc-800/40 sm:px-5"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      positive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {positive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{t.description}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotFor(t.category)}`} />
                        {t.category}
                      </span>
                      <span className="text-[11px] text-zinc-600">·</span>
                      <span className="text-[11px] font-medium text-zinc-500">
                        {formatDate(t.date)}
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={t.status} />

                  <span
                    className={`shrink-0 font-sans text-sm font-bold tabular-nums ${
                      positive ? 'text-emerald-400' : 'text-zinc-200'
                    }`}
                  >
                    {formatCurrency(t.amount, { signed: true })}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setEditing(t)}
                      aria-label="Sửa"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-indigo-400"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleting(t)}
                      aria-label="Xóa"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <NewTransactionModal
          open
          initial={editing}
          accounts={accounts}
          defaultAccountId={activeAccountId}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await editTransaction(editing.id, payload);
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xóa giao dịch?"
        message={
          deleting
            ? `"${deleting.description}" (${formatCurrency(deleting.amount, { signed: true })}) sẽ bị xóa vĩnh viễn.`
            : ''
        }
        confirmLabel="Xóa"
        danger
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
