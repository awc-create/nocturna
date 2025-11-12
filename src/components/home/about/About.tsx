'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './About.module.scss';

type QuickFact = { value: string; label: string };
type ValueCard = { title: string; body: string };

type AboutData = {
  eyebrow: string;
  title: string;
  blurb: string;
  quickFacts: QuickFact[];
  videoUrl?: string;
  videoPoster?: string;
  videoCaption?: string;
  values: ValueCard[];
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  blurb:
    'A curated collective of DJs and musicians crafting atmosphere-first experiences — from soulful acoustics to floor-filling sets. We deliver sound that fits the room, the guests, and the brand.',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ],
  videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
  // videoPoster: '/media/nocturna-about-poster.jpg',
  videoCaption: '1-min overview',
  values: [
    {
      title: 'Curation over chaos',
      body: 'Every brief matched to the right artist, not the nearest calendar gap.',
    },
    {
      title: 'Artist-first',
      body: 'Fair fees, clear comms, reliable logistics — because great work needs great conditions.',
    },
    {
      title: 'Venue-ready',
      body: 'Professionalism on arrival, compact setups, and volume discipline for premium hospitality.',
    },
    {
      title: 'Zero surprises',
      body: 'Transparent pricing, tidy invoicing, and dedicated point of contact from enquiry to encore.',
    },
    {
      title: 'Brand-fit sound',
      body: 'Programming that respects brand tone and guest profile at every touchpoint.',
    },
    {
      title: 'Reliable rosters',
      body: 'Depth of talent to cover multi-site schedules and last-minute changes.',
    },
    {
      title: 'Tech-ready',
      body: 'Clear specs, tidy setups, and no drama with in-house teams or residents.',
    },
    {
      title: 'Guest-first',
      body: 'Read-the-room sets that build energy without overwhelming the space.',
    },
    {
      title: 'Feedback loops',
      body: 'We learn every week to refine the policy and roster for your venue.',
    },
  ],
};

const PRIMARY_VALUES = 4; // show 4, then progressively disclose the rest

export default function About() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const [data, setData] = useState<AboutData>(FALLBACK);

  // Lightbox (video)
  const [lightbox, setLightbox] = useState(false);

  // Values reveal (toggled by “More about Nocturna”)
  const [valuesOpen, setValuesOpen] = useState(false);
  const valuesInnerRef = useRef<HTMLDivElement | null>(null);
  const [valuesMaxH, setValuesMaxH] = useState(0);

  // After open animation completes, drop max-height cap to avoid clipping
  const [valuesLockOpen, setValuesLockOpen] = useState(false);

  // Progressive disclosure inside values reveal
  const [showAllValues, setShowAllValues] = useState(false);
  const primaryValues = data.values.slice(0, PRIMARY_VALUES);
  const extraValues = data.values.slice(PRIMARY_VALUES);

  // Fade-in
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    el.classList.add(styles.visible);
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && el.classList.add(styles.visible)),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // (Optional) API hydrate
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/about-2', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<AboutData>;
        if (mounted) {
          setData({
            ...FALLBACK,
            ...json,
            quickFacts: json.quickFacts ?? FALLBACK.quickFacts,
            values: json.values ?? FALLBACK.values,
          });
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Measure values content for height animation
  useEffect(() => {
    const el = valuesInnerRef.current;
    if (!el) return;
    const measure = () => setValuesMaxH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, valuesOpen, showAllValues]);

  // Unlock after transition so panel can grow freely (no clipping)
  useEffect(() => {
    if (!valuesOpen) {
      setValuesLockOpen(false);
      return;
    }
    const t = setTimeout(() => setValuesLockOpen(true), 480); // match CSS transition
    return () => clearTimeout(t);
  }, [valuesOpen]);

  // Lightbox helpers
  const isYT = (u?: string) => !!u && /youtube\.com|youtu\.be/i.test(u);
  const isVimeo = (u?: string) => !!u && /vimeo\.com/i.test(u);
  const yt = (u?: string) => {
    if (!u) return '';
    const id = u.match(/v=([^&]+)/)?.[1] || u.match(/youtu\.be\/([^?]+)/)?.[1] || '';
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`;
  };
  const vm = (u?: string) => {
    if (!u) return '';
    const id = u.match(/vimeo\.com\/(\d+)/)?.[1] || '';
    return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&autoplay=1`;
  };

  // Stagger cards when values first open
  useEffect(() => {
    if (!valuesOpen) return;
    const cards = Array.from(
      sectionRef.current?.querySelectorAll<HTMLElement>(`.${styles.valueCard}`) ?? []
    );
    cards.forEach((c, i) => {
      c.style.animationDelay = `${120 + i * 70}ms`;
      c.classList.add(styles.popIn);
    });
  }, [valuesOpen]);

  return (
    <section ref={sectionRef} className={styles.about} data-section="after-hero" aria-label="About">
      <div className={styles.inner}>
        <div className={styles.kicker}>{data.eyebrow}</div>
        <h2 className={styles.title}>{data.title}</h2>

        {/* VIDEO (hero) */}
        <div className={styles.mediaBlock}>
          <button
            type="button"
            className={styles.videoThumb}
            onClick={() => setLightbox(true)}
            aria-haspopup="dialog"
            aria-label="Play About video"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {data.videoPoster ? <img src={data.videoPoster} alt="" /> : null}
            <span className={styles.thumbFallback} aria-hidden="true" />
            <span className={styles.thumbVignette} aria-hidden="true" />
            <span className={styles.playBadge} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M6 4.5l7 4.5-7 4.5V4.5z" fill="currentColor" />
              </svg>
            </span>
            {data.videoCaption ? (
              <span className={styles.thumbCaption}>{data.videoCaption}</span>
            ) : null}
          </button>

          <p className={styles.blurb}>{data.blurb}</p>

          {data.quickFacts?.length ? (
            <div className={styles.statsRow}>
              {data.quickFacts.map((f, i) => (
                <div key={i} className={styles.stat}>
                  <span className={styles.statNumber}>{f.value}</span>
                  <span className={styles.statLabel}>{f.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* TEXT CTA → toggles VALUES ONLY */}
        <button
          type="button"
          className={`${styles.bigLink} ${valuesOpen ? styles.active : ''}`}
          onClick={() => setValuesOpen((s) => !s)}
          aria-expanded={valuesOpen}
          aria-controls="about2-values"
          aria-label={valuesOpen ? 'Hide values' : 'Show ethos and values'}
        >
          <span className={styles.bigLinkLabel}>
            <span className={styles.underline}>
              {valuesOpen ? 'Hide values' : 'More about Nocturna'}
            </span>
            <span className={styles.subnote}>Ethos &amp; values</span>
          </span>

          <span className={styles.chev} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className={styles.orb} aria-hidden="true" />
        </button>

        {/* VALUES REVEAL */}
        <div
          id="about2-values"
          className={`${styles.valuesReveal} ${valuesOpen ? styles.valuesRevealOpen : ''}`}
          style={{
            maxHeight: valuesOpen ? (valuesLockOpen ? 'none' : `${valuesMaxH + 40}px`) : 0,
          }}
        >
          <div ref={valuesInnerRef} className={styles.valuesInner}>
            <h3 className={styles.valuesTitle}>Ethos & values</h3>

            <div className={`${styles.valuesGrid} ${showAllValues ? styles.valuesOpen : ''}`}>
              {primaryValues.map((v, i) => (
                <article key={`p-${i}`} className={`${styles.valueCard} ${styles.popIn}`}>
                  <h4>{v.title}</h4>
                  <p>{v.body}</p>
                </article>
              ))}
              {extraValues.map((v, i) => (
                <article key={`x-${i}`} className={`${styles.valueCard} ${styles.extra}`}>
                  <h4>{v.title}</h4>
                  <p>{v.body}</p>
                </article>
              ))}

              {extraValues.length > 0 && !showAllValues ? (
                <div className={styles.valuesMore}>
                  <button
                    type="button"
                    className={styles.valuesBtn}
                    onClick={() => setShowAllValues(true)}
                    aria-expanded={showAllValues}
                  >
                    Show all values ({data.values.length})
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX (scroll behind allowed) */}
      {lightbox ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="About video"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightbox(false);
          }}
        >
          <div className={styles.lbBox}>
            <button
              className={styles.lbClose}
              onClick={() => setLightbox(false)}
              aria-label="Close video"
            >
              ✕
            </button>
            <div className={styles.lbAspect}>
              {isYT(data.videoUrl) ? (
                <iframe
                  src={yt(data.videoUrl)}
                  title="About Nocturna video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : isVimeo(data.videoUrl) ? (
                <iframe
                  src={vm(data.videoUrl)}
                  title="About Nocturna video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : data.videoUrl ? (
                <video
                  src={data.videoUrl}
                  poster={data.videoPoster ?? undefined}
                  controls
                  autoPlay
                  playsInline
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
