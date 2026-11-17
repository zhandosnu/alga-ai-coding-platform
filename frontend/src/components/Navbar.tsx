'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [initialize, isInitialized]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { href: '/problems', label: 'Problems' },
    { href: '/leaderboard', label: 'Leaderboard' },
    ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="nav-logo">
          alga
        </Link>

        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link ${pathname.startsWith(link.href) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {user.name}
              </span>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '4px 12px', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 700,
                    background: 'rgba(124,111,247,0.15)', color: 'var(--accent-primary)',
                    border: '1px solid rgba(124,111,247,0.35)', textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  ⚙️ Admin
                </Link>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
