'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import styles from './Services.module.scss';

export type Service = {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
  detail?: string;
  includes?: string[];
  /** Front image darkness (0 → 0.8). Higher = darker. */
  overlay?: number;
};

type ServicesResponse = {
  kicker?: string;
  title?: string;
  lead?: string;
  items?: Service[];
};

type ServicesProps = {
  /** Server snapshot to prevent defaults-flash + prevent hydration mismatch */
  initialKicker?: string;
  initialTitle?: string;
  initialLead?: string;
  initialItems?: Service[];

  /** Keep your current “client refresh” behaviour (default true) */
  enableClientRefresh?: boolean;
};

const DEFAULT_OVERLAY = 0.55;

const DEFAULTS: Service[] = [
  {
    key: 'dj',
    title: 'DJs',
    blurb:
      'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
    href: '#enquire',
    image: '/assets/services/djs.jpg',
    tag: 'Nightlife energy',
    detail:
      'Our DJ roster includes experienced selectors used to brand-fit programming, guest-flow control and multi-room setups.',
    includes: [
      'Programming aligned to time of day and atmosphere',
      'DJs briefed on volume, tone, and venue context',
      'Clear communication and artist alignment',
      'One point of contact throughout',
      'Reliable cover if availability changes',
    ],
    overlay: DEFAULT_OVERLAY,
  },
  {
    key: 'musician',
    title: 'Musicians',
    blurb:
      'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
    href: '#enquire',
    image: '/assets/services/musicians.jpg',
    tag: 'Live atmosphere',
    detail:
      'We supply adaptable musicians for brunch, dinner or lounges — artists who enhance the atmosphere without overwhelming the room.',
    includes: [
      'Set formats matched to service style and energy',
      'Musicians briefed on volume, tone, and venue context',
      'Clear communication and artist alignment',
      'One point of contact throughout',
      'Reliable cover if availability changes',
    ],
    overlay: DEFAULT_OVERLAY,
  },
];

// ✅ Type-safe CSS var support (no any)
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

function s(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

function clampOverlay(v: unknown, fallback = DEFAULT_OVERLAY) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.min(0.8, Math.max(0, v));
}

function normalizeItems(items: unknown): Service[] {
  if (!Array.isArray(items)) return DEFAULTS;

  const out: Service[] = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const r = it as Record<string, unknown>;

    const key = s(r.key);
    const title = s(r.title);
    const blurb = s(r.blurb);
    const href = s(r.href) || '#enquire';
    const image = s(r.image);
    const tag = s(r.tag);

    if (!key || !title || !blurb || !image || !tag) continue;

    const detail = s(r.detail) || undefined;

    const includesRaw = r.includes;
    const includes = Array.isArray(includesRaw)
      ? includesRaw.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
      : undefined;

    const overlay = clampOverlay(r.overlay, DEFAULT_OVERLAY);

    out.push({
      key,
      title,
      blurb,
      href,
      image,
      tag,
      detail,
      includes,
      overlay,
    });
  }

  return out.length ? out.slice(0, 12) : DEFAULTS;
}

export default function Services({
  initialKicker,
  initialTitle,
  initialLead,
  initialItems,
  enableClientRefresh = true,
}: ServicesProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  // ✅ Mount gate for anything that can diverge between SSR + client
  const [mounted, setMounted] = useState(false);

  const [services, setServices] = useState<Service[]>(() => {
    if (Array.isArray(initialItems) && initialItems.length) return initialItems;
    return DEFAULTS;
  });

  const [kicker, setKicker] = useState(s(initialKicker) || 'Our Services');
  const [title, setTitle] = useState(s(initialTitle) || 'Sound that fits the room.');
  const [lead, setLead] = useState(
    s(initialLead) || 'Two core offerings to start — built to scale with your brand.'
  );

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isDesktopHover, setIsDesktopHover] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desktop hover detection (runs after hydration)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsDesktopHover(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const toggleCard = (key: string) => setActiveKey((prev) => (prev === key ? null : key));

  // Fetch live data (after hydration). This will not affect the initial HTML snapshot.
  useEffect(() => {
    if (!enableClientRefresh) return;

    let alive = true;

    (async () => {
      try {
        const res = await fetch('/api/home/services', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as ServicesResponse;
        if (!alive) return;

        const nextItems = normalizeItems(data.items);
        setServices(nextItems);

        const nextKicker = s(data.kicker) || 'Our Services';
        const nextTitle = s(data.title) || 'Sound that fits the room.';
        const nextLead =
          s(data.lead) || 'Two core offerings to start — built to scale with your brand.';

        setKicker(nextKicker);
        setTitle(nextTitle);
        setLead(nextLead);
      } catch {
        // keep current (server snapshot or defaults)
      }
    })();

    return () => {
      alive = false;
    };
  }, [enableClientRefresh]);

  // Reveal animation (client-only)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => entry.isIntersecting && el.classList.add(styles.visible)),
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tilt/parallax (client-only)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.card}`)) ?? [];

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

  const handleCardClick = (key: string) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDesktopHover) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('a')) return;
    toggleCard(key);
  };

  const handleMouseEnter = (key: string) => {
    if (!isDesktopHover) return;
    setActiveKey(key);
  };

  const handleMouseLeave = () => {
    if (!isDesktopHover) return;
    setActiveKey(null);
  };

  const noPanel = true;

  // Keep these stable across renders
  const CLOSED = 460; // matches SCSS base closed height cap
  const BASELINE_BULLETS = 4;
  const PER_EXTRA_BULLET = 34;
  const CUSHION = 40;

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

      <div className={styles.mobileHint}>
        <span className={styles.mobileHintTap}>Tap a card to see what’s included.</span>
        <span className={styles.mobileHintHover}>Hover a card to see what’s included.</span>
      </div>

      <div className={styles.grid}>
        {services.map((srv) => {
          const href = srv.href || '#enquire';
          const scrollHandler = href.startsWith('#') ? scrollToSection(href) : undefined;

          const isActive = activeKey === srv.key;

          const includes = Array.isArray(srv.includes)
            ? srv.includes.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
            : [];

          const bulletCount = includes.length;
          const extra = Math.max(0, bulletCount - BASELINE_BULLETS);
          const openH = Math.min(720, CLOSED + CUSHION + extra * PER_EXTRA_BULLET);

          const overlay = clampOverlay(srv.overlay, DEFAULT_OVERLAY);

          const cardVars: CSSVars | undefined = mounted
            ? {
                '--openH': `${openH}px`,
                '--frontOverlay': `${overlay}`,
              }
            : undefined;

          return (
            <article key={srv.key} className={styles.card}>
              <div
                className={`${styles.cardInner} ${isActive ? styles.cardInnerActive : ''}`}
                style={cardVars}
                onClick={handleCardClick(srv.key)}
                onMouseEnter={() => handleMouseEnter(srv.key)}
                onMouseLeave={handleMouseLeave}
              >
                {/* FRONT */}
                <div className={`${styles.face} ${styles.front}`}>
                  <div
                    className={styles.media}
                    style={{ backgroundImage: `url(${srv.image})` }}
                    aria-hidden="true"
                  />

                  <div className={styles.scrimGlow} aria-hidden="true" />
                  <div className={styles.scrim} aria-hidden="true" />

                  <div className={styles.info}>
                    <span className={styles.tag}>{srv.tag}</span>
                    <h3 className={styles.cardTitle}>{srv.title}</h3>
                    <p className={styles.blurb}>{srv.blurb}</p>

                    <div className={styles.actions}>
                      <Link href={href} className={styles.cta} onClick={scrollHandler}>
                        Enquire now
                      </Link>
                    </div>

                    <p className={`${styles.flipHint} ${styles.flipHintTap}`}>
                      Tap the card to see what&apos;s included ↓
                    </p>
                    <p className={`${styles.flipHint} ${styles.flipHintHover}`}>
                      Hover to see what&apos;s included ↓
                    </p>
                  </div>
                </div>

                {/* BACK */}
                <div className={`${styles.face} ${styles.back}`}>
                  <div
                    className={styles.media}
                    style={{ backgroundImage: `url(${srv.image})` }}
                    aria-hidden="true"
                  />
                  <div className={styles.scrimBack} aria-hidden="true" />

                  <div className={styles.info}>
                    <span className={styles.tag}>{srv.tag}</span>
                    <h3 className={styles.cardTitle}>{srv.title}</h3>

                    <p className={styles.blurb}>{srv.detail?.trim() ? srv.detail : srv.blurb}</p>

                    {includes.length > 0 && (
                      <div className={styles.includesBox}>
                        <div className={styles.includesTitle}>What’s included:</div>
                        <ul className={styles.includesList}>
                          {includes.map((line, i) => (
                            <li key={`${srv.key}-inc-${i}`}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={styles.actions}>
                      <Link href={href} className={styles.ctaSecondary} onClick={scrollHandler}>
                        Talk to us
                      </Link>
                    </div>

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

      <div className={styles.vignette} aria-hidden="true" />
    </section>
  );
}
