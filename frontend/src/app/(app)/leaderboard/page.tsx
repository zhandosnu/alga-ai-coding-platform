'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  stats: { solved: number; attempted: number; rating: number };
  createdAt: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: '1.375rem' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '1.375rem' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '1.375rem' }}>🥉</span>;
  return (
    <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>#{rank}</span>
  );
}

function AccuracyBar({ solved, attempted }: { solved: number; attempted: number }) {
  const pct = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--bg-elevated)', minWidth: 60 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const tier = rating >= 2000 ? { label: 'Grandmaster', color: '#ef4444' }
    : rating >= 1600 ? { label: 'Master', color: '#a855f7' }
    : rating >= 1400 ? { label: 'Expert', color: '#3b82f6' }
    : rating >= 1200 ? { label: 'Specialist', color: '#06b6d4' }
    : { label: 'Pupil', color: '#6b7280' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <span style={{ fontWeight: 700, color: tier.color, fontSize: '0.9375rem' }}>{rating}</span>
      <span style={{ fontSize: '0.6875rem', background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44`, borderRadius: 999, padding: '1px 7px', fontWeight: 600 }}>
        {tier.label}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    usersApi.leaderboard(100).then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const top3 = users.slice(0, 3);

  return (
    <div className="page-content animate-fade-in">
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>🏆 Global Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ranked by problems solved · Rating adjusts per result</p>
        </div>

        {/* Top 3 Podium */}
        {!loading && top3.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '1rem', marginBottom: '2.5rem', alignItems: 'flex-end' }}>
            {[top3[1], top3[0], top3[2]].map((u, pos) => {
              const rank = pos === 0 ? 2 : pos === 1 ? 1 : 3;
              const isFirst = rank === 1;
              const colors = ['#c0c0c0', '#fbbf24', '#cd7f32'];
              const color = colors[rank - 1];
              return (
                <div key={u._id} className="card" style={{
                  textAlign: 'center', padding: '1.5rem 1rem',
                  border: `1px solid ${color}44`,
                  background: `${color}08`,
                  marginTop: isFirst ? 0 : '1.25rem',
                  position: 'relative',
                }}>
                  {isFirst && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: '1.25rem' }}>👑</div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontWeight: 800, fontSize: '1.125rem', color }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {u.email.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{u.stats?.solved ?? 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>problems solved</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ⭐ {u.stats?.rating ?? 1000}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            className="form-input"
            placeholder="🔍 Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

        {/* Stats summary row */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Users', value: users.length },
              { label: 'Total Solved', value: users.reduce((s, u) => s + (u.stats?.solved ?? 0), 0) },
              { label: 'Avg. Rating', value: Math.round(users.reduce((s, u) => s + (u.stats?.rating ?? 1000), 0) / (users.length || 1)) },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Full Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Rank</th>
                <th>User</th>
                <th>Solved</th>
                <th>Attempted</th>
                <th>Accuracy</th>
                <th>Rating</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 16, width: j === 1 ? 140 : 60, borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map((u, idx) => {
                    const globalRank = users.findIndex(x => x._id === u._id) + 1;
                    const isMe = currentUser && (currentUser as any)._id === u._id;
                    return (
                      <tr key={u._id} style={{ background: isMe ? 'rgba(124,111,247,0.06)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <RankBadge rank={globalRank} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? 'rgba(124,111,247,0.2)' : 'var(--bg-elevated)', border: `1px solid ${isMe ? 'rgba(124,111,247,0.4)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', color: isMe ? 'var(--accent-primary)' : 'var(--text-secondary)', flexShrink: 0 }}>
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isMe ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                {u.name} {isMe && <span style={{ fontSize: '0.65rem', background: 'rgba(124,111,247,0.15)', color: 'var(--accent-primary)', borderRadius: 999, padding: '1px 6px', marginLeft: 4 }}>You</span>}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '1rem' }}>{u.stats?.solved ?? 0}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {u.stats?.attempted ?? 0}
                        </td>
                        <td style={{ minWidth: 100 }}>
                          <AccuracyBar solved={u.stats?.solved ?? 0} attempted={u.stats?.attempted ?? 0} />
                        </td>
                        <td>
                          <RatingBadge rating={u.stats?.rating ?? 1000} />
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
