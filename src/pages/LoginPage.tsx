import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Wallet, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

interface LocationState {
  from?: { pathname?: string };
}

/**
 * LoginPage — combined login / register screen.
 * Redirects to the dashboard once authenticated.
 */
export default function LoginPage() {
  const { login, register, isAuthenticated, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname || '/';

  const [mode, setMode] = useState<Mode>('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Đã có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setMode('login');
    setEmail('demo@demo.com');
    setPassword('demo1234');
    setError('');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 px-4 py-10 text-zinc-200">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
            <Wallet size={26} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Quản Lý Tài Chính</h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Theo dõi thu chi, tiết kiệm và ngân sách cá nhân
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {/* Mode toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            {[
              { id: 'login' as Mode, label: 'Đăng nhập' },
              { id: 'register' as Mode, label: 'Đăng ký' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setError('');
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field
                icon={User}
                label="Họ tên"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                required
              />
            )}
            <Field
              icon={Mail}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="ban@email.com"
              autoComplete="email"
              required
            />
            <Field
              icon={Lock}
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={fillDemo}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Dùng tài khoản demo (demo@demo.com / demo1234)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ icon: Icon, label, value, onChange, ...props }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <Icon size={16} />
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2.5 pl-10 pr-3 text-sm font-medium text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          {...props}
        />
      </div>
    </div>
  );
}
