import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../../auth/tokenStore';
import { useAuth } from '../../auth/auth.context';
import { useT } from '../../i18n/useT';

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();
  const { t } = useT();
  const accessToken = getAccessToken();
  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  const isInvalidSession = Boolean(accessToken) && !user && !isLoading;

  useEffect(() => {
    if (isInvalidSession) {
      logout();
    }
  }, [isInvalidSession, logout]);

  if (!accessToken) {
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  if (accessToken && !user && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">{t('admin.common.loading')}</p>
      </div>
    );
  }

  if (isInvalidSession) {
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
