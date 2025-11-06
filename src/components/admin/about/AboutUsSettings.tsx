// src/components/admin/about/AboutUsSettings.tsx
'use client';

import { useState } from 'react';
import styles from '../home/HomeSettings.module.scss'; // reuse same panel styles
import AboutHeroSettings from './AboutHeroSettings';

type Tab = 'hero' | 'founders' | 'values';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  // { key: 'founders', label: 'Founders' },
  // { key: 'values', label: 'Values' },
];

export default function AboutUsSettings() {
  const [active, setActive] = useState<Tab>('hero');

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2>About</h2>
        <p>Manage the content shown on your About page.</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="About Sub-Tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            className={`${styles.tab} ${active === t.key ? styles.active : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel">
        {active === 'hero' && <AboutHeroSettings />}
        {/* {active === 'founders' && <FoundersSettings />} */}
        {/* {active === 'values' && <ValuesSettings />} */}
      </div>
    </section>
  );
}
