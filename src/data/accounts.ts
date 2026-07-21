// Shared formatting + category metadata for the app.
// (Mock account data was removed — the app now reads real data from the API.)
// Kept at this path so existing `formatCurrency` imports keep working.

interface FormatCurrencyOptions {
  signed?: boolean;
}

// Format an integer amount of Vietnamese đồng (VND) as currency.
export const formatCurrency = (value: number, opts: FormatCurrencyOptions = {}): string => {
  const { signed = false } = opts;
  const abs = Math.abs(Math.round(value)).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
  if (signed) {
    return `${value < 0 ? '−' : '+'}${abs}`;
  }
  return value < 0 ? `−${abs}` : abs;
};

// Compact form for chart axes, e.g. 18.000.000 -> "18tr", 500.000 -> "500k".
export const formatCompact = (value: number): string => {
  const v = Math.abs(value);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
};

// Format a YYYY-MM-DD (or ISO) date as dd/mm/yyyy.
export const formatDate = (value: string | number | Date): string => {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString('vi-VN');
};

// "YYYY-MM" for a Date.
export const monthKey = (date: string | number | Date = new Date()): string => {
  const dt = new Date(date);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

export const INCOME_CATEGORIES = ['Lương', 'Thưởng', 'Thu nhập khác'];

export const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Nhà ở',
  'Giải trí',
  'Hóa đơn',
  'Mua sắm',
  'Sức khỏe',
  'Du lịch',
  'Tiết kiệm',
  'Chi khác',
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// Whether a category is an income category (positive amount).
export const isIncomeCategory = (category: string): boolean =>
  INCOME_CATEGORIES.includes(category);

// Hex colors (charts) keyed by category.
export const CATEGORY_COLORS: Record<string, string> = {
  'Lương': '#10b981',
  'Thưởng': '#14b8a6',
  'Thu nhập khác': '#22c55e',
  'Ăn uống': '#0ea5e9',
  'Di chuyển': '#f59e0b',
  'Nhà ở': '#8b5cf6',
  'Giải trí': '#ec4899',
  'Hóa đơn': '#06b6d4',
  'Mua sắm': '#6366f1',
  'Sức khỏe': '#f43f5e',
  'Du lịch': '#d946ef',
  'Tiết kiệm': '#3b82f6',
  'Chi khác': '#71717a',
};

// Tailwind background classes keyed by category (dots).
export const CATEGORY_DOT: Record<string, string> = {
  'Lương': 'bg-emerald-500',
  'Thưởng': 'bg-teal-500',
  'Thu nhập khác': 'bg-green-500',
  'Ăn uống': 'bg-sky-500',
  'Di chuyển': 'bg-amber-500',
  'Nhà ở': 'bg-violet-500',
  'Giải trí': 'bg-pink-500',
  'Hóa đơn': 'bg-cyan-500',
  'Mua sắm': 'bg-indigo-500',
  'Sức khỏe': 'bg-rose-500',
  'Du lịch': 'bg-fuchsia-500',
  'Tiết kiệm': 'bg-blue-500',
  'Chi khác': 'bg-zinc-400',
};

export const colorFor = (category: string): string =>
  CATEGORY_COLORS[category] || '#71717a';
export const dotFor = (category: string): string =>
  CATEGORY_DOT[category] || 'bg-zinc-400';
