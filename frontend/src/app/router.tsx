import { createBrowserRouter } from 'react-router-dom';
import { BillingPage } from '../admin/billing/BillingPage';
import { DashboardPage } from '../admin/dashboard/DashboardPage';
import { AdminLayout } from '../admin/layout/AdminLayout';
import { RequireAuth } from '../admin/layout/RequireAuth';
import { MenuPage } from '../admin/menu/MenuPage';
import { OrdersPage } from '../admin/orders/OrdersPage';
import { RestaurantsPage } from '../admin/restaurants/RestaurantsPage';
import { SettingsPage } from '../admin/settings/SettingsPage';
import { LoginPage } from '../auth/LoginPage';
import { PublicMenuPage } from '../public/pages/PublicMenuPage';
import { RegisterPage } from '../auth/RegisterPage';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/register',
    element: <RegisterPage />,
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'billing',
        element: <BillingPage />,
      },
      {
        path: 'restaurants',
        element: <RestaurantsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/:slug',
    element: <PublicMenuPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
