import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Cpu, Trophy, ArrowRight, Zap, CheckCircle2, Lock } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-20 py-10">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-400/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-sky-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Industrial-Strength Sandboxed Execution & Fair Judging</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Master Competitive Programming on <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">DAGNA</span>
          <span className="block font-ethiopic text-3xl sm:text-4xl text-sky-400 mt-2 font-bold">ዳኛ ኦንላይን ዳኝነት</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Production-grade online judge with multi-layered Linux namespaces, cgroup v2 peak memory accounting, pull-based judge fleet with generation fencing, and deterministic Codeforces Elo rating updates.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/problems"
            className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-sky-500/20 transition"
          >
            <span>Browse Problems</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/contests"
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-6 py-3 rounded-lg transition"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Join Live Contest</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Multi-Layered Sandbox</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Linux User, PID, Mount, and empty Net namespaces with cgroup v2 accounting and seccomp syscall filtering.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Fenced Judge Fleet</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Pull-based HTTP long-polling over private WireGuard tunnels. Monotonic generation fencing tokens prevent zombie re-judging.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">ICPC & OI Live Scoreboards</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real-time standings with scoreboard freeze confidentiality, bit-packed integer rank keys, and Codeforces Elo ratings.
          </p>
        </div>
      </section>
    </div>
  );
};
