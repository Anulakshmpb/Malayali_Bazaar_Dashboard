import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { useUser } from '../hooks/UserContext';
import { PROTECTED_ROUTES } from '../../Routes/RoutesConfig';

export default function AccessDenied({ routeName, routePath }) {
  const navigate = useNavigate();
  const { adminUser, role, hasPermission } = useUser();

  const handleGoHome = () => {
    if (hasPermission('/dashboard')) {
      navigate('/dashboard');
      return;
    }
    const firstAllowed = PROTECTED_ROUTES.find((r) => hasPermission(r.path));
    if (firstAllowed) {
      navigate(firstAllowed.path);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-100 sm:p-10">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
          <ShieldAlert size={40} strokeWidth={1.8} />
        </div>

        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <Lock size={12} />
          <span>Role: {role || adminUser?.role || 'Restricted'}</span>
        </div>

        {/* Title */}
        <h1 className="font-jakarta text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Access Restricted
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          You do not have permission to view{' '}
          <span className="font-semibold text-slate-800">
            {routeName || routePath || 'this page'}
          </span>
          . Please reach out to your administrator to request access.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <LayoutDashboard size={16} />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

