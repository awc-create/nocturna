'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './Services.module.scss';

export type Service = {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
};

const DEFAULTS: Service[] = [
  {
    key: 'dj',
    title: 'DJs',
    blurb:
      'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
    href: '/services/djs',
    image: '/assets/services/djs.jpg',
    tag: 'Nightlife energy',
  },
  {
    key: 'musician',
    title: 'Musicians',
    blurb:
      'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
    href: '/services/musicians',
    image: '/assets/services/musicians.jpg',
    tag: 'Live atmosphere',
  },
];

export default function Services() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [services, setServices] = useState<Service[]>(DEFAULTS);
  const [kicker, setKicker] = useState('Our Services');
  const [title, setTitle] = useState('Sound that fits the room.');
  const [lead, setLead] = useState('Two core offerings to start — built to scale with your brand.');

  /** Fetch live data from /api/home/services */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/services', { cache: 'no-store' });
        if (!res.ok) throw new Error('Bad response');
        const data = await res.json();
        setServices(data.items || DEFAULTS);
        setKicker(data.kicker || 'Our Services');
        setTitle(data.title || 'Sound that fits the room.');
        setLead(data.lead || 'Two core offerings to start — built to scale with your brand.');
      } catch (err) {
        console.warn('Falling back to defaults for services:', err);
        setServices(DEFAULTS);
      }
    })();
  }, []);

  /** Reveal animation */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.add(styles.visible);
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => entry.isIntersecting && el.classList.add(styles.visible)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Tilt/parallax */
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.card}`));

    function handle(e: MouseEvent, el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 8;
      const tiltY = (x - 0.5) * 8;
      const glowX = (x * 100).toFixed(1);
      const glowY = (y * 100).toFixed(1);
      el.style.setProperty('--tiltX', `${tiltX}deg`);
      el.style.setProperty('--tiltY', `${tiltY}deg`);
      el.style.setProperty('--glowX', `${glowX}%`);
      el.style.setProperty('--glowY', `${glowY}%`);
    }

    const unsubs: Array<() => void> = [];
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => handle(e, card);
      const onLeave = () => {
        card.style.setProperty('--tiltX', `0deg`);
        card.style.setProperty('--tiltY', `0deg`);
      };
      card.addEventListener('mousemove', onMove as EventListener);
      card.addEventListener('mouseleave', onLeave as EventListener);
      unsubs.push(() => {
        card.removeEventListener('mousemove', onMove as EventListener);
        card.removeEventListener('mouseleave', onLeave as EventListener);
      });
    });

    return () => unsubs.forEach((fn) => fn());
  }, [services]); // rebind when list changes

  const noPanel = true;

  return (
    <section
      ref={rootRef}
      className={`${styles.section} ${noPanel ? styles.noPanel : ''}`}
      aria-labelledby="services-title"
      data-section="home-services"
    >
      <div className={styles.head}>
        <div className={styles.kicker}>{kicker}</div>
        <h2 id="services-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.lead}>{lead}</p>
      </div>

      <div className={styles.grid}>
        {services.map((s) => (
          <article key={s.key} className={styles.card}>
            <div className={styles.media} style={{ backgroundImage: `url(${s.image})` }} />
            <div className={styles.scrim} aria-hidden="true" />
            <div className={styles.info}>
              <span className={styles.tag}>{s.tag}</span>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.blurb}>{s.blurb}</p>
              <div className={styles.actions}>
                <Link href={s.href} className={styles.cta}>
                  Explore {s.title}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.footerRow}>
        <Link href="/services" className={styles.viewAll}>
          View all services
        </Link>
      </div>

      <div className={styles.vignette} aria-hidden="true" />
    </section>
  );
}
