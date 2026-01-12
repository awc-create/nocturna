'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './Clients.module.scss';

type ClientLogo = {
  name: string;
  src: string;
  href?: string;

  blurb?: string;

  quote?: string;
  personName?: string;
  personTitle?: string;

  storyUrl?: string;
  storyLabel?: string;
};

type ClientsProps = {
  initialTitle?: string;
  initialLead?: string;
  initialLogos?: ClientLogo[];
  enableClientRefresh?: boolean;
};

const DEFAULTS: ClientLogo[] = [
  {
    name: "Regina's Bar & Restaurant",
    src: '/assets/clients/garden.png',
    blurb: 'Restaurant & Late-Night Bar, Birmingham',
    quote: '“They keep the room perfectly tuned, from first drink to last call.”',
    personName: 'Gregorio',
    personTitle: 'General Manager',
    storyUrl: '/case-studies/reginas',
    storyLabel: 'Watch the story',
  },
  {
    name: 'Luna Lounge',
    src: '/assets/clients/luna.png',
    blurb: 'Cocktail Bar & Events',
    quote: '“Smooth, brand-safe sets that still feel fresh every week.”',
    personName: '—',
    personTitle: 'Brand Director',
  },
  {
    name: 'Stardust',
    src: '/assets/clients/stardust.png',
    blurb: 'Live Events & Private Hire',
    quote: '“Reliable rosters and zero drama with tech or timings.”',
    personName: '—',
    personTitle: 'Events Lead',
  },
  {
    name: 'Stellar',
    src: '/assets/clients/stellar.png',
    blurb: 'Late-Night Venue',
    quote: '“Guests notice the music — in a good way, not a loud way.”',
    personName: '—',
    personTitle: 'Venue Owner',
  },
  {
    name: 'Symphony Center',
    src: '/assets/clients/symphony.png',
    blurb: 'Culture & Programming',
    quote: '“They understand our audience and programme to match.”',
    personName: '—',
    personTitle: 'Programming Manager',
  },
];

function mergeWithDefaults(items: ClientLogo[]) {
  return items.map((it, i) => ({
    ...DEFAULTS[i % DEFAULTS.length],
    ...it,
  }));
}

export default function Clients({
  initialTitle,
  initialLead,
  initialLogos,
  enableClientRefresh = true,
}: ClientsProps) {
  const [title, setTitle] = useState<string>(initialTitle ?? 'Our Clients');
  const [lead, setLead] = useState<string>(
    initialLead ?? 'Trusted by leading venues, bars and creative brands.'
  );

  const [logos, setLogos] = useState<ClientLogo[]>(() => {
    if (Array.isArray(initialLogos) && initialLogos.length) return initialLogos;
    return DEFAULTS;
  });

  const [paused, setPaused] = useState(false);

  // ✅ mobile/tap expansion: which card is expanded (keyed by name)
  const [expanded, setExpanded] = useState<string | null>(null);

  const many = logos.length >= 5;
  const glideList = useMemo(() => (many ? [...logos, ...logos] : logos), [many, logos]);

  const CARD_W = 240;
  const GAP = 40;
  const STEP = useMemo(() => CARD_W + GAP, []);
  const SPEED = useMemo(() => 30, []); // px/sec

  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastT = useRef(0);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!enableClientRefresh) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/home/clients', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as {
          title?: string;
          lead?: string;
          items?: ClientLogo[];
        };

        if (!mounted) return;

        if (typeof data?.title === 'string' && data.title.trim()) setTitle(data.title.trim());
        if (typeof data?.lead === 'string' && data.lead.trim()) setLead(data.lead.trim());

        if (Array.isArray(data?.items) && data.items.length) {
          setLogos(mergeWithDefaults(data.items));
        }
      } catch {
        // keep current state
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enableClientRefresh]);

  // Continuous glide carousel
  useEffect(() => {
    if (!many) return;

    const loopW = logos.length * STEP;
    if (!loopW) return;

    const tick = (t: number) => {
      if (!lastT.current) lastT.current = t;
      const dt = (t - lastT.current) / 1000;
      lastT.current = t;

      if (!pausedRef.current) {
        let next = offsetRef.current + SPEED * dt;
        if (next >= loopW) next -= loopW;

        offsetRef.current = next;
        setOffset(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastT.current = 0;
    };
  }, [many, logos.length, STEP, SPEED]);

  const shiftBy = (dir: 1 | -1) => {
    pausedRef.current = true;
    setPaused(true);

    const loopW = logos.length * STEP;
    let next = offsetRef.current + dir * STEP;

    if (next < 0) next += loopW;
    if (next >= loopW) next -= loopW;

    offsetRef.current = next;
    setOffset(next);
  };

  const toggleExpanded = (key: string) => {
    pausedRef.current = true;
    setPaused(true);
    setExpanded((prev) => (prev === key ? null : key));
  };

  const renderCard = (logo: ClientLogo) => {
    const isExpanded = expanded === logo.name;

    return (
      <div
        className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}
        onClick={() => toggleExpanded(logo.name)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded(logo.name);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <div className={styles.card}>
          <div className={styles.cardInner}>
            {/* FRONT */}
            <div className={styles.face}>
              {logo.href ? (
                <a
                  href={logo.href}
                  aria-label={logo.name}
                  title={logo.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image src={logo.src} alt={logo.name} width={180} height={80} />
                </a>
              ) : (
                <Image src={logo.src} alt={logo.name} width={180} height={80} />
              )}
            </div>

            {/* BACK */}
            <div className={`${styles.face} ${styles.back}`}>
              <blockquote>{logo.quote}</blockquote>

              <div className={styles.meta}>
                <strong>{logo.personName}</strong>
                <span>{logo.personTitle}</span>
              </div>

              {logo.storyUrl ? (
                <a
                  href={logo.storyUrl}
                  className={styles.storyBtn}
                  onClick={(e) => e.stopPropagation()}
                >
                  {logo.storyLabel ?? 'Watch the story'}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Under-card blurb pill */}
        {logo.blurb ? <div className={styles.cardLabel}>{logo.blurb}</div> : null}
      </div>
    );
  };

  return (
    <section className={styles.section} aria-labelledby="clients-heading">
      <header className={styles.head}>
        <h2 id="clients-heading">{title}</h2>
        <p>{lead}</p>
      </header>

      {/* GRID (≤4) */}
      {!many ? (
        <div className={styles.grid}>
          {logos.map((l) => (
            <div key={l.name}>{renderCard(l)}</div>
          ))}
        </div>
      ) : (
        /* CAROUSEL (5+) */
        <div
          className={styles.carousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prev}`}
            onClick={() => shiftBy(-1)}
            aria-label="Previous"
          >
            ‹
          </button>

          <button
            type="button"
            className={`${styles.navBtn} ${styles.next}`}
            onClick={() => shiftBy(1)}
            aria-label="Next"
          >
            ›
          </button>

          {/* ✅ Horizontal-only clipping container */}
          <div className={styles.viewport}>
            <div className={styles.track} style={{ transform: `translate3d(${-offset}px,0,0)` }}>
              {glideList.map((l, i) => (
                <div key={`${l.name}-${i}`} className={styles.slide}>
                  {renderCard(l)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
