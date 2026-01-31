// src/app/auth/signin/SignInClient.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import styles from './SignIn.module.scss';

export default function SignInClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = useMemo(() => sp.get('callbackUrl') ?? '/admin', [sp]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    setLoading(false);

    if (!res?.ok) {
      setErr('Invalid email or password.');
      return;
    }

    router.replace(res.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.badge}>Admin</div>
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.sub}>Use your admin email and password to continue.</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              autoComplete="email"
              placeholder="admin@Essentia.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.passwordRow}>
              <input
                id="password"
                className={styles.input}
                type={showPw ? 'text' : 'password'}
                value={password}
                autoComplete="current-password"
                placeholder="••••••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.toggle} onClick={() => setShowPw((v) => !v)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {err && <div className={styles.error}>{err}</div>}

          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
