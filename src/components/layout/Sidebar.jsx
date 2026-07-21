import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  BarChart3,
  Check,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';
import { formatCurrency } from '../../data/accounts';

const NAV = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/giao-dich', label: 'Thu / Chi', icon: ArrowLeftRight },
  { to: '/tiet-kiem', label: 'Tiết kiệm', icon: PiggyBank },
  { to: '/ngan-sach', label: 'Ngân sách', icon: Wallet },
  { to: '/bao-cao', label: 'Báo cáo', icon: BarChart3 },
];

/**
 * Sidebar — persistent (desktop) or drawer (mobile) navigation.
 * Uses react-router NavLinks, an account switcher, and user/logout footer.
 */
export default function Sidebar({
  collapsed,
  onToggle,
  accounts,
  activeAccount,
  onSelectAccount,
  user,
  onLogout,
  onNavigate,
  mobile = false,
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Mobile drawer never collapses.
  const isCollapsed = mobile ? false : collapsed;

  useEffect(() => {
    const handler = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <aside
      className={`relative ${mobile ? 'flex' : 'hidden lg:flex'} h-screen shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/95 backdrop-blur transition-all duration-300 ${
        isCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* Logo / toggle */}
      <div className="group/logo relative flex h-[68px] items-center px-4">
        <div className="flex flex-1 items-center gap-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
            <Wallet size={18} />
          </span>
          {!isCollapsed && (
            <span className="truncate text-sm font-bold tracking-tight text-zinc-50">
              Tài Chính
            </span>
          )}
        </div>

        {!mobile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            className="absolute right-[-14px] top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 opacity-0 shadow-lg transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 group-hover/logo:opacity-100"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Account switcher */}
      {activeAccount && (
        <div className="px-3 pb-2" ref={switcherRef}>
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className={`flex w-full items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-left transition hover:bg-zinc-900 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${activeAccount.accent}`}
              >
                {activeAccount.name.slice(0, 1).toUpperCase()}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-bold text-zinc-100">
                      {activeAccount.name}
                    </span>
                    <span className="truncate text-[11px] font-medium text-zinc-500 tabular-nums">
                      {formatCurrency(activeAccount.balance)}
                    </span>
                  </span>
                  <ChevronsUpDown size={14} className="shrink-0 text-zinc-500" />
                </>
              )}
            </button>

            {switcherOpen && !isCollapsed && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl">
                {accounts.map((acc) => {
                  const selected = acc.id === activeAccount.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSelectAccount(acc.id);
                        setSwitcherOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                        selected ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/70'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white ${acc.accent}`}
                      >
                        {acc.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs font-semibold text-zinc-200">
                          {acc.name}
                        </span>
                        <span className="truncate text-[10px] font-medium text-zinc-500 tabular-nums">
                          {formatCurrency(acc.balance)}
                        </span>
                      </span>
                      {selected && <Check size={13} className="shrink-0 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/25'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-3">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200">
            {(user?.name || '?').slice(0, 1).toUpperCase()}
          </span>
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-bold text-zinc-100">{user?.name}</span>
              <span className="truncate text-[11px] font-medium text-zinc-500">{user?.email}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
