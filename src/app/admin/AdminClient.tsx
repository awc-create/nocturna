'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AdminClient.module.scss';
import HomeSettings from '@/components/admin/home/HomeSettings';
import AboutUsSettings from '@/components/admin/about/AboutUsSettings';
import ContactSettings from '@/components/admin/contact/ContactSettings';
import {
  PanelsTopLeft,
  Home,
  FileText,
  Mail,
  Command,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

type SectionKey = 'home' | 'about' | 'contact';

const SECTIONS: {
  key: SectionKey;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { key: 'home', label: 'Home', hint: 'Hero, About & Services', icon: Home },
  { key: 'about', label: 'About', hint: 'Mini about block', icon: FileText },
  { key: 'contact', label: 'Contact', hint: 'Contact details', icon: Mail },
];

export default function AdminClient() {
  const [active, setActive] = useState<SectionKey>('home');
  const [railOpen, setRailOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((s) => !s);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeMeta = useMemo(() => SECTIONS.find((s) => s.key === active) ?? SECTIONS[0], [active]);

  const render = () => {
    switch (active) {
      case 'home':
        return <HomeSettings />;
      case 'about':
        return <AboutUsSettings />;
      case 'contact':
        return <ContactSettings />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.app}>
      {/* Glass topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button
            className={styles.iconBtn}
            aria-label="Toggle menu"
            onClick={() => setRailOpen((s) => !s)}
          >
            {railOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className={styles.brand}>
            <PanelsTopLeft size={18} />
            <span>Admin</span>
            <span className={styles.sep}>/</span>
            <span className={styles.crumb}>{activeMeta.label}</span>
          </div>
        </div>

        <div className={styles.topCenter}>
          <button className={styles.kbdBtn} onClick={() => setCmdOpen(true)} title="⌘/Ctrl + K">
            <Command size={16} />
            Quick switch
            <kbd>⌘K</kbd>
          </button>
        </div>

        <div className={styles.topRight}>
          <div className={styles.badge} title="Owner">
            <div className={styles.avatar}>OE</div>
            <div className={styles.meta}>
              <strong>Dr. Odera</strong>
              <small>Owner</small>
            </div>
          </div>
          <button className={styles.iconBtn} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Icon rail (collapsible) */}
        <aside className={`${styles.rail} ${railOpen ? styles.railOpen : ''}`}>
          <div className={styles.railHead}>
            <Sparkles size={18} />
            {railOpen && <span>Sections</span>}
          </div>

          <nav className={styles.railNav}>
            {SECTIONS.map(({ key, label, hint, icon: Icon }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  className={`${styles.railItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setActive(key)}
                  aria-current={isActive ? 'page' : undefined}
                  title={`${label} — ${hint}`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                  {railOpen && (
                    <div className={styles.railText}>
                      <strong>{label}</strong>
                      <small>{hint}</small>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className={styles.main}>
          {/* Gradient header for the active section */}
          <div className={styles.sectionHero}>
            <div className={styles.sectionBadge}>{activeMeta.label}</div>
            <h1>{activeMeta.hint}</h1>
            <p>
              Make changes with confidence. Everything is version-friendly and designed for speed.
            </p>
          </div>

          {/* Card panel that hosts your forms */}
          <div className={styles.panel}>{render()}</div>
        </main>
      </div>

      {/* Command palette */}
      {cmdOpen && (
        <div
          className={styles.cmdOverlay}
          onClick={() => setCmdOpen(false)}
          role="dialog"
          aria-modal
        >
          <div className={styles.cmd} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cmdHead}>
              <Command size={16} />
              Switch section
            </div>
            <div className={styles.cmdList} role="menu">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  className={styles.cmdItem}
                  role="menuitem"
                  onClick={() => {
                    setActive(s.key);
                    setCmdOpen(false);
                  }}
                >
                  <s.icon size={16} />
                  <div className={styles.cmdText}>
                    <strong>{s.label}</strong>
                    <small>{s.hint}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
