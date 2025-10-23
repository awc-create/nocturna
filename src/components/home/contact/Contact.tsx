'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import {
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedin,
  FaXTwitter,
  FaFacebook,
} from 'react-icons/fa6';
import styles from './Contact.module.scss';

export default function Contact() {
  const [hovered, setHovered] = useState(false);

  return (
    <section className={styles.section} id="contact">
      <div className={styles.inner}>
        <p className={styles.kicker}>Let’s Connect</p>

        <Link
          href="/contact"
          className={styles.touchLink}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          GET IN TOUCH
          <span className={`${styles.orb} ${hovered ? styles.visible : ''}`} aria-hidden="true" />
        </Link>

        <div className={styles.details}>
          <p>
            <FaEnvelope /> hello@nocturna.com
          </p>
          <p>
            <FaPhoneAlt /> 03303 112 112
          </p>
        </div>

        <div className={styles.socials}>
          <a href="#" aria-label="Facebook">
            <FaFacebook />
          </a>
          <a href="#" aria-label="X / Twitter">
            <FaXTwitter />
          </a>
          <a href="#" aria-label="Instagram">
            <FaInstagram />
          </a>
          <a href="#" aria-label="YouTube">
            <FaYoutube />
          </a>
          <a href="#" aria-label="TikTok">
            <FaTiktok />
          </a>
          <a href="#" aria-label="LinkedIn">
            <FaLinkedin />
          </a>
        </div>
      </div>
    </section>
  );
}
