import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AUTH_LOGOUT_EVENT } from '../api/apiClient';
import { login as loginRequest, me as meRequest, registerOwner as registerOwnerRequest } from './auth.api';
import { clearTokens, getAccessToken, setTokens } from './tokenStore';
import type { AuthUser, LoginResponse, RegisterOwnerRequest } from './auth.types';

type AuthContextValue = {
  user: AuthUser | null;
  activeRestaurantId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerOwner: (dto: RegisterOwnerRequest) => Promise<void>;
  setActiveRestaurantId: (id: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACTIVE_RESTAURANT_STORAGE_KEY = 'fy_active_restaurant_id';

function getStoredActiveRestaurantId(): string | null {
  const value = localStorage.getItem(ACTIVE_RESTAURANT_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
}

function clearStoredActiveRestaurantId() {
  localStorage.removeItem(ACTIVE_RESTAURANT_STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeRestaurantId, setActiveRestaurantIdState] = useState<string | null>(() => getStoredActiveRestaurantId());
  const [isLoading, setIsLoading] = useState(true);

  const setActiveRestaurantId = useCallback((id: string | null) => {
    if (!id) {
      clearStoredActiveRestaurantId();
      setActiveRestaurantIdState(null);
      return;
    }

    localStorage.setItem(ACTIVE_RESTAURANT_STORAGE_KEY, id);
    setActiveRestaurantIdState(id);
  }, []);

  const applyLoginResponse = useCallback((response: LoginResponse) => {
    setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);

    if (response.user.role !== 'SUPERADMIN') {
      clearStoredActiveRestaurantId();
      setActiveRestaurantIdState(null);
    }
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
    clearStoredActiveRestaurantId();
    setActiveRestaurantIdState(null);
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

          if (currentUser.role !== 'SUPERADMIN') {
            clearStoredActiveRestaurantId();
            setActiveRestaurantIdState(null);
          }
        }
      } catch {
        if (isMounted) {
          clearStoredActiveRestaurantId();
          setActiveRestaurantIdState(null);
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
      activeRestaurantId,
      isLoading,
      isAuthenticated: Boolean(getAccessToken()),
      login,
      registerOwner,
      setActiveRestaurantId,
      logout,
    }),
    [activeRestaurantId, isLoading, login, logout, registerOwner, setActiveRestaurantId, user],
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
