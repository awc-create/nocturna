'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from '../VariantSwitcher';
import styles from './scroll-handoff-sync.module.scss';

/** Keep this in sync with CSS --nav-height. */
const NAV_H = 60; // px
const HANDOFF_SPAN = 80; // px after NAV_H to complete the swap
const HIDE_EXTRA = 24; // px cushion (shadow/margins) so it fully clears

export default function ScrollHandoffSyncNavbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const [progress, setProgress] = useState(0); // 0..1
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer: HTMLElement | null =
      document.getElementById('site-footer') ||
      (document.querySelector('[role="contentinfo"]') as HTMLElement | null) ||
      (document.querySelector('footer') as HTMLElement | null);

    if (!footer) return;

    const compute = () => {
      const viewportBottom = window.innerHeight;
      const footerTop = footer.getBoundingClientRect().top;

      // How much of the footer is inside the viewport (>= 0).
      const overlap = Math.max(0, viewportBottom - footerTop);

      // Start swap immediately (overlap > 0) and finish over NAV_H + HANDOFF_SPAN.
      const TOTAL = NAV_H + HANDOFF_SPAN;
      const p = Math.max(0, Math.min(1, overlap / TOTAL));
      setProgress(p);
    };

    const onScroll: EventListener = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        compute();
      });
    };

    // Initial & listeners
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Footer might resize after load (fonts/images).
    const ro = new ResizeObserver(() => compute());
    ro.observe(footer);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Translate in PX so we truly clear borders/shadows/margins.
  const HIDE_PX = NAV_H + HIDE_EXTRA;
  const bottomStyle = { transform: `translateY(${progress * HIDE_PX}px)` }; // 0 → +HIDE_PX
  const topStyle = { transform: `translateY(${-HIDE_PX + progress * HIDE_PX}px)` }; // -HIDE_PX → 0

  return (
    <>
      {/* TOP pill (slides in as footer overlaps more) */}
      <div className={styles.topWrapper} style={topStyle}>
        <nav className={styles.shell}>
          <Link href="/" className={styles.logo}>
            <Image src="/assets/footer-light.png" alt="Logo" width={32} height={32} priority />
            <span className={styles.brand}>Your Brand</span>
          </Link>

          <div className={styles.links}>
            {NAV_LINKS.map(({ slug, label }) => {
              const href = `/${slug}`;
              return (
                <Link key={slug} href={href} className={isActive(href) ? styles.active : ''}>
                  {label}
                </Link>
              );
            })}
          </div>

          <VariantSwitcher className={styles.switcher} />
        </nav>
      </div>

      {/* BOTTOM pill (slides down under the footer) */}
      <div className={styles.bottomWrapper} style={bottomStyle}>
        <nav className={styles.shell}>
          <Link href="/" className={styles.logo}>
            <Image src="/assets/footer-light.png" alt="Logo" width={32} height={32} />
            <span className={styles.brand}>Your Brand</span>
          </Link>

          <div className={styles.links}>
            {NAV_LINKS.map(({ slug, label }) => {
              const href = `/${slug}`;
              return (
                <Link key={slug} href={href} className={isActive(href) ? styles.active : ''}>
                  {label}
                </Link>
              );
            })}
          </div>

          <VariantSwitcher className={styles.switcher} />
        </nav>
      </div>
    </>
  );
}
