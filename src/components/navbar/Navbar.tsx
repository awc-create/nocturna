'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.scss';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from './VariantSwitcher';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className={styles.wrapper}>
      <nav className={styles.shell}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <Image src="/assets/footer-light.png" alt="Logo" width={36} height={36} priority />
          <span className={styles.brand}>Your Brand</span>
        </Link>

        {/* Links */}
        <div className={styles.links}>
          {NAV_LINKS.map(({ slug, label }) => {
            const href = `/${slug}`;
            return (
              <Link
                key={slug}
                href={href}
                className={isActive(href) ? styles.active : ''}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Variant dropdown (preview only) */}
        <VariantSwitcher />

        {/* Mobile burger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Icon icon={menuOpen ? 'mdi:close' : 'mdi:menu'} />
        </button>

        {/* Mobile panel */}
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
          {NAV_LINKS.map(({ slug, label }) => {
            const href = `/${slug}`;
            return (
              <Link
                key={slug}
                href={href}
                className={isActive(href) ? styles.active : ''}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
          <VariantSwitcher className={styles.switcherFull} />
        </div>
      </nav>
    </div>
  );
}
