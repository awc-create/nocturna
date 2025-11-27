'use client';

import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import {
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedin,
  FaXTwitter,
  FaFacebook,
} from 'react-icons/fa6';
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

          {/* contact details */}
          <div className={styles.details}>
            <p>
              <FaEnvelope />
              <a href="mailto:hello@nocturna.com">hello@nocturna.com</a>
            </p>
            <p>
              <FaPhoneAlt />
              <a href="tel:03303112112">03303 112 112</a>
            </p>
          </div>

          {/* socials */}
          <div className={styles.socials}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaXTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              <FaYoutube />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer">
              <FaTiktok />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </section>

      <ContactModal />
    </>
  );
}
