import { Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/auth.context';
import { useT } from '../../i18n/useT';
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher';
import { Button } from '../../shared/ui/button';

export function AdminLayout() {
  const { logout } = useAuth();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold">{t('admin.title')}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" onClick={logout}>
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
