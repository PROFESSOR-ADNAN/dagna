import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.js';
import { Users, Plus, Key } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSlug, setNewGroupSlug] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const data = await apiRequest('/groups');
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/groups/join', {
        method: 'POST',
        body: JSON.stringify({ code: inviteCode }),
      });
      if (res.success) {
        alert(res.message);
        setInviteCode('');
        loadGroups();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName, slug: newGroupSlug }),
      });
      if (res.success) {
        alert('Group created successfully!');
        setNewGroupName('');
        setNewGroupSlug('');
        loadGroups();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Users className="w-6 h-6 text-purple-400" />
          <span>Training Cohorts & University Clubs</span>
        </h1>
        <p className="text-sm text-slate-400">Join a private group or create your own club to host private contests</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Join by Code */}
        <form onSubmit={handleJoin} className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
            <Key className="w-4 h-4 text-sky-400" />
            <span>Join Group via Invite Code</span>
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. 7F8A3B12"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Join
            </button>
          </div>
        </form>

        {/* Create Group */}
        <form onSubmit={handleCreate} className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create New Training Group</span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Club Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="slug-code"
              value={newGroupSlug}
              onChange={(e) => setNewGroupSlug(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-2 rounded-lg transition"
          >
            Create Group
          </button>
        </form>
      </div>

      {/* Group Directory */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g._id} className="bg-slate-800/40 border border-slate-700/80 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-white text-base">{g.name}</h4>
            <p className="text-xs text-slate-400">Owner: @{g.ownerId?.handle}</p>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50 font-mono">
              <span>{g.memberCount} members</span>
              <span className="text-sky-400">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
