'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { submissionsApi, recommendationsApi } from '@/lib/api';

const VERDICT_LABELS: Record<string, { label: string; color: string }> = {
  AC: { label: 'Accepted', color: 'var(--verdict-ac)' },
  WA: { label: 'Wrong Answer', color: 'var(--verdict-wa)' },
  TLE: { label: 'Time Limit Exceeded', color: 'var(--verdict-tle)' },
  MLE: { label: 'Memory Limit Exceeded', color: 'var(--verdict-mle)' },
  RE: { label: 'Runtime Error', color: 'var(--verdict-re)' },
  CE: { label: 'Compile Error', color: 'var(--verdict-ce)' },
  PENDING: { label: 'Judging...', color: 'var(--verdict-pending)' },
};

export default function DashboardPage() {
  const { user, isInitialized, initialize } = useAuthStore();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recommended, setRecommended] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [isInitialized, initialize]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/auth/login');
    }
  }, [isInitialized, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      submissionsApi.getMy({ limit: 10 }),
      recommendationsApi.stats(),
      recommendationsApi.next(),
    ]).then(([subs, s, rec]) => {
      setSubmissions(subs.data);
      setStats(s);
      setRecommended(rec);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (!user || loading) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="skeleton" style={{ height: 40, width: '30%', marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  const solvedCount = stats?.solvedProblems || 0;
  const totalSubs = stats?.totalSubmissions || 0;
  const acRate = totalSubs > 0 ? Math.round((stats?.acSubmissions / totalSubs) * 100) : 0;

  return (
    <div className="page-content animate-fade-in">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.25rem' }}>My Dashboard</h1>
          <p>Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong></p>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Problems Solved', value: solvedCount, icon: '✅', color: 'var(--verdict-ac)' },
            { label: 'Submissions', value: totalSubs, icon: '📤', color: 'var(--accent-primary)' },
            { label: 'AC Rate', value: `${acRate}%`, icon: '🎯', color: 'var(--accent-info)' },
            { label: 'Rating', value: user.stats?.rating || 1000, icon: '⭐', color: 'var(--verdict-tle)' },
          ].map((card) => (
            <div key={card.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{card.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Recent Submissions */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Recent Submissions</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Verdict</th>
                    <th>Lang</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No submissions yet.{' '}
                        <Link href="/problems" style={{ color: 'var(--accent-primary)' }}>
                          Start solving!
                        </Link>
                      </td>
                    </tr>
                  )}
                  {submissions.map((sub) => {
                    const v = VERDICT_LABELS[sub.verdict] || VERDICT_LABELS.PENDING;
                    return (
                      <tr key={sub._id}>
                        <td>
                          <Link href={`/problems/${sub.problemId?._id || sub.problemId}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {sub.problemId?.title || '—'}
                          </Link>
                        </td>
                        <td>
                          <span className={`verdict-badge verdict-${sub.verdict}`}>{sub.verdict}</span>
                        </td>
                        <td style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{sub.language}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{sub.runtime}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recommended */}
            {recommended && (
              <div className="card" style={{ background: 'rgba(124,111,247,0.06)', border: '1px solid rgba(124,111,247,0.2)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  ✦ Recommended for you
                </div>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{recommended.title}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className={`badge badge-${recommended.difficulty?.toLowerCase()}`}>{recommended.difficulty}</span>
                  {recommended.tags?.slice(0, 2).map((t: string) => (
                    <span key={t} className="badge badge-tag">{t}</span>
                  ))}
                </div>
                <Link href={`/problems/${recommended._id}`} className="btn btn-primary btn-sm">
                  Solve Now →
                </Link>
              </div>
            )}

            {/* Weak Tags */}
            {user.stats?.weakTags?.length > 0 && (
              <div className="card">
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                  Areas to Improve
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {user.stats.weakTags.slice(0, 8).map((tag: string) => (
                    <Link key={tag} href={`/problems?tag=${tag}`} className="badge badge-tag" style={{ cursor: 'pointer' }}>
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tag Performance */}
            {stats?.tagPerformance?.length > 0 && (
              <div className="card">
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  Tag Performance
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {stats.tagPerformance.slice(0, 6).map((t: any) => (
                    <div key={t._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{t._id}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {t.ac}/{t.total}
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round(t.rate * 100)}%`,
                            background: t.rate >= 0.7 ? 'var(--verdict-ac)' : t.rate >= 0.4 ? 'var(--verdict-tle)' : 'var(--verdict-wa)',
                            borderRadius: 999,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
