import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { User, Award, CheckCircle2, Download, Trash2, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user: currentUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/users/${handle}`);
        if (data.success) {
          setProfile(data.user);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    }
    loadProfile();
  }, [handle]);

  const handleExport = async () => {
    try {
      const data = await apiRequest('/users/account/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dagna_data_export_${handle}.json`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    try {
      await apiRequest('/users/account', { method: 'DELETE' });
      alert('Account deleted.');
      logout();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!profile) {
    return <div className="text-center py-20 text-slate-500">Loading profile...</div>;
  }

  const isSelf = currentUser && currentUser.handle === handle;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      {/* Profile Header */}
      <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-2xl">
            {profile.displayName[0]}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
            <p className="text-xs text-slate-400 font-mono">@{profile.handle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-center font-mono">
          <div>
            <div className="text-2xl font-bold text-sky-400">{profile.rating}</div>
            <div className="text-xs text-slate-400 uppercase">Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{profile.solvedCount || 0}</div>
            <div className="text-xs text-slate-400 uppercase">Solved</div>
          </div>
        </div>
      </div>

      {/* Rating History */}
      <div className="bg-slate-800/40 border border-slate-700/80 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Contest Rating Progression</span>
        </h3>

        {profile.ratingHistory.length === 0 ? (
          <p className="text-xs text-slate-500">No rated contest participation yet.</p>
        ) : (
          <div className="space-y-2">
            {profile.ratingHistory.map((rh: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-white font-semibold">{rh.contestTitle}</span>
                <span className="text-slate-400">Rank: #{rh.rank}</span>
                <span className={rh.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {rh.delta >= 0 ? `+${rh.delta}` : rh.delta}
                </span>
                <span className="text-sky-300 font-bold">{rh.newRating}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings / Privacy Export & Delete (if viewing own profile) */}
      {isSelf && (
        <div className="bg-slate-800/40 border border-slate-700/80 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono">Privacy & GDPR Controls</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Account Data (JSON)</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium px-4 py-2 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
