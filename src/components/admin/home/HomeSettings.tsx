// src/components/admin/home/HomeSettings.tsx
'use client';

import { useState } from 'react';
import styles from './HomeSettings.module.scss';
import HeroSettings from './HeroSettings';
import AboutSettings from './AboutSettings';
import ServicesSettings from './ServicesSettings';
import ClientSettings from './ClientSettings';

type HomeTab = 'hero' | 'about' | 'services' | 'clients';

const TABS: { key: HomeTab; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'clients', label: 'Clients' },
];

export default function HomeSettings() {
  const [active, setActive] = useState<HomeTab>('hero');

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2>Home</h2>
        <p>Manage the content shown on your homepage.</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Home Sub-Tabs">
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
        {active === 'hero' && <HeroSettings />}
        {active === 'about' && <AboutSettings />}
        {active === 'services' && <ServicesSettings />}
        {active === 'clients' && <ClientSettings />}
      </div>
    </section>
  );
}
