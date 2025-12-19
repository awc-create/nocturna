// src/components/home/clients/Clients.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './Clients.module.scss';

type ClientLogo = {
  name: string;
  src: string;
  href?: string;
  quote?: string;
  role?: string;
};

const DEFAULTS: ClientLogo[] = [
  {
    name: 'The Garden Bar',
    src: '/assets/clients/garden.png',
    quote: '“They keep the room perfectly tuned, from first drink to last call.”',
    role: 'General Manager',
  },
  {
    name: 'Luna Lounge',
    src: '/assets/clients/luna.png',
    quote: '“Smooth, brand-safe sets that still feel fresh every week.”',
    role: 'Brand Director',
  },
  {
    name: 'Stardust',
    src: '/assets/clients/stardust.png',
    quote: '“Reliable rosters and zero drama with tech or timings.”',
    role: 'Events Lead',
  },
  {
    name: 'Stellar',
    src: '/assets/clients/stellar.png',
    quote: '“Guests notice the music — in a good way, not a loud way.”',
    role: 'Venue Owner',
  },
  {
    name: 'Symphony Center',
    src: '/assets/clients/symphony.png',
    quote: '“They understand our audience and programme to match.”',
    role: 'Programming Manager',
  },
];

export default function Clients() {
  const [logos, setLogos] = useState<ClientLogo[]>(DEFAULTS);
  const [showTestimonials, setShowTestimonials] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  // Optional fetch from admin API (uses defaults as fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/clients', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: ClientLogo[] };
        if (mounted && Array.isArray(data?.items) && data.items.length) {
          setLogos(
            data.items.map((item, i) => ({
              // fallback quote/role from defaults if admin hasn’t filled them
              ...DEFAULTS[i % DEFAULTS.length],
              ...item,
            }))
          );
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const many = logos.length > 5;
  const marqueeList = many ? [...logos, ...logos] : logos;

  // pause marquee on hover
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.animationPlayState = paused ? 'paused' : 'running';
  }, [paused, logos.length]);

  const ctaLabel = showTestimonials ? 'See our clients' : 'See what our clients say';

  const toggleMode = () => setShowTestimonials((s) => !s);

  return (
    <section
      className={`${styles.section} ${showTestimonials ? styles.modeTestimonials : ''}`}
      aria-labelledby="clients-heading"
    >
      <div className={styles.head}>
        <h2 id="clients-heading" className={styles.title}>
          Our Clients
        </h2>
        <p className={styles.lead}>Trusted by leading venues, bars and creative brands.</p>
      </div>

      {/* GRID (≤5) */}
      {!many ? (
        <ul className={styles.grid} role="list">
          {logos.map((logo) => (
            <li key={logo.name} className={styles.item}>
              <div className={styles.cardInner}>
                {/* FRONT: logo */}
                <figure className={`${styles.face} ${styles.logoFace}`}>
                  <div className={styles.logoWrap} title={logo.name}>
                    <Image
                      src={logo.src}
                      alt={logo.name}
                      width={180}
                      height={80}
                      className={styles.logo}
                      priority
                    />
                  </div>
                </figure>

                {/* BACK: testimonial */}
                <figure className={`${styles.face} ${styles.quoteFace}`}>
                  <blockquote className={styles.quoteBody}>
                    {logo.quote || '“Consistent, brand-fit music every week.”'}
                  </blockquote>
                  <figcaption className={styles.quoteMeta}>
                    <span className={styles.quoteName}>{logo.name}</span>
                    {logo.role ? <span className={styles.quoteRole}>{logo.role}</span> : null}
                  </figcaption>
                </figure>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        // MARQUEE (6+) – flip cards inside scrolling slides
        <div
          className={styles.marquee}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div ref={trackRef} className={styles.track}>
            {marqueeList.map((logo, i) => (
              <div key={`${logo.name}-${i}`} className={styles.slide}>
                <div className={styles.item}>
                  <div className={styles.cardInner}>
                    <figure className={`${styles.face} ${styles.logoFace}`}>
                      <div className={styles.logoWrap} title={logo.name}>
                        <Image
                          src={logo.src}
                          alt={logo.name}
                          width={180}
                          height={80}
                          className={styles.logo}
                        />
                      </div>
                    </figure>
                    <figure className={`${styles.face} ${styles.quoteFace}`}>
                      <blockquote className={styles.quoteBody}>
                        {logo.quote || '“Consistent, brand-fit music every week.”'}
                      </blockquote>
                      <figcaption className={styles.quoteMeta}>
                        <span className={styles.quoteName}>{logo.name}</span>
                        {logo.role ? <span className={styles.quoteRole}>{logo.role}</span> : null}
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={styles.testimonialsCta}
          onClick={toggleMode}
          aria-pressed={showTestimonials}
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
