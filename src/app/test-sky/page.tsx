'use client';

import { useEffect, useState } from 'react';
import SkyOverlay from '@/components/theme/SkyOverlay';
import styles from './page.module.scss';

export default function TestSkyPage() {
  const [night, setNight] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    const diags: string[] = [];
    const root = document.documentElement;

    // --- check elements exist
    const sky = document.querySelector<HTMLElement>('.' + styles.__noop); // noop to keep module import
    const skyOverlay = document.querySelector<HTMLElement>('.skyOverlay');
    const skyStars = document.querySelector<HTMLElement>('.skyOverlayStars');
    const skyHorizon = document.querySelector<HTMLElement>('.skyHorizon');
    const siteGrain = document.querySelector<HTMLElement>('.site-grain');
    const appShell = document.querySelector<HTMLElement>('.app-shell');

    if (!skyOverlay || !skyStars || !skyHorizon) {
      diags.push(
        '❌ SkyOverlay not rendering all 3 layers. Check <SkyOverlay/> in layout.tsx and style import casing.'
      );
    }

    // --- check z-index stacking
    const zi = (el?: HTMLElement | null) =>
      el ? getComputedStyle(el).zIndex || '(auto)' : '(missing)';
    const ziOverlay = zi(skyOverlay);
    const ziStars = zi(skyStars);
    const ziHorizon = zi(skyHorizon);
    const ziGrain = zi(siteGrain);
    const ziApp = zi(appShell);

    if (ziOverlay !== '0' || ziStars !== '0' || ziHorizon !== '0') {
      diags.push(
        `⚠️ Sky layers z-index should be 0. Got overlay=${ziOverlay}, stars=${ziStars}, horizon=${ziHorizon}.`
      );
    }
    if (ziGrain !== '1') diags.push(`⚠️ .site-grain z-index should be 1. Got ${ziGrain}.`);
    if (ziApp !== '2') diags.push(`⚠️ .app-shell z-index should be 2. Got ${ziApp}.`);

    // --- check body/html backgrounds
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    if (bodyBg !== 'rgba(0, 0, 0, 0)') {
      diags.push(`⚠️ body background should be transparent. Got ${bodyBg}.`);
    }
    if (!htmlBg) {
      diags.push('⚠️ html background should be a dark color (#0b0b0b).');
    }

    // read initial --night-t
    const val = getComputedStyle(root).getPropertyValue('--night-t').trim();
    setNight(val || '(unset)');

    setDiagnostics(diags);
  }, []);

  const setNightVar = (t: number) => {
    document.documentElement.style.setProperty('--night-t', String(t));
    setNight(String(t));
  };

  return (
    <div className={styles.wrap}>
      {/* SKY */}
      <SkyOverlay mode="hybrid" strength={1} topPaddingPx={70} />

      {/* GRAIN (same as your layout) */}
      <div className="site-grain" aria-hidden="true" />

      {/* CONTENT */}
      <div className="app-shell">
        <header className={styles.header}>
          <h1>Sky Theme Proof</h1>
          <p className={styles.muted}>This page exists only to verify the Midnight Luxury sky.</p>

          <div className={styles.controls}>
            <button onClick={() => setNightVar(0)}>Set night-t = 0 (navy)</button>
            <button onClick={() => setNightVar(0.4)}>night-t = 0.4</button>
            <button onClick={() => setNightVar(0.8)}>night-t = 0.8</button>
            <button onClick={() => setNightVar(1)}>night-t = 1 (black)</button>
            <span className={styles.readout}>
              current: <code>{night}</code>
            </span>
          </div>

          {diagnostics.length > 0 && (
            <div className={styles.diag}>
              <strong>Diagnostics:</strong>
              <ul>
                {diagnostics.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <section className={styles.panel}>
          <h2>Floating Panel</h2>
          <p>
            This section is semi-translucent. You should see the navy → black sky behind it, with a
            faint horizon glow mid-page and subtle stars.
          </p>
        </section>

        <section className={styles.panel}>
          <h2>Another Panel</h2>
          <p>
            Scroll down. In hybrid mode, the night deepens softly as you move. Use the buttons above
            to force the level if needed.
          </p>
        </section>

        <footer className={styles.footer}>
          <small>
            Done? Go to <code>/</code> and confirm the theme shows behind Hero/About/Services.
          </small>
        </footer>
      </div>
    </div>
  );
}
