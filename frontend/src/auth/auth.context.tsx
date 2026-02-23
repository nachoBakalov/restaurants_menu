import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AuthUser } from '../api/types';
import { tokenStore } from './tokenStore';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginPlaceholder: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(tokenStore.getAccessToken()),
      loginPlaceholder: () => {
        tokenStore.setTokens('placeholder-access-token', 'placeholder-refresh-token');
        setUser({
          id: 'placeholder-user',
          email: 'demo@local.test',
          role: 'OWNER',
          restaurantId: 'placeholder-restaurant-id',
        });
      },
      logout: () => {
        tokenStore.clear();
        setUser(null);
      },
    }),
    [user],
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
