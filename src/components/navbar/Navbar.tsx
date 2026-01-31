'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/menu.config';
import styles from './Navbar.module.scss';

const NAV_H = 70;
const HANDOFF_SPAN = 80;
const HIDE_EXTRA = 28;
const MOBILE_BP = 768;

// spring (fast, smooth, critically damped)
const NATURAL_FREQUENCY = 40;
const DAMPING_RATIO = 1;
const MAX_DT = 1 / 60;

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

export default function Navbar() {
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches : false
  );

  const [handoff, setHandoff] = useState<0 | 1>(0);
  const handoffRef = useRef<0 | 1>(0);

  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // springs
  const m = useRef(0);
  const v = useRef(0);
  const mm = useRef(0);
  const vm = useRef(0);

  const dirTarget = useRef<0 | 1>(1);
  const lastY = useRef(0);
  const lastTime = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const raf = useRef<number | null>(null);

  // === ACTIVE SECTION STATE ===
  const [activeSection, setActiveSection] = useState<string>('top');
  const activeRef = useRef<string>('top');

  // These are SECTION ids in the DOM
  const sectionIds = NAV_LINKS.map((l) => l.id);

  // Helpers
  const pathForId = (id: string) => (id === 'top' ? '/' : `/${id}`);
  const idFromPath = (p: string) => {
    if (!p || p === '/') return 'top';
    return p.replace('/', '').split('/')[0];
  };
  const isSectionRoute = (() => {
    const id = idFromPath(pathname);
    return id === 'top' || sectionIds.includes(id);
  })();

  // mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  const setM = (value: number) => {
    m.current = value;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--nav-m', value.toFixed(4));
      root.style.setProperty('--nav-links-pe', value > 0.6 ? 'none' : 'auto');
    }
  };

  const setMM = (value: number) => {
    mm.current = value;
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--nav-mm', value.toFixed(4));
    }
  };

  const stepSpring = useCallback(
    (
      pos: React.MutableRefObject<number>,
      vel: React.MutableRefObject<number>,
      targetValue: number,
      writer: (v2: number) => void,
      dt: number
    ) => {
      const w = NATURAL_FREQUENCY;
      const z = DAMPING_RATIO;
      const a = -w * w * (pos.current - targetValue) - 2 * z * w * vel.current;
      vel.current += a * dt;
      const next = pos.current + vel.current * dt;
      if (next <= 0) {
        vel.current = 0;
        writer(0);
      } else if (next >= 1) {
        vel.current = 0;
        writer(1);
      } else {
        writer(next);
      }
    },
    []
  );

  // lock body when mobile menu open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // ESC closes menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // scroll-based handoff + springs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer: HTMLElement | null =
      document.getElementById('site-footer') ||
      (document.querySelector('[role="contentinfo"]') as HTMLElement | null) ||
      document.querySelector('footer');

    const DEADZONE = isMobile ? 64 : 24;
    const ACTIVATE_OFFSET = NAV_H + HANDOFF_SPAN + DEADZONE;
    const DEACTIVATE_OFFSET = 20;

    const updateHandoff = () => {
      if (!footer) {
        setHandoff(0);
        handoffRef.current = 0;
        return;
      }
      const vh = window.innerHeight;
      const footerTop = footer.getBoundingClientRect().top;
      const activateAt = vh - ACTIVATE_OFFSET;
      const deactivateAt = vh - DEACTIVATE_OFFSET;

      if (handoffRef.current === 0 && footerTop <= activateAt) {
        handoffRef.current = 1;
        setHandoff(1);
      } else if (handoffRef.current === 1 && footerTop >= deactivateAt) {
        handoffRef.current = 0;
        setHandoff(0);
      }
    };

    const onScroll = () => {
      updateHandoff();

      if (!isMobile) {
        const y = window.scrollY || 0;
        const dy = y - lastY.current;

        if (dy > 0) {
          dirTarget.current = 1; // scrolling down → logo mode
        } else if (dy < 0) {
          dirTarget.current = 0; // scrolling up → links mode
        }

        lastY.current = y;
      }
    };

    const onResize = () => updateHandoff();
    const onOrient = () => updateHandoff();

    const loop = () => {
      const now = performance.now();
      let dt = (now - lastTime.current) / 1000;
      lastTime.current = now;
      if (dt > MAX_DT) dt = MAX_DT;

      let desktopTarget = dirTarget.current;
      if (hover || menuOpen) desktopTarget = 0;
      if (!isMobile && handoffRef.current === 1) desktopTarget = 0;

      const mobileTarget = 0;
      if (!isMobile) stepSpring(m, v, desktopTarget, setM, dt);
      stepSpring(mm, vm, mobileTarget, setMM, dt);

      raf.current = requestAnimationFrame(loop);
    };

    setM(0);
    setMM(0);
    lastY.current = window.scrollY || 0;
    updateHandoff();
    lastTime.current = performance.now();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [hover, menuOpen, stepSpring, isMobile]);

  // ✅ On mount / route change: if URL is /services, scroll to that section
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSectionRoute) return;

    const id = idFromPath(pathname);
    if (!id || id === 'top') {
      // Top
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
      activeRef.current = 'top';
      setActiveSection('top');
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    // Auto-scroll (no animation to feel like normal page load)
    requestAnimationFrame(() => {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'auto' });
    });

    activeRef.current = id;
    setActiveSection(id);
  }, [pathname, isSectionRoute]);

  // ✅ ACTIVE SECTION TRACKING (works on / and /section routes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSectionRoute) return;

    const handle = () => {
      const y = window.scrollY || 0;

      // very top => Home
      if (y < 200) {
        if (activeRef.current !== 'top') {
          activeRef.current = 'top';
          setActiveSection('top');
        }
        return;
      }

      const viewportOffset = 100;
      let bestId = 'top';
      let bestDelta = Infinity;

      sectionIds.forEach((id) => {
        if (id === 'top') return;
        const el = document.getElementById(id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const delta = Math.abs(top - (y + viewportOffset));

        if (delta < bestDelta && rect.bottom > viewportOffset + 40) {
          bestDelta = delta;
          bestId = id;
        }
      });

      if (bestId && activeRef.current !== bestId) {
        activeRef.current = bestId;
        setActiveSection(bestId);
      }
    };

    handle();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [isSectionRoute, sectionIds]);

  const onEnter = () => setHover(true);
  const onLeave = () => setHover(false);

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  const HIDE_PX = NAV_H + HIDE_EXTRA;
  const topStyle = { transform: `translateY(${handoff ? 0 : -HIDE_PX}px)` };
  const bottomStyle = { transform: `translateY(${handoff ? HIDE_PX : 0}px)` };
  const pillVars: CSSVars = { ['--links-count']: NAV_LINKS.length as number };

  // ✅ Smooth scroll + update URL path WITHOUT navigation
  const handleNavClick =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      // Only intercept clicks when we're on home-like routes
      if (!isSectionRoute) return;

      e.preventDefault();

      const nextPath = pathForId(id);

      if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', nextPath);
        activeRef.current = 'top';
        setActiveSection('top');
        closeMenu();
        return;
      }

      const target = document.getElementById(id);
      if (!target) {
        // Still update URL if something is off
        window.history.pushState(null, '', nextPath);
        closeMenu();
        return;
      }

      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // ✅ update URL WITHOUT page load
      window.history.pushState(null, '', nextPath);

      activeRef.current = id;
      setActiveSection(id);

      closeMenu();
    };

  // Active state
  const isLinkActive = (id: string) => activeSection === id;

  // Desktop pill (links ⇄ logo)
  const CenterMorph = () => (
    <div className={styles.centerStack}>
      <div className={styles.logoLayer} aria-hidden={hover}>
        <Link href="/" className={styles.logoLink} aria-label="Home">
          <Image src="/assets/A_W.png" alt="Essentia" width={34} height={48} priority />
        </Link>
      </div>

      <div className={styles.linksLayer}>
        {NAV_LINKS.map(({ id, label }) => {
          // ✅ real, shareable URL paths
          const href = pathForId(id);

          return (
            <Link
              key={id}
              href={href}
              className={`${styles.link} ${isLinkActive(id) ? styles.active : ''}`}
              aria-current={isLinkActive(id) ? 'page' : undefined}
              onClick={handleNavClick(id)}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const Pill = () => (
    <nav className={styles.shell} style={pillVars} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className={styles.left} />
      <div className={styles.right} />
      <CenterMorph />
    </nav>
  );

  const MobileDock = () => (
    <div className={styles.mobilePill}>
      <button
        type="button"
        className={styles.mobilePillBtn}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-haspopup="true"
        aria-controls="mobile-menu"
        aria-expanded={menuOpen}
        onClick={menuOpen ? closeMenu : openMenu}
      >
        <span className={styles.mobileLeft}>
          <span className={styles.mobilePillLabel}>Menu</span>
          <span className={styles.mobilePillLogo} aria-hidden="true">
            <Image src="/assets/A_W.png" alt="" width={17} height={24} />
          </span>
        </span>
        <span className={styles.mobilePillIcon} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </div>
  );

  const MobileOverlay = () => (
    <>
      <div
        className={`${styles.mobileBackdrop} ${menuOpen ? styles.show : ''}`}
        onClick={closeMenu}
      />
      <div
        id="mobile-menu"
        className={`${styles.mobilePanel} ${menuOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
      >
        <div className={styles.mobileInner}>
          <div className={styles.mobileHeader}>
            <Link href="/" className={styles.mobileLogo} onClick={closeMenu} aria-label="Home">
              <Image src="/assets/A_W.png" alt="Essentia" width={28} height={40} />
            </Link>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeMenu}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <h2 id="mobile-menu-title" className={styles.srOnly}>
            Navigation
          </h2>

          <nav className={styles.mobileNav}>
            {NAV_LINKS.map(({ id, label }) => {
              const href = pathForId(id);

              return (
                <Link
                  key={id}
                  href={href}
                  className={`${styles.mobileLink} ${isLinkActive(id) ? styles.activeMobile : ''}`}
                  onClick={handleNavClick(id)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );

  const topClass = `${styles.topWrapper} ${handoff ? styles.handoff : ''}`;
  const bottomClass = `${styles.bottomWrapper} ${handoff ? styles.handoff : ''}`;

  // ✅ Keep full home navbar on / and /section
  if (!isSectionRoute) {
    // Non-home route: simple sticky bar
    return (
      <header className={styles.secondaryBar}>
        <div className={styles.secondaryInner}>
          <Link href="/" className={styles.secondaryBrand} aria-label="Back to home">
            <span className={styles.secondaryLogo}>
              <Image src="/assets/Essentia_W.png" alt="Essentia" width={120} height={28} priority />
            </span>
          </Link>

          <Link href="/" className={styles.secondaryBack}>
            <span className={styles.secondaryBackArrow}>←</span>
            <span>Back to home</span>
          </Link>
        </div>
      </header>
    );
  }

  // Home-like routes: full floating morph pill + mobile dock
  return (
    <>
      <div className={topClass} style={topStyle}>
        <Pill />
        <MobileDock />
      </div>

      <div className={bottomClass} style={bottomStyle}>
        <Pill />
        <MobileDock />
      </div>

      <MobileOverlay />
    </>
  );
}
