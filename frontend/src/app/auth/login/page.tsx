'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/problems');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(124,111,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card animate-fade-in"
        style={{ width: '100%', maxWidth: '420px', position: 'relative' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="nav-logo" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>
            alga
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p style={{ fontSize: '0.875rem' }}>Sign in to continue your training</p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--accent-danger)',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit"
            className="btn btn-primary"
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <hr className="divider" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--accent-primary)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
