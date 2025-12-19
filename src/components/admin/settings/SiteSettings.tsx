'use client';

import { useState, type ChangeEvent } from 'react';
import styles from './SiteSettings.module.scss';
import FAQSettings from './FAQSettings';
import AccountSettings from './AccountSettings';

type SettingsTab = 'account' | 'faq';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'faq', label: 'FAQ' },
];

export default function SiteSettings() {
  const [active, setActive] = useState<SettingsTab>('account');

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setActive(e.target.value as SettingsTab);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2>Settings</h2>
          <p>Account profile and site-wide configuration.</p>
        </div>

        <nav className={styles.tabs} role="tablist" aria-label="Settings sections">
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
        {active === 'account' && <AccountSettings />}
        {active === 'faq' && <FAQSettings />}
      </div>
    </section>
  );
}
