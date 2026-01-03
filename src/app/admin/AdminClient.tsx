// src/app/admin/AdminClient.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './AdminClient.module.scss';
import Image from 'next/image';

import HomeSettings from '@/components/admin/home/HomeSettings';
import AccountSettings from '@/components/admin/settings/AccountSettings';

import { signOut } from 'next-auth/react';

import {
  LayoutDashboard,
  Home,
  Command,
  Menu,
  X,
  LogOut,
  PanelsTopLeft,
  Settings,
} from 'lucide-react';

type SectionKey = 'home' | 'settings';

const SECTIONS: {
  key: SectionKey;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { key: 'home', label: 'Home', hint: 'Hero, About & Services', icon: Home },
  { key: 'settings', label: 'Settings', hint: 'Profile & Security', icon: Settings },
];

type Me = {
  email: string;
  name: string | null;
  image: string | null;
  role: 'admin' | 'user' | string;
};

const FALLBACK_AVATAR = '/assets/A_W.png';
const FALLBACK_NAME_TOPBAR = 'Alex D';

async function fetchMe(): Promise<Me | null> {
  try {
    const res = await fetch('/api/admin/me', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}

export default function AdminClient() {
  const [active, setActive] = useState<SectionKey>('home');
  const [railOpen, setRailOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // ✅ Source of truth for topbar
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void (async () => {
      const m = await fetchMe();
      setMe(m);
    })();
  }, []);

  // ✅ When AccountSettings saves, it dispatches admin:me-updated
  useEffect(() => {
    const onUpdated = () => {
      void (async () => {
        const m = await fetchMe();
        setMe(m);
      })();
    };
    window.addEventListener('admin:me-updated', onUpdated as EventListener);
    return () => window.removeEventListener('admin:me-updated', onUpdated as EventListener);
  }, []);

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

  const topName = me?.name?.trim() ? me.name.trim() : FALLBACK_NAME_TOPBAR;
  const topRole = me?.role ?? 'admin';
  const topImage = me?.image?.trim() ? me.image.trim() : FALLBACK_AVATAR;

  const render = () => {
    switch (active) {
      case 'settings':
        return <AccountSettings />;
      case 'home':
      default:
        return <HomeSettings />;
    }
  };

  return (
    <div className={styles.app}>
      {/* ================= TOP BAR ================= */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button
            className={styles.iconBtn}
            aria-label="Toggle menu"
            onClick={() => setRailOpen((s) => !s)}
            type="button"
          >
            {railOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className={styles.brand}>
            <LayoutDashboard size={18} />
            <span>{activeMeta.label}</span>
          </div>
        </div>

        <div className={styles.topCenter}>
          <button
            className={styles.kbdBtn}
            onClick={() => setCmdOpen(true)}
            title="⌘/Ctrl + K"
            type="button"
          >
            <Command size={16} />
            <span className={styles.kbdLabel}>Quick switch</span>
            <kbd>⌘K</kbd>
          </button>
        </div>

        <div className={styles.topRight}>
          {/* ✅ avatar + Alex D */}
          <div className={styles.badge} title={topName}>
            <div className={styles.avatar}>
              <Image
                src={topImage}
                alt="Profile"
                fill
                sizes="28px"
                className={styles.avatarImg}
                priority={false}
                onError={() => setMe((prev) => (prev ? { ...prev, image: null } : prev))}
              />
            </div>

            <div className={styles.meta}>
              <strong>{topName}</strong>
              <small>{String(topRole)}</small>
            </div>
          </div>

          <button
            className={styles.iconBtn}
            aria-label="Sign out"
            title="Sign out"
            type="button"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <div className={styles.body}>
        <aside className={`${styles.rail} ${railOpen ? styles.railOpen : ''}`}>
          <div className={styles.railHead}>
            <PanelsTopLeft size={18} />
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
                  type="button"
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

        <main className={styles.main}>
          <div className={styles.sectionHero}>
            <div className={styles.sectionBadge}>{activeMeta.label}</div>
            <h1>{activeMeta.hint}</h1>
            <p>
              Make changes with confidence. Everything is version-friendly and designed for speed.
            </p>
          </div>

          <div className={styles.panel}>{render()}</div>
        </main>
      </div>

      {/* ================= COMMAND PALETTE ================= */}
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
                  type="button"
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
