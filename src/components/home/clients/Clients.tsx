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
  /**
   * If provided from server/page.tsx, the component renders these immediately
   * (so there is NO “flash of DEFAULTS” on refresh).
   */
  initialTitle?: string;
  initialLead?: string;
  initialLogos?: ClientLogo[];

  /**
   * Optional: allow turning off client-side refresh fetch if you want.
   * Default true to keep existing behavior.
   */
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

/**
 * When admin API returns items, we merge each item over a default slot so:
 * - missing quote/blurb/name/title don’t break the back-face layout
 * - you still get stable styling even if admin only sets name+src
 */
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
  /**
   * KEY CHANGE:
   * We do NOT start with DEFAULTS when server has provided initialLogos.
   * This prevents any “defaults flash” on refresh.
   */
  const [title, setTitle] = useState<string>(initialTitle ?? 'Our Clients');
  const [lead, setLead] = useState<string>(
    initialLead ?? 'Trusted by leading venues, bars and creative brands.'
  );

  const [logos, setLogos] = useState<ClientLogo[]>(() => {
    if (Array.isArray(initialLogos) && initialLogos.length) return initialLogos;
    return DEFAULTS;
  });

  const [paused, setPaused] = useState(false);

  const many = logos.length >= 5;

  // For seamless glide we duplicate the list only in carousel mode
  const glideList = useMemo(() => (many ? [...logos, ...logos] : logos), [many, logos]);

  // keep in sync with SCSS fixed sizing
  const CARD_W = 240;
  const GAP = 40;

  // eslint-friendly stable constants
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

  /**
   * Client-side refresh:
   * You can keep this enabled to reflect admin changes after hydration.
   *
   * IMPORTANT:
   * - We do NOT set DEFAULTS first anymore (server already delivered initial)
   * - We only update state if the API returns items
   * - We merge with defaults so missing fields still render nicely
   */
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

        // If API provides title/lead, use them
        if (typeof data?.title === 'string' && data.title.trim()) setTitle(data.title.trim());
        if (typeof data?.lead === 'string' && data.lead.trim()) setLead(data.lead.trim());

        // If items exist, use them (merged with defaults for missing fields)
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

  /**
   * Continuous glide carousel
   */
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

  /**
   * Arrow controls:
   * - Pause the glide immediately so user interaction feels “in control”
   * - Step exactly one card
   */
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

  const renderCard = (logo: ClientLogo) => (
    <div className={styles.item}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          {/* FRONT */}
          <div className={styles.face}>
            {logo.href ? (
              <a href={logo.href} aria-label={logo.name} title={logo.name}>
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
              <a href={logo.storyUrl} className={styles.storyBtn}>
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
          {/* LEFT ARROW */}
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prev}`}
            onClick={() => shiftBy(-1)}
            aria-label="Previous"
          >
            ‹
          </button>

          {/* RIGHT ARROW */}
          <button
            type="button"
            className={`${styles.navBtn} ${styles.next}`}
            onClick={() => shiftBy(1)}
            aria-label="Next"
          >
            ›
          </button>

          {/* ✅ NEW: viewport wrapper so vertical overflow can show */}
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
