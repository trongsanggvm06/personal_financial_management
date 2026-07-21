import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import './App.css';

// Route-level code splitting keeps the initial bundle small; the chart-heavy
// pages (Dashboard, Reports) load their dependencies (recharts) on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const SavingsPage = lazy(() => import('./pages/SavingsPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

function FullscreenLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 text-indigo-400">
      <Loader2 size={28} className="animate-spin" />
    </div>
  );
}

// In-content loader for lazily-loaded route pages.
function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-indigo-400">
      <Loader2 size={26} className="animate-spin" />
    </div>
  );
}

// Guards the app shell: redirects to /login when not authenticated.
function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullscreenLoader />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="giao-dich"
          element={
            <Suspense fallback={<PageLoader />}>
              <TransactionsPage />
            </Suspense>
          }
        />
        <Route
          path="tiet-kiem"
          element={
            <Suspense fallback={<PageLoader />}>
              <SavingsPage />
            </Suspense>
          }
        />
        <Route
          path="ngan-sach"
          element={
            <Suspense fallback={<PageLoader />}>
              <BudgetsPage />
            </Suspense>
          }
        />
        <Route
          path="bao-cao"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
