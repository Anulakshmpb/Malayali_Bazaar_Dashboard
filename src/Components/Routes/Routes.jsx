import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../Config/Firebase';
import AppBar from '../Shared/AppBar';
import Login from '../Pages/Auth/Login';
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

export default function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Authentication error:', error);
        setUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* All authenticated pages */}
        <Route element={<ProtectedRoute user={user} />}>
          <Route element={<Layout />}>
            {PROTECTED_ROUTES.map((route) => {
              const PageComponent = route.element;

              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<PageComponent />}
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
              to={user ? '/dashboard' : '/'}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}