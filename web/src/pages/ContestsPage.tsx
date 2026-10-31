import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../services/api.js';
import { Trophy, Clock, Users, ChevronRight } from 'lucide-react';

export const ContestsPage: React.FC = () => {
  const { t } = useTranslation();
  const [contests, setContests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContests() {
      try {
        const data = await apiRequest('/contests');
        if (data.success) {
          setContests(data.contests);
        }
      } catch (err) {
        console.error('Failed to load contests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContests();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('contest.title')}</h1>
          <p className="text-sm text-slate-400">Compete in timed rated ICPC and OI format contests</p>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">{t('common.loading')}</div>
        ) : contests.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-8 text-center text-slate-400">
            No active or scheduled contests found.
          </div>
        ) : (
          contests.map((c) => (
            <div
              key={c._id}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-3">
                  <Link to={`/contests/${c._id}`} className="text-lg font-bold text-white hover:text-sky-400 transition">
                    {c.title}
                  </Link>
                  <span
                    className={`text-xs uppercase font-bold px-2 py-0.5 rounded font-mono ${
                      c.state === 'running'
                        ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                        : c.state === 'ended'
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-sky-500/20 text-sky-400'
                    }`}
                  >
                    {c.state}
                  </span>
                  {c.rated && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-semibold">
                      Rated
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-6 text-xs text-slate-400 font-mono">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Start: {new Date(c.startAt).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{c.participantCount} registered</span>
                  </span>
                  <span className="uppercase">{c.mode} Scoring</span>
                </div>
              </div>

              <div>
                <Link
                  to={`/contests/${c._id}`}
                  className="inline-flex items-center space-x-1 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  <span>Enter Contest</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
