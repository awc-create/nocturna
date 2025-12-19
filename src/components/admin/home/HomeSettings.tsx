// src/components/admin/home/HomeSettings.tsx
'use client';

import { useState, type ChangeEvent } from 'react';
import styles from './HomeSettings.module.scss';
import HeroSettings from './HeroSettings';
import AboutSettings from './AboutSettings';
import ServicesSettings from './ServicesSettings';
import ClientSettings from './ClientSettings';
import EnquireSettings from './EnquireSettings';
import JoinSettings from './JoinSettings';
import ContactSettings from './ContactSettings'; // ← NEW

type HomeTab = 'hero' | 'about' | 'services' | 'clients' | 'enquire' | 'join' | 'contact'; // ← NEW

const TABS: { key: HomeTab; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'clients', label: 'Clients' },
  { key: 'enquire', label: 'Enquire form' },
  { key: 'join', label: 'Join roster form' },
  { key: 'contact', label: 'Contact' }, // ← NEW
];

export default function HomeSettings() {
  const [active, setActive] = useState<HomeTab>('hero');

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActive(e.target.value as HomeTab);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2>Home</h2>
          <p>Manage the content shown on your homepage.</p>
        </div>

        <nav className={styles.tabs} role="tablist" aria-label="Home sections">
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => setActive(t.key)}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className={styles.mobileSelectWrap}>
        <label className={styles.mobileLabel}>
          Section
          <select className={styles.mobileSelect} value={active} onChange={handleSelectChange}>
            {TABS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.panel} role="tabpanel">
        {active === 'hero' && <HeroSettings />}
        {active === 'about' && <AboutSettings />}
        {active === 'services' && <ServicesSettings />}
        {active === 'clients' && <ClientSettings />}
        {active === 'enquire' && <EnquireSettings />}
        {active === 'join' && <JoinSettings />}
        {active === 'contact' && <ContactSettings />} {/* ← NEW */}
      </div>
    </section>
  );
}
