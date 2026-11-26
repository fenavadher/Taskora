import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authApi,
  getApiErrorMessage,
  setApiToken,
  setUnauthorizedHandler,
  systemApi,
} from '../services/api';
import type { DbStatus, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  dbStatus: DbStatus | null;
  healthLoading: boolean;
  refreshHealth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  const clearSession = useCallback(() => {
    setApiToken(null);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const health = await systemApi.getHealth();
      setDbStatus(health.database);
    } catch {
      setDbStatus({
        configured: false,
        connected: false,
        readyState: 0,
        error: 'Unable to reach the Taskora API server.',
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const result = await authApi.login({ email, password });
      setApiToken(result.token);
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Unable to sign in.'));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setAuthLoading(true);
    try {
      const result = await authApi.register({ name, email, password });
      setApiToken(result.token);
      setToken(result.token);
      setUser(result.user);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Unable to create account.'));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear client memory even if server call fails
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      authLoading,
      dbStatus,
      healthLoading,
      refreshHealth,
      login,
      register,
      logout,
    }),
    [user, token, authLoading, dbStatus, healthLoading, refreshHealth, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
