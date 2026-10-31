import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.js';
import { ShieldCheck, Server, AlertTriangle, Play, RefreshCw, Power } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setIsLoading(true);
    try {
      const nData = await apiRequest('/admin/nodes');
      if (nData.success) setNodes(nData.nodes);

      const qData = await apiRequest('/admin/queue');
      if (qData.success) setQueueStatus(qData.queue);

      const aData = await apiRequest('/admin/audit-logs');
      if (aData.success) setAuditLogs(aData.logs);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSetNodeState = async (nodeId: string, state: string) => {
    try {
      await apiRequest(`/admin/nodes/${nodeId}/state`, {
        method: 'POST',
        body: JSON.stringify({ state }),
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecomputeRatings = async () => {
    if (!confirm('Recompute all ratings from the first contest? This will recalculate all historic deltas.')) return;
    try {
      await apiRequest('/admin/ratings/recompute', { method: 'POST' });
      alert('All ratings successfully recalculated!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>Admin Fleet & Operations Console</span>
          </h1>
          <p className="text-sm text-slate-400">Monitor judge nodes, queue depth, and execute maintenance operations</p>
        </div>

        <button
          onClick={handleRecomputeRatings}
          className="flex items-center space-x-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Recompute All Ratings</span>
        </button>
      </div>

      {/* Queue Telemetry Cards */}
      {queueStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase">Queued Jobs</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{queueStatus.queuedCount}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase">Leased Jobs</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{queueStatus.leasedCount}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase">Active Nodes</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{nodes.length}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl">
            <div className="text-xs text-slate-400 uppercase">Queue Health</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">NORMAL</div>
          </div>
        </div>
      )}

      {/* Judge Fleet Table */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Judge Fleet Nodes</span>
          </h3>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-700">
            <tr>
              <th className="px-6 py-3">Node ID</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Calibration</th>
              <th className="px-6 py-3">Last Heartbeat</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {nodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No judge nodes currently registered.
                </td>
              </tr>
            ) : (
              nodes.map((n) => (
                <tr key={n.nodeId} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-3.5 font-bold text-white">{n.nodeId}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        n.state === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : n.state === 'draining'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {n.state}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-300">{n.calibrationScore}</td>
                  <td className="px-6 py-3.5 text-slate-400">{new Date(n.lastHeartbeat).toLocaleTimeString()}</td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleSetNodeState(n.nodeId, 'draining')}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded transition"
                    >
                      Drain
                    </button>
                    <button
                      onClick={() => handleSetNodeState(n.nodeId, 'quarantined')}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-400/30 px-2.5 py-1 rounded transition"
                    >
                      Quarantine
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase font-mono">Recent Operations Audit Log</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs text-slate-300">
          {auditLogs.map((log) => (
            <div key={log._id} className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-sky-400 font-semibold">{log.action}</span>
              <span className="text-slate-400">{log.resourceType}: {log.resourceId}</span>
              <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
