import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useUser } from '../Shared/hooks/UserContext';
import AppBar from '../Shared/AppBar';
import Login from '../Pages/Auth/Login';
import AccessDenied from '../Shared/Pages/AccessDenied';
import { PROTECTED_ROUTES } from './RoutesConfig';

const Layout = () => {
  return (
    <div className="App min-h-screen bg-white">
      <AppBar>
        <div className="mt-[100px] min-h-[calc(100vh-100px)] bg-white">
          <Outlet />
        </div>
      </AppBar>
    </div>
  );
};

const ProtectedRoute = ({ user }) => {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

const PermissionRoute = ({ route }) => {
  const { hasPermission } = useUser();
  const PageComponent = route.element;

  if (!hasPermission(route.path)) {
    return <AccessDenied routeName={route.name} routePath={route.path} />;
  }

  return <PageComponent />;
};

export default function AppRoutes() {
  const { user, loading, hasPermission } = useUser();

  const getDefaultRoute = () => {
    if (hasPermission('/dashboard')) return '/dashboard';
    const firstAllowed = PROTECTED_ROUTES.find((r) => hasPermission(r.path));
    return firstAllowed ? firstAllowed.path : '/dashboard';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <span className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Login />
            )
          }
        />

        {/* All authenticated pages with permission checks */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<Layout />}>
            {PROTECTED_ROUTES.map((route) => {
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<PermissionRoute route={route} />}
                />
              );
            })}
          </Route>
        </Route>

        {/* Redirect unknown URLs */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? getDefaultRoute() : '/'}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}