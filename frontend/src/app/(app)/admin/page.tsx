'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { problemsApi, usersApi, submissionsApi } from '@/lib/api';

export default function AdminDashboard() {
  const { user, isInitialized, initialize } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({ problems: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isInitialized) initialize(); }, [isInitialized, initialize]);
  useEffect(() => {
    if (isInitialized && (!user || user.role !== 'admin')) router.push('/');
  }, [isInitialized, user, router]);

  useEffect(() => {
    Promise.all([
      problemsApi.list({ limit: 1 }),
      usersApi.leaderboard(1000),
    ]).then(([probs, users]) => {
      setStats({ problems: probs.total ?? probs.data?.length ?? 0, users: users.length });
    }).finally(() => setLoading(false));
  }, []);

  if (!user || user.role !== 'admin') return null;

  const cards = [
    { icon: '📝', label: 'Problems', value: stats.problems, href: '/admin/problems', color: '#7c6ff7', desc: 'Manage problem bank' },
    { icon: '👥', label: 'Users', value: stats.users, href: '/leaderboard', color: '#22c55e', desc: 'View leaderboard' },
    { icon: '⚙️', label: 'System', value: 'OK', href: '#', color: '#06b6d4', desc: 'Services running' },
  ];

  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚙️</span>
            <h1 style={{ margin: 0 }}>Admin Panel</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> — you have full access.
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {cards.map((c) => (
            <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '1.5rem', cursor: 'pointer', border: `1px solid ${c.color}22`, transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${c.color}55`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = `${c.color}22`)}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.625rem' }}>{c.icon}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{c.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>
                  {loading ? '—' : c.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{c.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: '➕ Add New Problem', href: '/admin/problems?new=1', primary: true },
              { label: '📋 View All Problems', href: '/admin/problems', primary: false },
              { label: '🏆 Leaderboard', href: '/leaderboard', primary: false },
              { label: '🧑‍💻 Problem Bank', href: '/problems', primary: false },
            ].map((a) => (
              <Link key={a.label} href={a.href}>
                <button className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>
                  {a.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
