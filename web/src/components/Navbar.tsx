import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { Globe, Clock, ShieldCheck, User as UserIcon, LogOut, Code, Award, Trophy, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [serverTime, setServerTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      // Formats to Addis Ababa time (UTC+3)
      setServerTime(
        now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Addis_Ababa', hour12: false })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 text-sky-400 font-bold text-xl tracking-tight">
            <span className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Code className="w-5 h-5" />
            </span>
            <span className="font-extrabold text-white">DAGNA <span className="text-sky-400 font-ethiopic text-lg">ዳኛ</span></span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <Link to="/problems" className="hover:text-white flex items-center space-x-1.5 transition">
              <Code className="w-4 h-4 text-slate-400" />
              <span>{t('nav.problems')}</span>
            </Link>
            <Link to="/contests" className="hover:text-white flex items-center space-x-1.5 transition">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{t('nav.contests')}</span>
            </Link>
            <Link to="/leaderboard" className="hover:text-white flex items-center space-x-1.5 transition">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.leaderboard')}</span>
            </Link>
            <Link to="/groups" className="hover:text-white flex items-center space-x-1.5 transition">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{t('nav.groups')}</span>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 transition">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Server Time, i18n, Auth */}
        <div className="flex items-center space-x-4 text-sm">
          {/* Server Time Indicator (Addis Ababa UTC+3) */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 text-xs text-slate-300 font-mono" title="Synced Server Time (Africa/Addis_Ababa)">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{serverTime} EAT</span>
          </div>

          {/* Bilingual Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{i18n.language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to={`/profile/${user.handle}`}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                <UserIcon className="w-4 h-4 text-sky-400" />
                <span className="font-medium text-white">{user.displayName}</span>
                <span className="text-xs bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {user.rating}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition p-1"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-3.5 py-1.5 rounded-md transition shadow-sm"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
