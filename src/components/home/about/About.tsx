'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './About.module.scss';

type QuickFact = { value: string; label: string };

type AboutData = {
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaGhostText: string;
  ctaGhostHref: string;
  quickFacts: QuickFact[];
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Nocturna delivers sound that fits the room — and the brand.',
  bullets: [
    'Curation over chaos — the right artist for the right room.',
    'Reliable bookings, clear comms, zero hidden costs.',
    'Artist-first ethos; venue-ready professionalism.',
  ],
  ctaPrimaryText: 'Learn more',
  ctaPrimaryHref: '/about',
  ctaGhostText: 'Enquire now',
  ctaGhostHref: '/enquire',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ],
};

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const [data, setData] = useState<AboutData>(FALLBACK);

  // Toggle this if/when you want *no panel at all*
  const noPanel = true; // ← set true to make About fully transparent

  // show immediately then still allow fade-in on intersect
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add(styles.visible);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && el.classList.add(styles.visible)),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/about', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<AboutData>;
        if (mounted) {
          setData({
            ...FALLBACK,
            ...json,
            bullets: json.bullets ?? FALLBACK.bullets,
            quickFacts: json.quickFacts ?? FALLBACK.quickFacts,
          });
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      ref={ref}
      className={`${styles.about} ${noPanel ? styles.noPanel : ''}`}
      aria-labelledby="about-title"
      data-section="after-hero"
    >
      <div className={styles.curve} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.kicker}>{data.eyebrow}</div>

        <div className={styles.grid}>
          <h2 id="about-title" className={styles.title}>
            {data.title}
          </h2>

          <div className={styles.content}>
            <p className={styles.lead}>{data.lead}</p>

            <ul className={styles.points}>
              {data.bullets.map((b, i) => (
                <li key={i}>
                  <span className={styles.dot} /> {b}
                </li>
              ))}
            </ul>

            <div className={styles.ctaRow}>
              <Link href={data.ctaPrimaryHref} className={styles.ctaPrimary}>
                {data.ctaPrimaryText}
              </Link>
              <Link href={data.ctaGhostHref} className={styles.ctaGhost}>
                {data.ctaGhostText}
              </Link>
            </div>

            {data.quickFacts?.length ? (
              <div className={styles.metaRow}>
                {data.quickFacts.map((f, i) => (
                  <div className={styles.metaCard} key={`${f.value}-${i}`}>
                    <span className={styles.metaNumber}>{f.value}</span>
                    <span className={styles.metaLabel}>{f.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.vignette} aria-hidden="true" />
    </section>
  );
}
