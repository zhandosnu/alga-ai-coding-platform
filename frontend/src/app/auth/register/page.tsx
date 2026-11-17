'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await register(name, email, password);
      router.push('/problems');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
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

      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="nav-logo" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>
            alga
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create your account</h1>
          <p style={{ fontSize: '0.875rem' }}>Start your competitive programming journey</p>
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
            <label className="form-label">Full Name</label>
            <input
              id="register-name"
              className="form-input"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="register-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="register-password"
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="register-submit"
            className="btn btn-primary"
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <span
                className="animate-spin"
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <hr className="divider" />

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent-primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
