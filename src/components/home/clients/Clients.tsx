'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './Clients.module.scss';
import Link from 'next/link';

type ClientLogo = {
  name: string;
  src: string;
  href?: string;
};

const DEFAULTS: ClientLogo[] = [
  { name: 'Garden', src: '/assets/clients/garden.png' },
  { name: 'Luna', src: '/assets/clients/luna.png' },
  { name: 'Stardust', src: '/assets/clients/stardust.png' },
  { name: 'Stellar', src: '/assets/clients/stellar.png' },
  { name: 'Symphony', src: '/assets/clients/symphony.png' },
];

export default function Clients() {
  const [logos, setLogos] = useState<ClientLogo[]>(DEFAULTS);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  // (optional) fetch dynamic list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/clients', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: ClientLogo[] };
        if (mounted && Array.isArray(data?.items) && data.items.length) {
          setLogos(data.items);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const many = logos.length > 5;
  const marqueeList = many ? [...logos, ...logos] : logos;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.animationPlayState = paused ? 'paused' : 'running';
  }, [paused, logos.length]);

  /** 🚨 Spotlight-on-hover (no layout change) */
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.item}`));

    function handleMove(e: MouseEvent, el: HTMLElement) {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--glowX', `${x}%`);
      el.style.setProperty('--glowY', `${y}%`);
    }
    const cleanups: Array<() => void> = [];

    cards.forEach((el) => {
      const onMove = (evt: MouseEvent) => handleMove(evt, el);
      const onLeave = () => {
        el.style.removeProperty('--glowX');
        el.style.removeProperty('--glowY');
      };
      el.addEventListener('mousemove', onMove as EventListener);
      el.addEventListener('mouseleave', onLeave as EventListener);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove as EventListener);
        el.removeEventListener('mouseleave', onLeave as EventListener);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [logos]); // rebind if list changes

  return (
    <section className={styles.section} aria-labelledby="clients-heading">
      <div className={styles.head}>
        <h2 id="clients-heading" className={styles.title}>
          Our Clients
        </h2>
        <p className={styles.lead}>Trusted by leading venues, bars and creative brands.</p>
      </div>

      {!many ? (
        <ul className={styles.grid} role="list">
          {logos.map((logo) => (
            <li key={logo.name} className={styles.item}>
              <figure className={styles.logoWrap} title={logo.name}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={180}
                  height={80}
                  className={styles.logo}
                  priority
                />
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={styles.marquee}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div ref={trackRef} className={styles.track}>
            {marqueeList.map((logo, i) => (
              <div key={`${logo.name}-${i}`} className={styles.slide}>
                <figure className={styles.logoWrap} title={logo.name}>
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={180}
                    height={80}
                    className={styles.logo}
                  />
                </figure>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={styles.ctaRow}>
        <Link
          href="/testimonials"
          className={styles.testimonialsCta}
          aria-label="Read client testimonials"
        >
          See what our clients say
        </Link>
      </div>
    </section>
  );
}
