'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent, type Variants } from 'motion/react';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from '../VariantSwitcher';
import styles from './scroll-peek-bottom.module.scss';

const THRESHOLD = 32; // px scroll before toggling
const HIDE_DELAY = 1000; // ms after mouse leaves

export default function ScrollPeekBottomNavbar() {
  const pathname = usePathname();

  const [hidden, setHidden] = useState(false);
  const [footerShowing, setFooterShowing] = useState(false);

  // Scroll-driven hide/show (down => hide, up => show)
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    if (footerShowing) return; // never reveal while footer visible

    const diff = y - lastYRef.current; // +down, -up
    if (Math.abs(diff) < THRESHOLD) return;

    if (diff > 0) {
      cancelHide();
      setHidden(true);
    } else {
      cancelHide();
      setHidden(false);
    }
    lastYRef.current = y;
  });

  // Footer (or sentinel) observer — force hidden if ANY pixel shows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prefer tiny sentinel if present
    const target =
      document.getElementById('footer-sentinel') ||
      document.getElementById('site-footer') ||
      document.querySelector('footer') ||
      document.querySelector('[role="contentinfo"]') ||
      document.querySelector('[data-footer]');

    if (!target) return;

    // If content scrolls in a container, mark it with [data-scroll-root] in layout
    const root = document.querySelector('[data-scroll-root]') as Element | null;

    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries[0]?.isIntersecting ?? false;
        setFooterShowing(inView);
        if (inView) {
          cancelHide();
          setHidden(true); // hard-hide while footer visible
        }
      },
      {
        root: root || null,
        rootMargin: '0px',
        threshold: 0, // any intersection counts
      }
    );

    io.observe(target);
    return () => io.disconnect();
  }, []);

  // Hover/focus reveal + delayed auto-hide
  const hideTimer = useRef<number | null>(null);
  const cancelHide = () => {
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setHidden(true), HIDE_DELAY);
  };
  useEffect(() => () => cancelHide(), []);

  const onEnter = () => {
    if (footerShowing) return;
    cancelHide();
    setHidden(false);
  };
  const onLeave = () => {
    if (footerShowing) return;
    scheduleHide();
  };
  const onFocusWithin = () => {
    if (footerShowing) return;
    cancelHide();
    setHidden(false);
  };
  const onBlurAll = () => {
    if (footerShowing) return;
    scheduleHide();
  };

  const variants: Variants = {
    visible: { y: '0%' },
    hidden: { y: '95%' }, // slide just below viewport
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Sliding pill (bottom) */}
      <motion.footer
        className={styles.wrapper}
        animate={footerShowing || hidden ? 'hidden' : 'visible'} // force hidden if footer visible
        initial="visible"
        variants={variants}
        transition={{ duration: 0.2 }}
      >
        <nav
          className={styles.shell}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onFocusWithin}
          onBlur={onBlurAll}
        >
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image src="/assets/footer-light.png" alt="Logo" width={32} height={32} priority />
            <span className={styles.brand}>Your Brand</span>
          </Link>

          {/* Links */}
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

          {/* Variant dropdown */}
          <VariantSwitcher className={styles.switcher} />
        </nav>
      </motion.footer>

      {/* Handle (logo) centered at bottom — hidden if footer is showing */}
      <motion.button
        type="button"
        aria-label="Open navigation"
        className={styles.handle}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onFocusWithin}
        onBlur={onBlurAll}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={
          hidden && !footerShowing
            ? { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' }
            : { opacity: 0, scale: 0.98, y: 8, pointerEvents: 'none' }
        }
        transition={{ duration: 0.18 }}
      >
        <Image src="/assets/footer-light.png" alt="Logo" width={26} height={26} />
      </motion.button>
    </>
  );
}
