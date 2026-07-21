import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { api, setAuthToken, ApiError } from '../lib/api';
import type { User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'finance.token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  // 'loading' until we've checked any stored token against the server.
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Keep the api client's token in sync with our state.
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // On mount (or token change from storage), validate the token.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!token) {
        setStatus('unauthenticated');
        setUser(null);
        return;
      }
      try {
        const { user } = await api.me(token);
        if (!cancelled) {
          setUser(user);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          // Invalid/expired token — clear it.
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((tok: string, usr: User) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setAuthToken(tok);
    setToken(tok);
    setUser(usr);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: tok, user: usr } = await api.login({ email, password });
      persist(tok, usr);
      return usr;
    },
    [persist],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { token: tok, user: usr } = await api.register({ name, email, password });
      persist(tok, usr);
      return usr;
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    status,
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
