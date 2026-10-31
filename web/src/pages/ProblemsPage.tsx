import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../services/api.js';
import { Search, Tag, CheckCircle2, ChevronRight } from 'lucide-react';

export const ProblemsPage: React.FC = () => {
  const { t } = useTranslation();
  const [problems, setProblems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProblems() {
      setIsLoading(true);
      try {
        let endpoint = '/problems?limit=50';
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        if (selectedTag) endpoint += `&tag=${encodeURIComponent(selectedTag)}`;

        const data = await apiRequest(endpoint);
        if (data.success) {
          setProblems(data.problems);
        }
      } catch (err) {
        console.error('Failed to load problems:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProblems();
  }, [search, selectedTag]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('problem.title')}</h1>
          <p className="text-sm text-slate-400">Sharpen your algorithms and data structures</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
            <tr>
              <th className="px-6 py-3.5">Title</th>
              <th className="px-6 py-3.5">{t('problem.difficulty')}</th>
              <th className="px-6 py-3.5">{t('problem.tags')}</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No problems found matching criteria.
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p._id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-medium text-white">
                    <Link to={`/problems/${p.slug}`} className="hover:text-sky-400 transition">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/80 text-sky-400 font-mono">
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                          className={`text-xs px-2 py-0.5 rounded border transition ${
                            selectedTag === tag
                              ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/problems/${p.slug}`}
                      className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-medium text-xs"
                    >
                      <span>Solve</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
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
