'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/menu.config';
import { FaInstagram, FaTiktok } from 'react-icons/fa6';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <footer id="site-footer" role="contentinfo" className={styles.footer}>
      <div className={styles.container}>
        {/* Mobile Site Menu */}
        {pathname === '/' ? (
          <nav className={styles.mobileMenu} aria-label="Main site navigation">
            <h2 className={styles.srOnly}>Site navigation</h2>
            <ul className={styles.menuList}>
              {NAV_LINKS.map(({ id, label }) => {
                const href = id === 'top' ? '/' : `#${id}`;
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      className={`${styles.menuItem} ${
                        isActive(href) ? styles.menuItemActive : ''
                      }`}
                      aria-current={isActive(href) ? 'page' : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : (
          <nav className={styles.mobileMenu} aria-label="Back to home">
            <h2 className={styles.srOnly}>Back to home</h2>
            <ul className={styles.menuList}>
              <li>
                <Link href="/" className={styles.menuItem}>
                  ← Back to home
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {/* Footer Links */}
        <nav className={styles.footerLinks} aria-label="Legal and info">
          <Link href="/privacy-policy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className={styles.footerLink}>
            Terms of Service
          </Link>
          <Link href="/cookies" className={styles.footerLink}>
            Cookies
          </Link>
          <Link href="/faq" className={styles.footerLink}>
            FAQs
          </Link>
        </nav>

        {/* Socials — Instagram + TikTok */}
        <div className={styles.socialRow}>
          <span className={styles.socialLabel}>Follow</span>
          <div className={styles.socialIcons}>
            <a
              href="https://www.instagram.com/Essentia_artist_agency"
              target="_blank"
              rel="noreferrer"
              aria-label="Essentia Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://www.tiktok.com/@Essentia_artist_agency"
              target="_blank"
              rel="noreferrer"
              aria-label="Essentia TikTok"
            >
              <FaTiktok />
            </a>
          </div>
        </div>

        {/* Copy */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} Essentia. All rights reserved.
        </p>

        {/* Creator credit */}
        <p className={styles.credit}>
          Website created by{' '}
          <a
            href="https://adaptiveworks.net"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.creditLink}
          >
            AWC
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
