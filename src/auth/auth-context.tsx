import type { LoginRequest, UsuarioAutenticado } from '../schemas/auth.schema';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, login as requestLogin } from '../api/auth';
import { useQueryClient } from '@tanstack/react-query';

type AuthState =
  | { status: 'loading' | 'anonymous'; usuario: null; token: null }
  | { status: 'authenticated'; usuario: UsuarioAutenticado; token: string };

type AuthContextValue = AuthState & {
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', usuario: null, token: null });

  const logout = useCallback(() => {
    localStorage.removeItem('gyn-plastico:access-token');
    queryClient.clear();
    setState({ status: 'anonymous', usuario: null, token: null });
  }, [queryClient]);

  useEffect(() => {
    const token = localStorage.getItem('gyn-plastico:access-token');
    const expired = () => logout();
    window.addEventListener('gyn-plastico:session-expired', expired);
    if (!token) {
      setState({ status: 'anonymous', usuario: null, token: null });
    } else {
      void fetchCurrentUser(token).then((usuario) => {
        setState({ status: 'authenticated', usuario, token });
      }).catch(() => logout());
    }
    return () => window.removeEventListener('gyn-plastico:session-expired', expired);
  }, [logout]);

  const login = useCallback(async (request: LoginRequest) => {
    const response = await requestLogin(request);
    localStorage.setItem('gyn-plastico:access-token', response.accessToken);
    setState({ status: 'authenticated', usuario: response.usuario, token: response.accessToken });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout }), [login, logout, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
