// src/components/home/contact/Contact.tsx
'use client';

import { FaEnvelope } from 'react-icons/fa';
import { FaInstagram, FaTiktok } from 'react-icons/fa6';
import { useModals } from '../modals/ModalContext';
import ContactModal from './ContactModal';
import styles from './Contact.module.scss';

export default function Contact() {
  const { openContact } = useModals();

  return (
    <>
      <section className={styles.section} id="contact">
        <div className={styles.inner}>
          <p className={styles.kicker}>LET&apos;S CONNECT</p>

          {/* CTA – text + orb + animated rail */}
          <button
            type="button"
            className={styles.cta}
            onClick={openContact}
            aria-label="Open contact form"
          >
            <div className={styles.labelWrap}>
              <span className={styles.ctaLabel}>GET IN TOUCH</span>

              {/* animated underline */}
              <span className={styles.ctaRail} aria-hidden="true" />

              {/* orb on the right */}
              <span className={styles.orbWrap} aria-hidden="true">
                <span className={styles.orb} />
              </span>
            </div>

            <span className={styles.ctaSub}>GENERAL ENQUIRIES</span>
          </button>

          {/* contact details — email only */}
          <div className={styles.details}>
            <p>
              <FaEnvelope />
              <a href="mailto:info@nocturna.com">info@nocturna.com</a>
            </p>
          </div>

          {/* socials — IG + TikTok only */}
          <div className={styles.socials}>
            <a
              href="https://www.instagram.com/nocturna_artist_agency"
              target="_blank"
              rel="noreferrer"
              aria-label="Nocturna Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://www.tiktok.com/@nocturna_artist_agency"
              target="_blank"
              rel="noreferrer"
              aria-label="Nocturna TikTok"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </section>

      <ContactModal />
    </>
  );
}
