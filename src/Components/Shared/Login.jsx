import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="bg-white backdrop-blur-md p-10 rounded-3xl w-full max-w-[420px] shadow-[0_25px_50px_-12px_rgba(52,14,14,0.25)] border border-tertiary animate-[slideUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary text-transparent bg-clip-text">Welcome Back</h1>

        </div>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-200 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block mb-2 text-[0.9rem] font-medium text-gray-900" htmlFor="email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input
                className="w-full py-[0.85rem] pl-12 pr-4 rounded-xl bg-tertiary/20 border border-tertiary text-gray-900 placeholder-secondary/70 transition-all duration-300 font-inherit focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(52,14,14,0.2)]"
                type="email"
                id="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-[0.9rem] font-medium text-gray-900" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input
                className="w-full py-[0.85rem] pl-12 pr-12 rounded-xl bg-tertiary/20 border border-tertiary text-gray-900 placeholder-secondary/70 transition-all duration-300 font-inherit focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(52,14,14,0.2)]"
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-gray-900 focus:outline-none transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-[0.85rem] rounded-xl bg-primary text-white border-none text-base font-semibold cursor-pointer transition-all duration-300 mt-4 hover:bg-secondary hover:-translate-y-[2px] hover:shadow-[0_10px_20px_-3px_rgba(52,14,14,0.35)] disabled:bg-primary/80 disabled:text-white/50 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In…</span>
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
