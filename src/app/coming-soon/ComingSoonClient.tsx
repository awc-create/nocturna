'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ComingSoonClient() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch('/api/site-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setErr('Incorrect password');
        return;
      }

      router.replace(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 44, margin: 0 }}>Coming soon</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          We’re finishing the site. If you have access, enter the password below.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Site password"
            autoComplete="current-password"
            required
            style={{
              padding: 14,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.35)',
              color: 'white',
              outline: 'none',
              fontSize: 16,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 14,
              borderRadius: 12,
              border: 0,
              cursor: 'pointer',
              fontSize: 16,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>

          {err ? <div style={{ color: '#ff6b6b' }}>{err}</div> : null}
        </form>
      </div>
    </main>
  );
}
