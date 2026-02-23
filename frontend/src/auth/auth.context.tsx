import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AUTH_LOGOUT_EVENT } from '../api/apiClient';
import { login as loginRequest, me as meRequest, registerOwner as registerOwnerRequest } from './auth.api';
import { clearTokens, getAccessToken, setTokens } from './tokenStore';
import type { AuthUser, LoginResponse, RegisterOwnerRequest } from './auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerOwner: (dto: RegisterOwnerRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyLoginResponse = useCallback((response: LoginResponse) => {
    setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      applyLoginResponse(response);
    },
    [applyLoginResponse],
  );

  const registerOwner = useCallback(
    async (dto: RegisterOwnerRequest) => {
      const response = await registerOwnerRequest(dto);

      if (
        typeof response === 'object' &&
        response !== null &&
        'accessToken' in response &&
        'refreshToken' in response &&
        'user' in response
      ) {
        applyLoginResponse(response as LoginResponse);
        return;
      }

      await login(dto.email, dto.password);
    },
    [applyLoginResponse, login],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await meRequest();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(getAccessToken()),
      login,
      registerOwner,
      logout,
    }),
    [isLoading, login, logout, registerOwner, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
