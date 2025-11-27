'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/menu.config';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
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
                // Home section is id = "top"
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

        {/* Socials */}
        <div className={styles.socialRow}>
          <span className={styles.socialLabel}>Follow</span>
          <div className={styles.socialIcons}>
            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Copy */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} Nocturna. All rights reserved.
        </p>
        <p className={styles.credit}>
          Website created by{' '}
          <a href="https://adaptiveworks.net" target="_blank" rel="noopener noreferrer">
            AWC
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
