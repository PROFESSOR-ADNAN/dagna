import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Trophy, Clock, Lock, Send, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

export const ContestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [contest, setContest] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'problems' | 'scoreboard' | 'clarifications'>('scoreboard');
  const [clarifications, setClarifications] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    async function loadContestData() {
      try {
        const cData = await apiRequest(`/contests/${id}`);
        if (cData.success) {
          setContest(cData.contest);
        }

        const sData = await apiRequest(`/contests/${id}/standings`);
        if (sData.success) {
          setStandings(sData.standings);
        }

        if (user) {
          const clarData = await apiRequest(`/contests/${id}/clarifications`);
          if (clarData.success) {
            setClarifications(clarData.clarifications);
          }
        }
      } catch (err) {
        console.error('Failed to load contest:', err);
      }
    }
    loadContestData();
  }, [id, user]);

  const handleRegister = async () => {
    try {
      const res = await apiRequest(`/contests/${id}/register`, { method: 'POST' });
      if (res.success) {
        setIsRegistered(true);
        alert('Registered successfully!');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAskClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      const res = await apiRequest(`/contests/${id}/clarifications`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      if (res.success) {
        setClarifications([res.clarification, ...clarifications]);
        setQuestion('');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!contest) {
    return <div className="text-center py-20 text-slate-500">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      {/* Contest Header */}
      <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{contest.title}</h1>
            <span className="text-xs uppercase font-mono font-bold bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded">
              {contest.state}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Mode: {contest.mode.toUpperCase()} | Penalty: {contest.penaltyMinutes} min/fail
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRegister}
            disabled={isRegistered || contest.state === 'ended'}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
          >
            {isRegistered ? t('contest.registered') : t('contest.register')}
          </button>
        </div>
      </div>

      {/* Freeze Banner if Scoreboard is frozen */}
      {contest.isScoreboardFrozen && (
        <div className="bg-amber-500/10 border border-amber-400/30 p-4 rounded-xl flex items-center space-x-3 text-amber-300 text-sm">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <span>{t('contest.freezeBanner')}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b border-slate-800 text-sm font-medium">
        <button
          onClick={() => setActiveTab('scoreboard')}
          className={`pb-3 px-2 border-b-2 transition ${
            activeTab === 'scoreboard'
              ? 'border-sky-400 text-sky-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('contest.scoreboard')}
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={`pb-3 px-2 border-b-2 transition ${
            activeTab === 'problems'
              ? 'border-sky-400 text-sky-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Problems
        </button>
        <button
          onClick={() => setActiveTab('clarifications')}
          className={`pb-3 px-2 border-b-2 transition ${
            activeTab === 'clarifications'
              ? 'border-sky-400 text-sky-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('contest.clarifications')}
        </button>
      </div>

      {/* Scoreboard Tab View */}
      {activeTab === 'scoreboard' && (
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-center w-12">{t('contest.rank')}</th>
                <th className="px-4 py-3">{t('contest.participant')}</th>
                <th className="px-4 py-3 text-center">{t('contest.solved')}</th>
                <th className="px-4 py-3 text-center">{t('contest.penalty')}</th>
                {contest.problems?.map((p: any) => (
                  <th key={p.label} className="px-4 py-3 text-center w-16">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {standings.map((s) => (
                <tr key={s._id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-center font-bold text-white">{s.rank}</td>
                  <td className="px-4 py-3 font-medium text-white flex items-center space-x-2">
                    <span>{s.userId?.displayName || 'Deleted User'}</span>
                    <span className="text-slate-500 font-normal">@{s.userId?.handle}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-400">{s.totalSolved}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{s.totalPenalty}</td>
                  {contest.problems?.map((p: any) => {
                    const cell = s.cells?.[p.label];
                    return (
                      <td key={p.label} className="px-2 py-3 text-center">
                        {cell?.solved ? (
                          <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded py-1">
                            <div className="font-bold">+{cell.attempts > 0 ? cell.attempts : ''}</div>
                            <div className="text-[10px] text-emerald-500/80 font-mono">
                              {Math.floor((cell.acceptedAtSeconds || 0) / 60)}
                            </div>
                          </div>
                        ) : cell?.isPending ? (
                          <div className="bg-amber-500/20 text-amber-400 border border-amber-400/30 rounded py-1">
                            <span className="font-bold">?</span>
                          </div>
                        ) : cell?.attempts > 0 ? (
                          <div className="bg-red-500/20 text-red-400 border border-red-400/30 rounded py-1">
                            <span>-{cell.attempts}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Problems Tab View */}
      {activeTab === 'problems' && (
        <div className="grid gap-3">
          {contest.problems?.map((p: any) => (
            <Link
              key={p.label}
              to={`/problems/${p.problemId?.slug}`}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 p-4 rounded-xl flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-4">
                <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-400 flex items-center justify-center font-bold font-mono">
                  {p.label}
                </span>
                <span className="font-semibold text-white text-sm">{p.problemId?.title}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{p.points} pts</span>
            </Link>
          ))}
        </div>
      )}

      {/* Clarifications Tab View */}
      {activeTab === 'clarifications' && (
        <div className="space-y-6">
          <form onSubmit={handleAskClarification} className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
            <label className="text-xs font-bold text-slate-400 uppercase font-mono">Ask a Clarification</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about a problem statement or test case format..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 h-24"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Submit Question
            </button>
          </form>

          <div className="space-y-3">
            {clarifications.map((c) => (
              <div key={c._id} className="bg-slate-800/40 border border-slate-700/80 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Question from @{c.userId?.handle}</span>
                  <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-200">{c.question}</p>
                {c.answer && (
                  <div className="mt-2 pl-4 border-l-2 border-sky-500 text-sm text-sky-300">
                    <span className="font-bold">Answer: </span> {c.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
