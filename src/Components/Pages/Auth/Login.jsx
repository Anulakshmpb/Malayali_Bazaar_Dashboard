import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminLogin } from './services/auth.api';
import { useToast } from '../../Shared/hooks/ToastContext';

const Login = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await adminLogin(email.trim(), password);

      if (!res || !res.success) {
        const message =
          res?.error || 'Login failed. Please check your credentials.';

        setError(message);
        showToast(message, 'error');
        return;
      }

      showToast('Login successful!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login Error:', err);

      let errorMessage =
        'An error occurred during login. Please try again.';

      switch (err?.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;

        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;

        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;

        case 'auth/too-many-requests':
          errorMessage =
            'Too many failed login attempts. Please try again later.';
          break;

        case 'auth/network-request-failed':
          errorMessage =
            'Network error. Please check your internet connection.';
          break;

        case 'auth/user-disabled':
          errorMessage =
            'This account has been disabled. Please contact your administrator.';
          break;

        default:
          errorMessage = err?.message
            ? 'Login failed. Please verify your credentials and try again.'
            : errorMessage;
      }

      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        {/* Header */}
        <div className="px-8 pb-2 pt-9 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <ShieldCheck size={30} strokeWidth={1.8} />
          </div>

          <h1 className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to access your grocery admin dashboard.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mx-8 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-10"
          >
            {error}
          </div>
        )}

        {/* Login form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5 px-8 pb-9 pt-7 sm:px-10"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email Address
            </label>

            <div className="group relative">
              <Mail
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
              />

              <input
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
            </div>

            <div className="group relative">
              <Lock
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
              />

              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {loading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="pt-1 text-center text-xs leading-5 text-slate-400">
            Authorized administrators only.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;