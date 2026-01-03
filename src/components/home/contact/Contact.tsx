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
  contactEmail: 'info@nocturna.com',
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
  switch (p) {
    case 'x':
      return 'X';
    default:
      return p[0].toUpperCase() + p.slice(1);
  }
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
      <section className={styles.section} id="contact">
        <div className={styles.inner}>
          <p className={styles.kicker}>{cfg.eyebrow}</p>

          <button
            type="button"
            className={styles.cta}
            onClick={openContact}
            aria-label={cfg.buttonLabel || 'Open contact form'}
          >
            <div className={styles.labelWrap}>
              <span className={styles.ctaLabel}>
                {cfg.title?.toUpperCase?.() ? cfg.title.toUpperCase() : cfg.title}
              </span>
              <span className={styles.ctaRail} aria-hidden="true" />
              <span className={styles.orbWrap} aria-hidden="true">
                <span className={styles.orb} />
              </span>
            </div>

            <span className={styles.ctaSub}>{cfg.lead}</span>
          </button>

          <div className={styles.details}>
            <p>
              <FaEnvelope />
              <a href={`mailto:${cfg.contactEmail}`}>{cfg.contactEmail}</a>
            </p>

            {cfg.contactPhone ? (
              <p>
                <FaPhone />
                <a href={`tel:${cfg.contactPhone}`}>{cfg.contactPhone}</a>
              </p>
            ) : null}
          </div>

          {cfg.socialLinks?.length ? (
            <div className={styles.socials}>
              {cfg.socialLinks.map((s) => (
                <a
                  key={`${s.platform}-${s.url}`}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={labelFor(s.platform)}
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
