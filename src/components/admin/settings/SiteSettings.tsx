// src/components/admin/settings/SiteSettings.tsx
'use client';

import { useState, type ChangeEvent } from 'react';
import styles from './SiteSettings.module.scss';
import FAQSettings from './FAQSettings';

type SettingsTab = 'faq';

const TABS: { key: SettingsTab; label: string }[] = [{ key: 'faq', label: 'FAQ' }];

export default function SiteSettings() {
  const [active, setActive] = useState<SettingsTab>('faq');

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActive(e.target.value as SettingsTab);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2>Site</h2>
          <p>Global settings like FAQs and other static content.</p>
        </div>

        <nav className={styles.tabs} role="tablist" aria-label="Site settings sections">
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
        {active === 'faq' && <FAQSettings />}
      </div>
    </section>
  );
}
