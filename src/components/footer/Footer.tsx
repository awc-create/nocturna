// src/components/shared/Footer.tsx
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
        <nav className={styles.mobileMenu} aria-label="Main site navigation">
          <h2 className="srOnly">Site navigation</h2>
          <ul className={styles.menuList}>
            {NAV_LINKS.map(({ slug, label }) => {
              const href = `/${slug}`;
              const active = isActive(href);
              return (
                <li key={slug}>
                  <Link
                    href={href}
                    className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer links */}
        <nav className={styles.footerLinks} aria-label="Legal and info">
          <Link href="/privacy-policy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className={styles.footerLink}>
            Terms of Service
          </Link>
          <Link href="/faq" className={styles.footerLink}>
            FAQs
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Contact
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

        {/* Copy + credit */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} YourSite. All rights reserved.
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
