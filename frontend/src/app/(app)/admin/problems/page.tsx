'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '@/lib/auth-store';
import { problemsApi } from '@/lib/api';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

/* ─── Types ─────────────────────────────────────────── */
interface TestCase { input: string; expectedOutput: string; isSample: boolean; }
interface Problem {
  _id: string; title: string; slug: string; difficulty: string;
  tags: string[]; isPublished: boolean; testCases: TestCase[];
  description: string; sampleInput: string; sampleOutput: string;
  constraints: string; timeLimit: number; memoryLimit: number;
}

const EMPTY_FORM: Omit<Problem, '_id'> = {
  title: '', slug: '', description: '', difficulty: 'Easy',
  tags: [] as any, // stored as CSV string in UI, converted on save
  timeLimit: 2000, memoryLimit: 256,
  sampleInput: '', sampleOutput: '', constraints: '',
  testCases: [{ input: '', expectedOutput: '', isSample: true }],
  isPublished: true,
};

/* ─── Helpers ─────────────────────────────────────────── */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444',
};

/* ─── Sub-components ─────────────────────────────────── */
function Alert({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  const colors = type === 'success'
    ? { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' }
    : { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', text: '#f87171' };
  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: colors.text, marginBottom: '1rem', fontSize: '0.875rem' }}>
      {children}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
function AdminProblemsContent() {
  const { user, isInitialized, initialize } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, tags: '' as any });
  const [descPreview, setDescPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (!isInitialized) initialize(); }, [isInitialized, initialize]);
  useEffect(() => {
    if (isInitialized && (!user || user.role !== 'admin')) router.push('/');
  }, [isInitialized, user, router]);

  // Open new form if ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') openNewForm();
  }, [searchParams]);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await problemsApi.listAdmin({ limit: 200 });
      setProblems(data.data ?? data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  /* ─── Form helpers ─── */
  const openNewForm = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, tags: '' });
    setError(''); setSuccessMsg('');
    setShowForm(true);
    setTimeout(() => document.getElementById('form-title')?.focus(), 100);
  };

  const openEditForm = async (p: Problem) => {
    try {
      const fullProblem = await problemsApi.getById(p._id);
      setEditId(fullProblem._id);
      setForm({
        ...fullProblem,
        tags: fullProblem.tags?.join(', ') ?? '',
      } as any);
      setError(''); setSuccessMsg('');
      setShowForm(true);
      setTimeout(() => document.getElementById('form-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      alert('Failed to load problem details. ' + err);
    }
  };

  const handleTitleChange = (title: string) => {
    setForm((f: any) => ({
      ...f, title,
      slug: f.slug || slugify(title), // only auto-fill if slug is empty
    }));
  };

  /* ─── CRUD ─── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string'
          ? (form.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
          : form.tags,
      };
      if (editId) {
        await problemsApi.update(editId, payload);
        setSuccessMsg('✅ Problem updated successfully!');
      } else {
        await problemsApi.create(payload);
        setSuccessMsg('✅ Problem created successfully!');
      }
      setShowForm(false);
      setEditId(null);
      fetchProblems();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed. Check all required fields.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await problemsApi.delete(id);
    fetchProblems();
  };

  const togglePublish = async (p: Problem) => {
    await problemsApi.update(p._id, { isPublished: !p.isPublished });
    fetchProblems();
  };

  /* ─── Test cases ─── */
  const addTestCase = () =>
    setForm((f: any) => ({ ...f, testCases: [...f.testCases, { input: '', expectedOutput: '', isSample: false }] }));
  const removeTestCase = (idx: number) =>
    setForm((f: any) => ({ ...f, testCases: f.testCases.filter((_: any, i: number) => i !== idx) }));
  const updateTC = (idx: number, field: string, value: any) =>
    setForm((f: any) => ({ ...f, testCases: f.testCases.map((tc: any, i: number) => i === idx ? { ...tc, [field]: value } : tc) }));

  if (!user || user.role !== 'admin') return null;

  /* ─── Filtered problems ─── */
  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = diffFilter === 'All' || p.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <Link href="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>⚙️ Admin</Link>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <h1 style={{ margin: 0, fontSize: '1.375rem' }}>Problems</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              {problems.length} total · {problems.filter(p => p.isPublished).length} published
            </p>
          </div>
          <button className="btn btn-primary" onClick={openNewForm} id="new-problem-btn">
            ➕ New Problem
          </button>
        </div>

        {successMsg && <Alert type="success">{successMsg}</Alert>}

        {/* ── Problem Form ── */}
        {showForm && (
          <div className="card animate-fade-in" style={{ marginBottom: '2rem', padding: '2rem' }} id="form-title">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{editId ? '✏️ Edit Problem' : '➕ New Problem'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); }}>✕ Close</button>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSave}>
              {/* Row 1: Title + Slug */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input id="form-title-input" className="form-input" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Two Sum" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input className="form-input" value={form.slug} onChange={(e) => setForm((f: any) => ({ ...f, slug: e.target.value }))} placeholder="two-sum" required style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
              </div>

              {/* Row 2: Difficulty + Tags + Time + Memory */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={form.difficulty} onChange={(e) => setForm((f: any) => ({ ...f, difficulty: e.target.value }))}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input className="form-input" value={form.tags} onChange={(e) => setForm((f: any) => ({ ...f, tags: e.target.value }))} placeholder="arrays, two-pointers, hash-map" />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Limit (ms)</label>
                  <input className="form-input" type="number" value={form.timeLimit} min={100} max={10000} onChange={(e) => setForm((f: any) => ({ ...f, timeLimit: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Memory Limit (MB)</label>
                  <input className="form-input" type="number" value={form.memoryLimit} min={16} max={1024} onChange={(e) => setForm((f: any) => ({ ...f, memoryLimit: +e.target.value }))} />
                </div>
              </div>

              {/* Description with Preview toggle */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Description * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Markdown)</span></label>
                  <button type="button" className={`btn btn-sm ${descPreview ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDescPreview(v => !v)}>
                    {descPreview ? '✏️ Edit' : '👁 Preview'}
                  </button>
                </div>
                {descPreview ? (
                  <div className="markdown-body" style={{ minHeight: 200, padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', lineHeight: 1.7, border: '1px solid var(--border-subtle)' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description || '*Nothing to preview*'}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ height: 220, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <MonacoEditor
                      height="220px"
                      language="markdown"
                      value={form.description}
                      onChange={(v) => setForm((f: any) => ({ ...f, description: v || '' }))}
                      theme="vs-dark"
                      options={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', minimap: { enabled: false }, wordWrap: 'on', lineNumbers: 'off', padding: { top: 12 } }}
                    />
                  </div>
                )}
              </div>

              {/* Constraints */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Constraints</label>
                <textarea className="form-input" rows={2} value={form.constraints} onChange={(e) => setForm((f: any) => ({ ...f, constraints: e.target.value }))} placeholder="1 ≤ n ≤ 10^5&#10;-10^9 ≤ nums[i] ≤ 10^9" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', resize: 'vertical' }} />
              </div>

              {/* Sample I/O */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Sample Input</label>
                  <textarea className="form-input" rows={3} value={form.sampleInput} onChange={(e) => setForm((f: any) => ({ ...f, sampleInput: e.target.value }))} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sample Output</label>
                  <textarea className="form-input" rows={3} value={form.sampleOutput} onChange={(e) => setForm((f: any) => ({ ...f, sampleOutput: e.target.value }))} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', resize: 'vertical' }} />
                </div>
              </div>

              {/* Test Cases */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Test Cases * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({form.testCases.length} cases)</span>
                  </label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addTestCase}>➕ Add Case</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {form.testCases.map((tc: TestCase, idx: number) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Case #{idx + 1}</span>
                          <label style={{ fontSize: '0.8125rem', display: 'flex', gap: '0.375rem', alignItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <input type="checkbox" checked={tc.isSample} onChange={(e) => updateTC(idx, 'isSample', e.target.checked)} />
                            Sample (shown to users)
                          </label>
                        </div>
                        {form.testCases.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTestCase(idx)}>✕ Remove</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Input</label>
                          <textarea className="form-input" rows={3} value={tc.input} onChange={(e) => updateTC(idx, 'input', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', resize: 'vertical' }} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Expected Output</label>
                          <textarea className="form-input" rows={3} value={tc.expectedOutput} onChange={(e) => updateTC(idx, 'expectedOutput', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', resize: 'vertical' }} required />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publish toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f: any) => ({ ...f, isPublished: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  <strong>Publish immediately</strong>
                </label>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {form.isPublished ? 'Visible to all students' : 'Hidden — draft only'}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      Saving…
                    </span>
                  ) : editId ? '💾 Update Problem' : '✅ Create Problem'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="🔍 Search by title or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${diffFilter === d ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDiffFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Problems Table ── */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th style={{ textAlign: 'center' }}>Tests</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {[220, 70, 150, 40, 60, 130].map((w, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 18, width: w, borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{p.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{p.slug}</div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${DIFFICULTY_COLORS[p.difficulty]}22`, color: DIFFICULTY_COLORS[p.difficulty], border: `1px solid ${DIFFICULTY_COLORS[p.difficulty]}44` }}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {p.tags?.slice(0, 3).map((t) => (
                            <span key={t} style={{ fontSize: '0.6875rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '1px 7px', color: 'var(--text-muted)' }}>{t}</span>
                          ))}
                          {p.tags?.length > 3 && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>+{p.tags.length - 3}</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: p.testCases?.length > 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                          {p.testCases?.length ?? 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => togglePublish(p)}
                          style={{ border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, color: p.isPublished ? '#22c55e' : '#f59e0b', background: p.isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)' }}
                          title={p.isPublished ? 'Click to unpublish' : 'Click to publish'}
                        >
                          {p.isPublished ? '● Published' : '○ Draft'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/problems/${p._id}`} target="_blank">
                            <button className="btn btn-ghost btn-sm" title="Preview">👁</button>
                          </Link>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(p)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id, p.title)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    {problems.length === 0 ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
                        <p>No problems yet.</p>
                        <button className="btn btn-primary" onClick={openNewForm} style={{ marginTop: '0.75rem' }}>Create your first problem</button>
                      </>
                    ) : 'No problems match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

import { Suspense } from 'react';
export default function AdminProblemsPage() {
  return (
    <Suspense fallback={<div className="page-content container">Loading admin...</div>}>
      <AdminProblemsContent />
    </Suspense>
  );
}
