import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.js';
import { Award, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await apiRequest('/users/leaderboard?limit=50');
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <span>Global Rating Leaderboard</span>
        </h1>
        <p className="text-sm text-slate-400">Top competitive programmers evaluated by Codeforces-style Elo rating</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
            <tr>
              <th className="px-6 py-3.5 text-center w-16">#</th>
              <th className="px-6 py-3.5">User</th>
              <th className="px-6 py-3.5 text-center">Rating</th>
              <th className="px-6 py-3.5 text-center">Problems Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  Loading leaderboard standings...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No active rated participants.
                </td>
              </tr>
            ) : (
              leaderboard.map((u) => (
                <tr key={u.handle} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 text-center font-bold font-mono text-slate-400">
                    {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : u.rank}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    <Link to={`/profile/${u.handle}`} className="hover:text-sky-400 transition">
                      {u.displayName} <span className="text-slate-500 text-xs font-normal">@{u.handle}</span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold text-sky-400">
                    {u.rating}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-slate-300">
                    {u.solvedCount || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
