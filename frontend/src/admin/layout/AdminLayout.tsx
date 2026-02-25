import { Building2, CreditCard, LayoutDashboard, Menu as MenuIcon, ShoppingCart, UtensilsCrossed } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useFeatures } from '../../billing/useFeatures';
import { useAuth } from '../../auth/auth.context';
import { useT } from '../../i18n/useT';
import { LanguageSwitcher } from '../../shared/components/LanguageSwitcher';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../shared/ui/dropdown-menu';
import { Separator } from '../../shared/ui/separator';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../shared/ui/sheet';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
};

export function AdminLayout() {
  const { logout, user, activeRestaurantId, setActiveRestaurantId } = useAuth();
  const { t } = useT();
  const { isEnabled, isLoading } = useFeatures();
  const location = useLocation();
  const navigate = useNavigate();
  const orderingEnabled = isEnabled('ORDERING');
  const ordersDisabled = !isLoading && !orderingEnabled;
  const isSuperadmin = user?.role === 'SUPERADMIN';

  const navItems: NavItem[] = [
    { to: '/admin', label: t('admin.nav.dashboard'), icon: LayoutDashboard },
    ...(isSuperadmin ? [{ to: '/admin/restaurants', label: t('admin.nav.restaurants'), icon: Building2 }] : []),
    { to: '/admin/menu', label: t('admin.nav.menu'), icon: UtensilsCrossed },
    {
      to: '/admin/orders',
      label: t('admin.nav.orders'),
      icon: ShoppingCart,
      disabled: ordersDisabled,
      badge: ordersDisabled ? t('admin.nav.ordersLockedBadge') : undefined,
    },
    { to: '/admin/billing', label: t('admin.nav.billing'), icon: CreditCard },
  ];

  const titleByPath: Record<string, string> = {
    '/admin': t('admin.pageTitles.dashboard'),
    '/admin/restaurants': t('admin.restaurants.title'),
    '/admin/menu': t('admin.pageTitles.menu'),
    '/admin/orders': t('admin.pageTitles.orders'),
    '/admin/billing': t('admin.pageTitles.billing'),
  };

  const pageTitle = titleByPath[location.pathname] ?? t('admin.pageTitles.dashboard');

  const roleLabel =
    user?.role === 'SUPERADMIN'
      ? t('admin.role.superadmin')
      : user?.role === 'OWNER'
        ? t('admin.role.owner')
        : user?.role === 'STAFF'
          ? t('admin.role.staff')
          : '-';

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="px-2 py-3">
        <Link className="text-base font-semibold tracking-tight" to="/admin">
          {t('admin.brandName')}
        </Link>
      </div>

      <Separator className="my-2" />

      <nav className="flex-1 space-y-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const enabledNavClass = ({ isActive }: { isActive: boolean }) =>
            [
              'flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ');

          const disabledNavClass = 'flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground/60 opacity-70';

          if (item.disabled) {
            return (
              <div key={item.to} className={disabledNavClass} aria-disabled="true" title={item.badge}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge ? (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
            );
          }

          const linkNode = (
            <NavLink to={item.to} end={item.to === '/admin'} className={enabledNavClass}>
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );

          if (mobile) {
            return (
              <SheetClose asChild key={item.to}>
                {linkNode}
              </SheetClose>
            );
          }

          return <div key={item.to}>{linkNode}</div>;
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="hidden md:fixed md:inset-y-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:bg-background md:px-3 md:py-3">
        <Sidebar />
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden" aria-label="Open navigation">
                    <MenuIcon className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-72 sm:w-80">
                  <SheetHeader>
                    <SheetTitle>{t('admin.brandName')}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100%-2rem)]">
                    <Sidebar mobile />
                  </div>
                </SheetContent>
              </Sheet>

              <div>
                <p className="text-xs text-muted-foreground">{t('admin.title')}</p>
                <h1 className="text-base font-semibold leading-tight md:text-lg">{pageTitle}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSuperadmin && activeRestaurantId ? (
                <>
                  <Badge variant="secondary" className="hidden md:inline-flex">
                    {t('admin.restaurants.scopeBadge')}: {activeRestaurantId.slice(0, 8)}
                  </Badge>
                  <Button type="button" variant="outline" size="sm" onClick={() => navigate('/admin/restaurants')}>
                    {t('admin.restaurants.actions.enter')}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setActiveRestaurantId(null)}>
                    {t('admin.restaurants.actions.clearScope')}
                  </Button>
                </>
              ) : null}

              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="max-w-[220px]">
                    <span className="truncate text-left">{user?.email ?? '—'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.email ?? '—'}</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled>{roleLabel}</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>{t('admin.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
