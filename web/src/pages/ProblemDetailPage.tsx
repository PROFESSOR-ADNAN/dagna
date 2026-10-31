import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../services/api.js';
import { CodeEditor } from '../editor/CodeEditor.js';
import { useAuth } from '../context/AuthContext.js';
import { LANGUAGES, SupportedLanguage, LANGUAGE_REGISTRY } from '@dagna/shared';
import { Send, Clock, Cpu, Copy, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ProblemDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [problem, setProblem] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(LANGUAGES.CPP);
  const [sourceCode, setSourceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadProblem() {
      try {
        const data = await apiRequest(`/problems/${slug}`);
        if (data.success) {
          setProblem(data.problem);
        }
      } catch (err) {
        console.error('Failed to load problem:', err);
      }
    }
    loadProblem();
  }, [slug]);

  const handleCopySample = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('Please sign in to submit code.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ state: 'queued' });

    try {
      const clientSubmissionId = crypto.randomUUID();
      const res = await apiRequest('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          problemId: problem.id,
          language: selectedLanguage,
          source: sourceCode,
          clientSubmissionId,
        }),
      });

      if (res.success) {
        setSubmissionStatus({ id: res.submission.id, state: 'queued' });
        // Poll for outcome (fallback to SSE)
        pollSubmission(res.submission.id);
      }
    } catch (err: any) {
      alert(err.message || 'Submission failed');
      setIsSubmitting(false);
      setSubmissionStatus(null);
    }
  };

  const pollSubmission = (subId: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await apiRequest(`/submissions/${subId}`);
        if (data.success && data.submission.state === 'judged') {
          setSubmissionStatus(data.submission);
          setIsSubmitting(false);
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
        setIsSubmitting(false);
      }
    }, 2000);
  };

  if (!problem) {
    return <div className="text-center py-20 text-slate-400">{t('common.loading')}</div>;
  }

  const statement =
    i18n.language === 'am' && problem.statements?.am
      ? problem.statements.am
      : problem.statements?.en || {
          title: problem.title,
          description: 'Problem statement description.',
          inputFormat: 'Standard Input',
          outputFormat: 'Standard Output',
        };

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto py-6">
      {/* Left Column: Problem Statement & Samples */}
      <div className="space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{statement.title || problem.title}</h1>
            <span className="bg-slate-800 text-sky-400 text-xs px-2.5 py-1 rounded font-mono font-semibold">
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400 mt-3 font-mono">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Time Limit: {problem.limits.cpuTimeMs} ms</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>Memory Limit: {problem.limits.memoryLimitMB} MB</span>
            </span>
          </div>
        </div>

        {/* Statement Body */}
        <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-sm leading-relaxed">
          <p>{statement.description}</p>

          <h3 className="text-base font-bold text-white mt-6">{t('problem.inputFormat')}</h3>
          <p>{statement.inputFormat}</p>

          <h3 className="text-base font-bold text-white mt-6">{t('problem.outputFormat')}</h3>
          <p>{statement.outputFormat}</p>

          {/* Sample Tests */}
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-bold text-white">{t('problem.samples')}</h3>
            {problem.samples.map((sample: any, idx: number) => (
              <div key={idx} className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>Input #{idx + 1}</span>
                    <button
                      onClick={() => handleCopySample(sample.input, idx)}
                      className="hover:text-white transition flex items-center space-x-1"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === idx ? t('problem.copied') : t('problem.copy')}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 p-2.5 rounded text-xs font-mono text-slate-200 overflow-x-auto">
                    {sample.input}
                  </pre>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1 font-mono">Output #{idx + 1}</div>
                  <pre className="bg-slate-900 p-2.5 rounded text-xs font-mono text-slate-200 overflow-x-auto">
                    {sample.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Code Editor & Submission Outcome */}
      <div className="space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 uppercase font-bold font-mono">
              {t('problem.language')}:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-sky-500 font-mono"
            >
              {Object.values(LANGUAGE_REGISTRY).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !sourceCode.trim()}
            className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : t('problem.submit')}</span>
          </button>
        </div>

        {/* Code Editor */}
        <CodeEditor
          problemId={problem.id}
          language={selectedLanguage}
          onCodeChange={setSourceCode}
        />

        {/* Live Submission Status Card */}
        {submissionStatus && (
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">Live Evaluation Status</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                  submissionStatus.verdict === 'AC'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                    : submissionStatus.verdict === 'WA'
                    ? 'bg-red-500/20 text-red-400 border border-red-400/30'
                    : submissionStatus.verdict === 'TLE'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                    : 'bg-sky-500/20 text-sky-400'
                }`}
              >
                {submissionStatus.verdict || submissionStatus.state}
              </span>
            </div>

            {submissionStatus.verdict && (
              <div className="flex items-center space-x-6 text-xs text-slate-300 font-mono pt-1">
                <span>Time: {submissionStatus.timeMs} ms</span>
                <span>Memory: {Math.round(submissionStatus.memoryKB / 1024)} MB</span>
                {submissionStatus.failedTest && (
                  <span className="text-red-400">Failed on Test #{submissionStatus.failedTest}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
