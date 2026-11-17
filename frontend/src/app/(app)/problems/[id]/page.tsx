'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { problemsApi, submissionsApi, hintsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANG_CONFIG: Record<string, { monacoLang: string; defaultCode: string }> = {
  cpp: {
    monacoLang: 'cpp',
    defaultCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your solution here
    
    return 0;
}`,
  },
  python: {
    monacoLang: 'python',
    defaultCode: `import sys
input = sys.stdin.readline

def main():
    # Your solution here
    pass

if __name__ == '__main__':
    main()`,
  },
};

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  sampleInput: string;
  sampleOutput: string;
  constraints: string;
}

interface Submission {
  _id: string;
  verdict: string;
  runtime: number;
  memory: number;
  testCasesTotal: number;
  testCasesPassed: number;
  errorMessage?: string;
  output?: string;
  aiFeedback?: string;
  language: string;
  createdAt: string;
}

interface HintMsg {
  role: 'user' | 'assistant';
  content: string;
}

const VERDICT_COLORS: Record<string, string> = {
  AC: '#22c55e', WA: '#ef4444', TLE: '#f59e0b',
  CE: '#f97316', RE: '#a855f7', MLE: '#06b6d4', PENDING: '#6b7280',
};

function VerdictBadge({ verdict }: { verdict: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
        background: `${VERDICT_COLORS[verdict] || '#6b7280'}22`,
        color: VERDICT_COLORS[verdict] || '#6b7280',
        border: `1px solid ${VERDICT_COLORS[verdict] || '#6b7280'}44`,
        letterSpacing: '0.05em',
      }}
    >
      {verdict === 'PENDING' ? '⏳' : verdict === 'AC' ? '✓' : '✗'} {verdict}
    </span>
  );
}

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState<'cpp' | 'python'>('cpp');
  const [code, setCode] = useState(LANG_CONFIG.cpp.defaultCode);

  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'hints'>('description');
  const [hintMessages, setHintMessages] = useState<HintMsg[]>([]);
  const [hintLevel, setHintLevel] = useState(1);
  const [hintLoading, setHintLoading] = useState(false);
  const hintsEndRef = useRef<HTMLDivElement>(null);

  // Load problem
  useEffect(() => {
    problemsApi.getById(id).then(setProblem).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Load persisted submissions on mount (survives refresh)
  const loadSubmissions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await submissionsApi.getByProblem(id);
      setSubmissions(data);
      if (data.length > 0) setSelectedSub(data[0]);
    } catch { /* not logged in or no subs */ }
  }, [id, user]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  // Poll a pending submission
  useEffect(() => {
    if (!pollingId) return;
    const interval = setInterval(async () => {
      const sub = await submissionsApi.getById(pollingId);
      if (sub.verdict !== 'PENDING') {
        setPollingId(null);
        clearInterval(interval);
        // Reload all submissions to get the updated one with aiFeedback
        await loadSubmissions();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [pollingId, loadSubmissions]);

  useEffect(() => {
    hintsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hintMessages]);

  const handleLanguageChange = (lang: 'cpp' | 'python') => {
    setLanguage(lang);
    setCode(LANG_CONFIG[lang].defaultCode);
  };

  const handleSubmit = async () => {
    if (!user) { alert('Please login to submit'); return; }
    setSubmitting(true);
    try {
      const sub = await submissionsApi.submit({ problemId: id, code, language });
      setSubmissions((prev) => [sub, ...prev]);
      setSelectedSub(sub);
      setPollingId(sub._id);
      setActiveTab('submissions');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHintRequest = async () => {
    if (!user) { alert('Please login to get hints'); return; }
    setHintLoading(true);
    setActiveTab('hints');
    try {
      const res = await hintsApi.request({ problemId: id, code, language, hintLevel });
      setHintMessages((prev) => [...prev, { role: 'assistant', content: res.hint }]);
    } catch {
      setHintMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ AI service unavailable. Please try again.' }]);
    } finally {
      setHintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="skeleton" style={{ height: 40, width: '40%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (!problem) {
    return <div className="page-content" style={{ textAlign: 'center' }}><h2>Problem not found</h2></div>;
  }

  const latestSub = pollingId ? submissions.find(s => s._id === pollingId) : null;
  const isPending = pollingId !== null;

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
      {/* ─── Left Panel ─── */}
      <div style={{ width: '45%', minWidth: 340, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>{problem.title}</h2>
            <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <span>⏱ {problem.timeLimit}ms</span>
            <span>💾 {problem.memoryLimit}MB</span>
            {submissions.length > 0 && (
              <span style={{ color: submissions.some(s => s.verdict === 'AC') ? '#22c55e' : 'var(--text-muted)' }}>
                {submissions.some(s => s.verdict === 'AC') ? '✓ Solved' : `${submissions.length} attempt${submissions.length > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          {(['description', 'submissions', 'hints'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                textTransform: 'capitalize',
                position: 'relative',
              }}
            >
              {tab}
              {tab === 'submissions' && submissions.length > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--accent-primary)', color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: '0.625rem', fontWeight: 700 }}>
                  {submissions.length}
                </span>
              )}
              {tab === 'submissions' && isPending && (
                <span className="animate-pulse" style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* ── Description Tab ── */}
          {activeTab === 'description' && (
            <div className="animate-fade-in">
              {problem.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {problem.tags.map((t) => <span key={t} className="badge badge-tag">{t}</span>)}
                </div>
              )}
              <div className="markdown-body" style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
              </div>
              {problem.constraints && (
                <>
                  <hr className="divider" />
                  <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Constraints</h4>
                  <pre style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {problem.constraints}
                  </pre>
                </>
              )}
              {problem.sampleInput && (
                <>
                  <hr className="divider" />
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sample</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[['Input', problem.sampleInput], ['Output', problem.sampleOutput]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{label}</div>
                        <pre style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', margin: 0 }}>{val}</pre>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Submissions Tab (PERSISTENT) ── */}
          {activeTab === 'submissions' && (
            <div className="animate-fade-in">
              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
                  <p>No submissions yet. Write your solution and hit Submit!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {submissions.map((sub) => (
                    <button
                      key={sub._id}
                      onClick={() => setSelectedSub(selectedSub?._id === sub._id ? null : sub)}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        padding: '0.875rem 1rem',
                        background: selectedSub?._id === sub._id ? 'rgba(124,111,247,0.08)' : 'var(--bg-secondary)',
                        border: `1px solid ${selectedSub?._id === sub._id ? 'rgba(124,111,247,0.3)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {sub.verdict === 'PENDING' ? (
                            <span className="animate-pulse" style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>⏳ Judging…</span>
                          ) : (
                            <VerdictBadge verdict={sub.verdict} />
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {sub.language === 'cpp' ? 'C++17' : 'Python 3'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sub.verdict !== 'PENDING' && <span>{sub.testCasesPassed}/{sub.testCasesTotal} tests</span>}
                          {sub.runtime > 0 && <span>⏱ {sub.runtime}ms</span>}
                          <span>{formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {selectedSub?._id === sub._id && sub.verdict !== 'PENDING' && (
                        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                          {sub.errorMessage && (
                            <pre style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto', margin: '0 0 0.75rem' }}>
                              {sub.errorMessage}
                            </pre>
                          )}
                          {/* AI Feedback */}
                          {sub.aiFeedback ? (
                            <div style={{ background: 'rgba(124,111,247,0.06)', border: '1px solid rgba(124,111,247,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                🤖 AI Feedback
                              </div>
                              <div style={{ fontSize: '0.8125rem', lineHeight: 1.65 }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{sub.aiFeedback}</ReactMarkdown>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              AI feedback generating…
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Hints Tab ── */}
          {activeTab === 'hints' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Level:</span>
                {([1, 2, 3] as const).map((level) => (
                  <button key={level} onClick={() => setHintLevel(level)} className={`btn btn-sm ${hintLevel === level ? 'btn-primary' : 'btn-secondary'}`}>
                    {level === 1 ? '🌱 Gentle' : level === 2 ? '💡 Medium' : '🎯 Direct'}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hintMessages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🤖</div>
                    <p>Click <strong>Get Hint</strong> to get Socratic guidance</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>The AI guides you without revealing the full answer.</p>
                  </div>
                )}
                {hintMessages.map((msg, i) => (
                  <div key={i} className="animate-fade-in" style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', background: msg.role === 'assistant' ? 'rgba(124,111,247,0.08)' : 'var(--bg-elevated)', border: `1px solid ${msg.role === 'assistant' ? 'rgba(124,111,247,0.2)' : 'var(--border-subtle)'}`, fontSize: '0.875rem', lineHeight: 1.7 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: msg.role === 'assistant' ? 'var(--accent-primary)' : 'var(--text-muted)', marginBottom: '0.375rem' }}>
                      {msg.role === 'assistant' ? '🤖 Alga AI' : '👤 You'}
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ))}
                {hintLoading && (
                  <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(124,111,247,0.06)', border: '1px solid rgba(124,111,247,0.15)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Alga AI is thinking…
                  </div>
                )}
                <div ref={hintsEndRef} />
              </div>
              {hintMessages.length > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '0.75rem' }} onClick={async () => { await hintsApi.clearSession(id); setHintMessages([]); }}>
                  Clear conversation
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Panel — Editor ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-primary)' }}>
        {/* Toolbar */}
        <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <select id="language-select" className="form-select" value={language} onChange={(e) => handleLanguageChange(e.target.value as 'cpp' | 'python')} style={{ width: 'auto' }}>
            <option value="cpp">C++17</option>
            <option value="python">Python 3</option>
          </select>
          <div style={{ flex: 1 }} />
          <button id="request-hint-btn" className="btn btn-secondary btn-sm" onClick={handleHintRequest} disabled={hintLoading}>
            {hintLoading ? '...' : '🤖 Get Hint'}
          </button>
          <button id="submit-btn" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting || !user} style={{ minWidth: 100 }}>
            {submitting || isPending ? (
              <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : '▶ Submit'}
          </button>
        </div>

        {/* Judging status bar */}
        {isPending && (
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#f59e0b' }}>
            <span className="animate-spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Judging submission… (AI feedback will appear in Submissions tab when done)
          </div>
        )}

        {/* Monaco Editor */}
        <div style={{ flex: 1 }}>
          <MonacoEditor
            height="100%"
            language={LANG_CONFIG[language].monacoLang}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              padding: { top: 16, bottom: 16 },
              cursorBlinking: 'smooth',
              smoothScrolling: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
