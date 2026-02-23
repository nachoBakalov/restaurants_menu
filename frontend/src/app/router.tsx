import { Navigate, createBrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../admin/dashboard/DashboardPage';
import { AdminLayout } from '../admin/layout/AdminLayout';
import { RequireAuth } from '../admin/layout/RequireAuth';
import { LoginPage } from '../auth/LoginPage';
import { RegisterPage } from '../auth/RegisterPage';

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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/login" replace />,
  },
]);
