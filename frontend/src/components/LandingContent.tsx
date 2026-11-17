'use client';

import Link from 'next/link';

export default function LandingContent() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: 'radial-gradient(ellipse at center, rgba(124,111,247,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124,111,247,0.12)', border: '1px solid rgba(124,111,247,0.2)', borderRadius: '999px', padding: '0.375rem 1rem', fontSize: '0.8125rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '2rem' }}>
            ✦ AI-Powered Competitive Programming
          </div>

          <h1 style={{ marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Train Smarter with<br />
            <span className="text-gradient">Intelligent Guidance</span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem' }}>
            Alga is an adaptive programming platform that guides you with AI-powered hints,
            secure Docker code execution, and personalized problem recommendations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              Start Training Free →
            </Link>
            <Link href="/problems" className="btn btn-secondary btn-lg">
              Browse Problems
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 0', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          {[
            { value: '500+', label: 'Problems' },
            { value: '3', label: 'AI Models' },
            { value: 'C++ & Python', label: 'Languages' },
            { value: 'Isolated', label: 'Sandbox' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Everything you need to level up</h2>
          <p style={{ textAlign: 'center', marginBottom: '3rem' }}>Built for programmers who want to learn, not just solve.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🛡️', title: 'Secure Sandbox', desc: 'Every submission runs in an isolated Docker container with CPU, memory, and time limits enforced. Network access is disabled.' },
              { icon: '🤖', title: 'AI Hint Engine', desc: "Powered by local Ollama LLMs (DeepSeek, Gemma, GLM4), our Socratic tutor guides you step by step without giving away the full answer." },
              { icon: '📈', title: 'Adaptive Recommendations', desc: "The platform analyzes your weak areas and skill rating to suggest exactly the right difficulty problem next." },
              { icon: '⚡', title: 'Real-Time Judging', desc: 'Instant verdicts: Accepted, Wrong Answer, TLE, MLE, Runtime Error, or Compile Error with detailed feedback.' },
              { icon: '📊', title: 'Progress Dashboard', desc: 'Track your submission history, tag performance analytics, and see your global ranking at a glance.' },
              { icon: '🏆', title: 'Global Leaderboard', desc: 'Compete with other students and see where you stand across the entire community.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h3 style={{ fontSize: '1.125rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', flex: 1 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>How Alga works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', maxWidth: 900, margin: '0 auto' }}>
            {[
              { step: '01', title: 'Pick a problem', desc: 'Browse by difficulty, tags, or get an AI recommendation based on your weak areas.' },
              { step: '02', title: 'Write your code', desc: 'Use a Monaco editor (VS Code in the browser) with C++ or Python support.' },
              { step: '03', title: 'Get AI hints', desc: "Stuck? Click 'Get Hint' and our AI will guide you Socratically — no spoilers." },
              { step: '04', title: 'Submit & judge', desc: 'Your code runs in a secure Docker sandbox and you get a verdict in seconds.' },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,111,247,0.15)', border: '1px solid rgba(124,111,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {s.step}
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{s.title}</h4>
                <p style={{ fontSize: '0.875rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to start your journey?</h2>
          <p style={{ marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
            Join the platform and get personalized AI coaching on every problem.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Alga — AI-Powered Competitive Programming Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
