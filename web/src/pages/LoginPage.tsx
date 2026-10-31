import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [emailOrHandle, setEmailOrHandle] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrHandle, password, totpCode: totpCode || undefined }),
      });

      if (data.success) {
        login(data.accessToken, data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <div className="bg-slate-800/60 border border-slate-700/80 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Sign In to Dagna</h1>
          <p className="text-xs text-slate-400">Enter your credentials to access rated contests & practice</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono block mb-1">
              Email or Handle
            </label>
            <input
              type="text"
              required
              value={emailOrHandle}
              onChange={(e) => setEmailOrHandle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase font-mono block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase font-mono block mb-1">
              6-digit MFA Code (if enabled)
            </label>
            <input
              type="text"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="000000"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition shadow-md"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-sky-400 hover:text-sky-300 font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
