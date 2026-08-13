import type { LoginRequest, UsuarioAutenticado } from '../schemas/auth.schema';
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { login as requestLogin } from '../api/auth';

type AuthState =
  | { status: 'anonymous'; usuario: null; token: null }
  | { status: 'authenticated'; usuario: UsuarioAutenticado; token: string };

type AuthContextValue = AuthState & {
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'anonymous', usuario: null, token: null });

  const login = useCallback(async (request: LoginRequest) => {
    const response = await requestLogin(request);
    setState({ status: 'authenticated', usuario: response.usuario, token: response.accessToken });
  }, []);

  const logout = useCallback(() => {
    setState({ status: 'anonymous', usuario: null, token: null });
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
