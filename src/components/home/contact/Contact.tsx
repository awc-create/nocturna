'use client';

import { useEffect, useState } from 'react';
import { FaEnvelope, FaPhone } from 'react-icons/fa';
import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaLinkedin,
  FaFacebook,
  FaSoundcloud,
  FaXTwitter,
} from 'react-icons/fa6';
import { useModals } from '../modals/ModalContext';
import ContactModal from './ContactModal';
import styles from './Contact.module.scss';

type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'soundcloud';

type SocialLink = { platform: SocialPlatform; url: string };

type ContactConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;

  contactEmail: string;
  contactPhone?: string | null;
  socialLinks: SocialLink[];
};

const FALLBACK: ContactConfig = {
  eyebrow: "LET'S CONNECT",
  title: 'Get in touch',
  lead: 'General enquiries',
  buttonLabel: 'Open contact form',
  contactEmail: 'info@Essentia.com',
  contactPhone: null,
  socialLinks: [],
};

function iconFor(p: SocialPlatform) {
  switch (p) {
    case 'instagram':
      return <FaInstagram />;
    case 'tiktok':
      return <FaTiktok />;
    case 'youtube':
      return <FaYoutube />;
    case 'linkedin':
      return <FaLinkedin />;
    case 'facebook':
      return <FaFacebook />;
    case 'soundcloud':
      return <FaSoundcloud />;
    case 'x':
      return <FaXTwitter />;
    default:
      return null;
  }
}

function labelFor(p: SocialPlatform) {
  return p === 'x' ? 'X' : p[0].toUpperCase() + p.slice(1);
}

export default function Contact() {
  const { openContact } = useModals();
  const [cfg, setCfg] = useState<ContactConfig>(FALLBACK);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<ContactConfig>;
        setCfg({ ...FALLBACK, ...data, socialLinks: data.socialLinks ?? [] });
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <>
      <section className={styles.section} id="contact" aria-labelledby="contact-heading">
        <div className={styles.inner}>
          <p className={styles.kicker}>{cfg.eyebrow}</p>

          <h2 id="contact-heading" className={styles.title}>
            {cfg.title}
          </h2>

          <p className={styles.lead}>{cfg.lead}</p>

          <button
            type="button"
            className={styles.cta}
            onClick={openContact}
            aria-label={cfg.buttonLabel || 'Open contact form'}
          >
            {cfg.buttonLabel || 'Open contact form'}
          </button>

          {(cfg.contactEmail || cfg.contactPhone) && (
            <div className={styles.details}>
              {cfg.contactEmail ? (
                <a
                  href={`mailto:${cfg.contactEmail}`}
                  className={styles.iconOnly}
                  aria-label="Email us"
                  title={cfg.contactEmail}
                >
                  <FaEnvelope />
                </a>
              ) : null}

              {cfg.contactPhone ? (
                <a
                  href={`tel:${cfg.contactPhone}`}
                  className={styles.iconOnly}
                  aria-label="Call us"
                  title={cfg.contactPhone}
                >
                  <FaPhone />
                </a>
              ) : null}
            </div>
          )}

          {cfg.socialLinks?.length ? (
            <div className={styles.socials}>
              {cfg.socialLinks.map((s) => (
                <a
                  key={`${s.platform}-${s.url}`}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={labelFor(s.platform)}
                  title={labelFor(s.platform)}
                >
                  {iconFor(s.platform)}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <ContactModal />
    </>
  );
}
