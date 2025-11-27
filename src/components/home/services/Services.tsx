// src/components/home/services/Services.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import styles from './Services.module.scss';

export type Service = {
  key: string;
  title: string; // card title
  blurb: string; // front-of-card copy
  href: string;
  image: string; // front image
  tag: string;
  backImage?: string; // optional back image
  detail?: string; // deeper explanation (back of card)
};

type ServicesResponse = {
  kicker?: string;
  title?: string;
  lead?: string;
  items?: Service[];
};

const DEFAULTS: Service[] = [
  {
    key: 'dj',
    title: 'DJs',
    blurb:
      'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
    href: '#enquire',
    image: '/assets/services/djs.jpg',
    tag: 'Nightlife energy',
    backImage: '/assets/services/djs-back.jpg',
    detail:
      'From weekly residencies to one-off openings, we curate DJs who understand programming, volume discipline and guest flow across the whole night. We manage briefings, scheduling and reliable cover so your venue always has the right selector on the decks.',
  },
  {
    key: 'musician',
    title: 'Musicians',
    blurb:
      'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
    href: '#enquire',
    image: '/assets/services/musicians.jpg',
    tag: 'Live atmosphere',
    backImage: '/assets/services/musicians-back.jpg',
    detail:
      'For brunch, dinner or late-night lounges, we supply musicians who can read the room and adapt sets to brand, moment and space.',
  },
];

export default function Services() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [services, setServices] = useState<Service[]>(DEFAULTS);
  const [kicker, setKicker] = useState('Our Services');
  const [title, setTitle] = useState('Sound that fits the room.');
  const [lead, setLead] = useState('Two core offerings to start — built to scale with your brand.');

  // Which card is “flipped”
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Desktop vs mobile (hover vs tap)
  const [isDesktopHover, setIsDesktopHover] = useState(false);

  // Detect if device supports hover (desktop-ish)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const update = () => {
      setIsDesktopHover(mq.matches);
    };

    update();
    mq.addEventListener?.('change', update);

    return () => {
      mq.removeEventListener?.('change', update);
    };
  }, []);

  const toggleCard = (key: string) => {
    setActiveKey((prev) => (prev === key ? null : key));
  };

  // Fetch live data from /api/home/services
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/services', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Bad response');
        const data = (await res.json()) as ServicesResponse;

        setServices(data.items && data.items.length ? data.items : DEFAULTS);
        setKicker(data.kicker || 'Our Services');
        setTitle(data.title || 'Sound that fits the room.');
        setLead(data.lead || 'Two core offerings to start — built to scale with your brand.');
      } catch (err) {
        console.warn('Falling back to defaults for services:', err);
        setServices(DEFAULTS);
      }
    })();
  }, []);

  // Reveal animation
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

  // Tilt/parallax (outer card)
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.card}`)) ?? [];

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
        card.style.setProperty('--tiltX', '0deg');
        card.style.setProperty('--tiltY', '0deg');
      };
      card.addEventListener('mousemove', onMove as EventListener);
      card.addEventListener('mouseleave', onLeave as EventListener);
      unsubs.push(() => {
        card.removeEventListener('mousemove', onMove as EventListener);
        card.removeEventListener('mouseleave', onLeave as EventListener);
      });
    });

    return () => unsubs.forEach((fn) => fn());
  }, [services]);

  const noPanel = true;

  // Smooth scroll helper
  const scrollToSection =
    (id: string) => (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      if (!id.startsWith('#')) return;
      e.preventDefault();
      const cleanId = id.replace('#', '');
      const target = document.getElementById(cleanId);
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    };

  // Card click: flip card on mobile/tablet (tap)
  const handleCardClick = (key: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    // On desktop-hover mode, don’t use click to flip
    if (isDesktopHover) return;

    const target = e.target as HTMLElement | null;
    if (target && target.closest('a')) return;

    toggleCard(key);
  };

  // Desktop hover handlers
  const handleMouseEnter = (key: string) => {
    if (!isDesktopHover) return;
    setActiveKey(key);
  };

  const handleMouseLeave = () => {
    if (!isDesktopHover) return;
    setActiveKey(null);
  };

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

      {/* Hint row – text swaps between Tap / Hover in CSS */}
      <div className={styles.mobileHint}>
        <span className={styles.mobileHintTap}>Tap a card to see what’s included.</span>
        <span className={styles.mobileHintHover}>Hover a card to see what’s included.</span>
      </div>

      <div className={styles.grid}>
        {services.map((s) => {
          const href = s.href || '#enquire';
          const scrollHandler = href.startsWith('#') ? scrollToSection(href) : undefined;

          const isActive = activeKey === s.key;

          return (
            <article key={s.key} className={styles.card}>
              <div
                className={`${styles.cardInner} ${isActive ? styles.cardInnerActive : ''}`}
                onClick={handleCardClick(s.key)}
                onMouseEnter={() => handleMouseEnter(s.key)}
                onMouseLeave={handleMouseLeave}
              >
                {/* FRONT */}
                <div className={`${styles.face} ${styles.front}`}>
                  <div
                    className={styles.media}
                    style={{ backgroundImage: `url(${s.image})` }}
                    aria-hidden="true"
                  />
                  <div className={styles.scrim} aria-hidden="true" />
                  <div className={styles.info}>
                    <span className={styles.tag}>{s.tag}</span>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                    <p className={styles.blurb}>{s.blurb}</p>
                    <div className={styles.actions}>
                      <Link href={href} className={styles.cta} onClick={scrollHandler}>
                        Enquire now
                      </Link>
                    </div>
                    {/* Front hints: tap vs hover */}
                    <p className={`${styles.flipHint} ${styles.flipHintTap}`}>
                      Tap the card to see what&apos;s included ↓
                    </p>
                    <p className={`${styles.flipHint} ${styles.flipHintHover}`}>
                      Hover to see what&apos;s included ↓
                    </p>
                  </div>
                </div>

                {/* BACK – deeper explanation */}
                <div className={`${styles.face} ${styles.back}`}>
                  <div
                    className={styles.media}
                    style={{
                      backgroundImage: `url(${s.backImage || s.image})`,
                    }}
                    aria-hidden="true"
                  />
                  <div className={styles.scrimBack} aria-hidden="true" />
                  <div className={styles.info}>
                    <span className={styles.tag}>{s.tag}</span>
                    <h3 className={styles.cardTitle}>{s.title}</h3>
                    <p className={styles.blurb}>
                      {s.detail && s.detail.length > 0 ? s.detail : s.blurb}
                    </p>
                    <div className={styles.actions}>
                      <Link href={href} className={styles.ctaSecondary} onClick={scrollHandler}>
                        Talk to us
                      </Link>
                    </div>
                    {/* Back hints */}
                    <p className={`${styles.flipHint} ${styles.flipHintTap}`}>
                      Tap again to return to the overview ↑
                    </p>
                    <p className={`${styles.flipHint} ${styles.flipHintHover}`}>
                      Move your cursor away to return to the overview ↑
                    </p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.footerRow}>
        <Link href="#enquire" className={styles.viewAll} onClick={scrollToSection('#enquire')}>
          Enquire now
        </Link>
      </div>

      <div className={styles.vignette} aria-hidden="true" />
    </section>
  );
}
