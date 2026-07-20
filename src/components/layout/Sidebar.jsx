import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  CreditCard,
  Check,
  ChevronsUpDown,
  Search,
} from 'lucide-react';
import viteLogo from '../../assets/vite.svg';

const NAV = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

/**
 * Sidebar — persistent, collapsible (compact <-> expanded).
 * The toggle chevron fades in on hover over the logo area.
 */
export default function Sidebar({
  collapsed,
  onToggle,
  activePage,
  onNavigate,
  accounts,
  activeAccount,
  onSelectAccount,
  searchQuery,
  onSearchChange,
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close the account switcher on outside click.
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
      className={`relative hidden lg:flex h-screen shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80 backdrop-blur transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-64'
        }`}
    >
      {/* Logo / toggle area */}
      <div className="group/logo relative flex h-[68px] items-center px-4">
        {/* Logo wrapper */}
        <div className="flex flex-1 items-center gap-3 py-2 cursor-pointer">
          <img
            src={viteLogo}
            alt="Lumen"
            className={`h-9 w-9 shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          />

          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-fade-in">
              <span className="truncate text-sm font-bold tracking-tight text-zinc-50">Lumen</span>
            </div>
          )}
        </div>

        {/* Hover-revealed toggle button — anchored to the right border of the sidebar in both states */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute right-[-14px] top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 opacity-0 shadow-lg transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 group-hover/logo:opacity-100 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight size={14} className="translate-x-[0.5px]" />
          ) : (
            <ChevronLeft size={14} className="-translate-x-[0.5px]" />
          )}
        </button>
      </div>

      {/* Integrated Search Bar */}
      <div className="px-3 my-2">
        {collapsed ? (
          <button
            onClick={onToggle}
            title="Search transactions..."
            className="flex h-10 w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <Search size={16} />
          </button>
        ) : (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search transactions..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-xs font-semibold text-zinc-200 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-1.5 px-3">
        {NAV.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${collapsed ? 'justify-center' : ''
                } ${active
                  ? 'bg-zinc-800/80 text-zinc-50 border border-zinc-700/30'
                  : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
            >
              {/* Active left-border indicator */}
              <span
                className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-indigo-400 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0'
                  }`}
              />
              <item.icon
                size={19}
                className={`shrink-0 transition-colors ${active ? 'text-indigo-400' : ''}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Account switcher */}
      <div className="relative border-t border-zinc-800 p-3" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          title={collapsed ? activeAccount.name : undefined}
          className={`flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-[0.98] ${collapsed ? 'justify-center' : ''
            }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activeAccount.accent} text-xs font-bold text-white shadow-md`}
          >
            {activeAccount.initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-bold text-zinc-100">
                  {activeAccount.name}
                </span>
                <span className="block truncate text-[11px] font-medium text-zinc-500">
                  {activeAccount.owner}
                </span>
              </span>
              <ChevronsUpDown size={15} className="text-zinc-500" />
            </>
          )}
        </button>

        {/* Dropdown — when collapsed, anchor to the right of the sidebar */}
        {switcherOpen && (
          <div
            className={`absolute bottom-3 z-30 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 ${
              collapsed ? 'w-56 left-[68px]' : 'left-3 right-3'
            }`}
          >
            <p className="border-b border-zinc-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Switch Account
            </p>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {accounts.map((acc) => {
                const active = acc.id === activeAccount.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onSelectAccount(acc.id);
                      setSwitcherOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-zinc-800/70"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${acc.accent} text-xs font-bold text-white`}
                    >
                      {acc.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-zinc-100">
                        {acc.name}
                      </span>
                      <span className="block truncate text-[11px] font-medium text-zinc-500">
                        {acc.owner}
                      </span>
                    </span>
                    {active && <Check size={15} className="text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
