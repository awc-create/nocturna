'use client';

import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import styles from './Footer.module.scss';

const Footer: React.FC = () => {
  return (
    <footer id="site-footer" role="contentinfo" data-footer className={styles.footer}>
      <div className={styles.container}>
        {/* Footer Navigation Links */}
        <nav className={styles.footerLinks}>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        {/* Social Icons */}
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

        {/* Copyright */}
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} YourSite. All rights reserved.
        </p>

        {/* Credit */}
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
