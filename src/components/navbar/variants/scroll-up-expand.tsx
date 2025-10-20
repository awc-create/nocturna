'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './scroll-up-expand.module.scss';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from '../VariantSwitcher';
import { useStickyHeader } from '@/hooks/useStickyHeader';

export default function ScrollUpExpandNavbar() {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLElement | null>(null);

  useStickyHeader({ elRef: wrapperRef, translateBuffer: 24, speed: 1 });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const onS = () => setAtTop((window.scrollY || 0) < 8);
    onS();
    window.addEventListener('scroll', onS, { passive: true });
    return () => window.removeEventListener('scroll', onS);
  }, []);

  return (
    <header ref={wrapperRef} className={`${styles.wrapper} ${!atTop ? styles.withBg : ''}`}>
      <nav className={styles.shell}>
        <Link href="/" className={styles.logo}>
          <Image src="/assets/footer-light.png" alt="Logo" width={36} height={36} priority />
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

        <VariantSwitcher />
      </nav>
    </header>
  );
}
