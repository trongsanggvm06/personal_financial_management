import { useState } from 'react';
import { Menu, Plus, Loader2 } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NewTransactionModal from '../ui/NewTransactionModal';
import { DataProvider, useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

// Page titles keyed by route path (for the mobile top bar).
const PAGE_TITLES = {
  '/': 'Tổng quan',
  '/giao-dich': 'Thu / Chi',
  '/tiet-kiem': 'Tiết kiệm',
  '/ngan-sach': 'Ngân sách',
  '/bao-cao': 'Báo cáo',
};

function LayoutInner() {
  const { user, logout } = useAuth();
  const {
    accounts,
    activeAccount,
    activeAccountId,
    setActiveAccountId,
    addTransaction,
    loading,
    error,
  } = useData();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'Tổng quan';

  const openNewTransaction = () => {
    setModalSession((n) => n + 1);
    setModalOpen(true);
  };

  const handleAddTransaction = async (tx) => {
    await addTransaction({ ...tx, accountId: activeAccountId });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-200">
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        accounts={accounts}
        activeAccount={activeAccount}
        onSelectAccount={setActiveAccountId}
        user={user}
        onLogout={logout}
        onNavigate={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] animate-slide-in">
            <Sidebar
              mobile
              collapsed={false}
              onToggle={() => {}}
              accounts={accounts}
              activeAccount={activeAccount}
              onSelectAccount={(id) => {
                setActiveAccountId(id);
              }}
              user={user}
              onLogout={logout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-zinc-100">{pageTitle}</span>
          <button
            onClick={openNewTransaction}
            aria-label="Thêm giao dịch"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white"
          >
            <Plus size={18} />
          </button>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {loading ? (
              <div className="flex h-[60vh] items-center justify-center text-indigo-400">
                <Loader2 size={26} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-medium text-rose-400">
                {error}
              </div>
            ) : (
              <Outlet
                context={{
                  openNewTransaction,
                  search: searchQuery,
                  setSearch: setSearchQuery,
                }}
              />
            )}
          </div>
        </main>
      </div>

      <NewTransactionModal
        key={modalSession}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddTransaction}
        accounts={accounts}
        defaultAccountId={activeAccountId}
      />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <DataProvider>
      <LayoutInner />
    </DataProvider>
  );
}
