// src/components/navbar/Navbar.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches : false
  );

  // 0 = no handoff; 1 = handoff engaged (used on desktop + to hide mobile pill)
  const [handoff, setHandoff] = useState<0 | 1>(0);
  const handoffRef = useRef<0 | 1>(0);

  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // desktop morph (links ⇄ logo)
  const m = useRef(0);
  const v = useRef(0);

  // mobile pill morph (Menu ⇄ Logo) – keep at “Menu”
  const mm = useRef(0);
  const vm = useRef(0);

  // desktop direction target (0 = links, 1 = logo)
  const dirTarget = useRef<0 | 1>(1);
  const lastY = useRef(0);
  const lastTime = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const raf = useRef<number | null>(null);

  // media query listener
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // write --m to all desktop center stacks (top + bottom)
  const setM = (value: number) => {
    m.current = value;
    document.querySelectorAll<HTMLElement>(`.${styles.centerStack}`).forEach((el) => {
      el.style.setProperty('--m', value.toFixed(4));
      el.style.setProperty('--links-pe', value > 0.6 ? 'none' : 'auto');
    });
  };

  // write --mm to all mobile pills (top + bottom)
  const setMM = (value: number) => {
    mm.current = value;
    document.querySelectorAll<HTMLElement>(`.${styles.mobilePill}`).forEach((node) => {
      node.style.setProperty('--mm', value.toFixed(4)); // 0 = Menu, 1 = Logo
    });
  };

  // critically damped spring
  const stepSpring = useCallback(
    (
      pos: React.MutableRefObject<number>,
      vel: React.MutableRefObject<number>,
      targetValue: number,
      writer: (v: number) => void,
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

  // lock body scroll when overlay open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (menuOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // ESC closes overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // handoff with HYSTERESIS (no jitter/peek) + morph loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer: HTMLElement | null =
      document.getElementById('site-footer') ||
      (document.querySelector('[role="contentinfo"]') as HTMLElement | null) ||
      document.querySelector('footer');

    // thresholds relative to viewport bottom
    const DEADZONE = isMobile ? 64 : 24; // px
    const ACTIVATE_OFFSET = NAV_H + HANDOFF_SPAN + DEADZONE; // engage handoff when footer deeper in
    const DEACTIVATE_OFFSET = 20; // disengage when footer far away

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

      // desktop-only direction morph (ensure we didn't “remove” it)
      if (!isMobile) {
        const y = window.scrollY || 0;
        const dy = y - lastY.current;
        if (dy > 0)
          dirTarget.current = 1; // down → logo
        else if (dy < 0) dirTarget.current = 0; // up   → links
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

      // Desktop: morph based on scroll direction; hover/menu & handoff force links
      let desktopTarget = dirTarget.current;
      if (hover || menuOpen) desktopTarget = 0; // links when hover/menu
      if (!isMobile && handoffRef.current === 1) desktopTarget = 0; // links during desktop handoff

      // Mobile: ALWAYS “Menu” (0)
      const mobileTarget = 0;

      // apply
      if (!isMobile) stepSpring(m, v, desktopTarget, setM, dt);
      stepSpring(mm, vm, mobileTarget, setMM, dt);

      raf.current = requestAnimationFrame(loop);
    };

    // init
    setM(0); // desktop shows links on load
    setMM(0); // mobile shows “Menu” on load
    lastY.current = window.scrollY || 0;
    updateHandoff();
    lastTime.current = performance.now();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onOrient);
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [hover, menuOpen, stepSpring, isMobile]);

  // hover
  const onEnter = () => setHover(true);
  const onLeave = () => setHover(false);

  // overlay controls
  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  // wrappers translate on desktop; mobile ignores transforms via CSS
  const HIDE_PX = NAV_H + HIDE_EXTRA;
  const topStyle = { transform: `translateY(${handoff ? 0 : -HIDE_PX}px)` };
  const bottomStyle = { transform: `translateY(${handoff ? HIDE_PX : 0}px)` };

  const pillVars: CSSVars = { ['--links-count']: NAV_LINKS.length };

  // Desktop pill (links ⇄ logo)
  const CenterMorph = () => (
    <div className={styles.centerStack}>
      <div className={styles.logoLayer} aria-hidden={hover}>
        <Link href="/" className={styles.logoLink} aria-label="Home">
          <Image src="/assets/footer-light.png" alt="Nocturna" width={45} height={45} priority />
        </Link>
      </div>
      <div className={styles.linksLayer}>
        {NAV_LINKS.map(({ slug, label }) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className={`${styles.link} ${isActive(`/${slug}`) ? styles.active : ''}`}
            aria-current={isActive(`/${slug}`) ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
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

  // Mobile “Menu + burger” pill
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
            <Image src="/assets/footer-light.png" alt="" width={22} height={22} />
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

  // overlay
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
              <Image src="/assets/footer-light.png" alt="Nocturna" width={36} height={36} />
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
            {NAV_LINKS.map(({ slug, label }) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className={`${styles.mobileLink} ${isActive(`/${slug}`) ? styles.activeMobile : ''}`}
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );

  const topClass = `${styles.topWrapper} ${handoff ? styles.handoff : ''}`;
  const bottomClass = `${styles.bottomWrapper} ${handoff ? styles.handoff : ''}`;

  return (
    <>
      {/* Desktop top morphing pill; hidden on mobile via CSS */}
      <div className={topClass} style={topStyle}>
        <Pill />
        <MobileDock />
      </div>

      {/* Bottom wrapper: desktop pill + mobile pill */}
      <div className={bottomClass} style={bottomStyle}>
        <Pill />
        <MobileDock />
      </div>

      <MobileOverlay />
    </>
  );
}
