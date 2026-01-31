'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './About.module.scss';

type QuickFact = { value: string; label: string };
type ValueCard = { title: string; body: string };

type AboutData = {
  eyebrow: string;
  title: string;
  lead: string;
  quickFacts: QuickFact[];
  videoUrl?: string;
  videoPoster?: string;
  videoCaption?: string;
  values: ValueCard[];
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT Essentia',
  title: 'Bringing nightlife to life.',
  lead: 'A curated collective of DJs and musicians crafting atmosphere-first experiences — from soulful acoustics to floor-filling sets. We deliver sound that fits the room, the guests, and the brand.',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ],
  videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
  videoPoster: undefined,
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

const PRIMARY_VALUES = 6;

/* ================= URL HELPERS ================= */

const normalizeUrl = (raw?: string) => {
  if (!raw) return '';
  const s = raw.trim();
  if (!s) return '';
  if (s.startsWith('http://')) return `https://${s.slice(7)}`;
  if (!/^https?:\/\//i.test(s)) return `https://${s}`;
  return s;
};

const getYouTubeId = (raw?: string) => {
  const u0 = normalizeUrl(raw);
  if (!u0) return '';
  try {
    const u = new URL(u0);

    if (u.hostname.includes('youtu.be')) {
      return u.pathname.split('/').filter(Boolean)[0] ?? '';
    }

    const v = u.searchParams.get('v');
    if (v) return v;

    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.findIndex((p) => ['shorts', 'live', 'embed'].includes(p));
    return i >= 0 ? (parts[i + 1] ?? '') : '';
  } catch {
    return '';
  }
};

const ytEmbed = (raw?: string) => {
  const id = getYouTubeId(raw);
  return id
    ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1`
    : '';
};

const vmEmbed = (raw?: string) => {
  const u0 = normalizeUrl(raw);
  const id = u0.match(/vimeo\.com\/(\d+)/)?.[1];
  return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : '';
};

export default function About() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const valuesInnerRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<AboutData>(FALLBACK);

  // Lightbox
  const [lightbox, setLightbox] = useState(false);

  // Values reveal (open/close section)
  const [valuesOpen, setValuesOpen] = useState(false);

  // Progressive disclosure (show extras)
  const [showAllValues, setShowAllValues] = useState(false);

  // Height animation
  const [valuesMaxH, setValuesMaxH] = useState(0);
  const [valuesLockOpen, setValuesLockOpen] = useState(false);

  const primaryValues = data.values.slice(0, PRIMARY_VALUES);
  const extraValues = data.values.slice(PRIMARY_VALUES);

  /* Fade in */
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

  /* Fetch content */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/about', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<AboutData>;

        if (!mounted) return;

        setData((prev) => ({
          ...prev,
          ...FALLBACK,
          ...json,
          quickFacts:
            Array.isArray(json.quickFacts) && json.quickFacts.length
              ? json.quickFacts
              : FALLBACK.quickFacts,
          values: Array.isArray(json.values) && json.values.length ? json.values : FALLBACK.values,
          videoUrl: json.videoUrl ? normalizeUrl(json.videoUrl) : FALLBACK.videoUrl,
          videoPoster: json.videoPoster ? normalizeUrl(json.videoPoster) : FALLBACK.videoPoster,
          videoCaption: json.videoCaption ?? FALLBACK.videoCaption,
        }));
      } catch {
        // keep fallback
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* Measure values panel (for max-height animation) */
  useEffect(() => {
    const el = valuesInnerRef.current;
    if (!el) return;

    const measure = () => setValuesMaxH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, valuesOpen, showAllValues]);

  /* Unlock after transition so panel can grow freely (no clipping) */
  useEffect(() => {
    if (!valuesOpen) {
      setValuesLockOpen(false);
      // Optional: when you close, collapse extra values next time
      setShowAllValues(false);
      return;
    }
    const t = setTimeout(() => setValuesLockOpen(true), 480);
    return () => clearTimeout(t);
  }, [valuesOpen]);

  /* Stagger animation when opening */
  useEffect(() => {
    if (!valuesOpen) return;
    const cards = Array.from(
      sectionRef.current?.querySelectorAll<HTMLElement>(`.${styles.valueCard}`) ?? []
    );
    cards.forEach((c, i) => {
      c.style.animationDelay = `${120 + i * 70}ms`;
      c.classList.add(styles.popIn);
    });
  }, [valuesOpen, showAllValues]);

  const videoUrl = normalizeUrl(data.videoUrl);
  const ytSrc = ytEmbed(videoUrl);
  const vmSrc = vmEmbed(videoUrl);

  return (
    <section ref={sectionRef} className={styles.about} aria-label="About">
      <div className={styles.inner}>
        <div className={styles.kicker}>{data.eyebrow}</div>
        <h2 className={styles.title}>{data.title}</h2>

        {/* VIDEO + TEXT */}
        <div className={styles.mediaBlock}>
          <button
            type="button"
            className={styles.videoThumb}
            onClick={() => setLightbox(true)}
            aria-label="Play About video"
          >
            {data.videoPoster ? (
              <Image
                src={data.videoPoster}
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 1160px"
                priority={false}
              />
            ) : null}

            <span className={styles.thumbFallback} aria-hidden="true" />
            <span className={styles.thumbVignette} aria-hidden="true" />

            <span className={styles.playBadge} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M6 4.5l7 4.5-7 4.5V4.5z" fill="currentColor" />
              </svg>
            </span>

            {data.videoCaption ? (
              <span className={styles.thumbCaption}>{data.videoCaption}</span>
            ) : null}
          </button>

          <div className={styles.blurb}>
            {data.lead
              .split(/\n\s*\n/) // split by blank lines
              .map((chunk, i) => (
                <p key={i} className={styles.blurbLine}>
                  {chunk.trim()}
                </p>
              ))}
          </div>

          {/* ✅ BACK: 200+/UK-wide/DJs */}
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

        {/* TOGGLE VALUES */}
        <button
          type="button"
          className={`${styles.bigLink} ${valuesOpen ? styles.active : ''}`}
          onClick={() => setValuesOpen((s) => !s)}
          aria-expanded={valuesOpen}
          aria-controls="about-values"
        >
          <span className={styles.bigLinkLabel}>
            <span className={styles.underline}>
              {valuesOpen ? 'Hide values' : 'More about Essentia'}
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
          id="about-values"
          className={`${styles.valuesReveal} ${valuesOpen ? styles.valuesRevealOpen : ''}`}
          style={{
            maxHeight: valuesOpen ? (valuesLockOpen ? 'none' : `${valuesMaxH + 40}px`) : 0,
          }}
        >
          <div ref={valuesInnerRef} className={styles.valuesInner}>
            <h3 className={styles.valuesTitle}>Ethos & values</h3>

            {/* ✅ BACK: styles.valuesOpen controls extra-cards */}
            <div className={`${styles.valuesGrid} ${showAllValues ? styles.valuesOpen : ''}`}>
              {primaryValues.map((v, i) => (
                <article key={`p-${i}`} className={styles.valueCard}>
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

              {!showAllValues && extraValues.length > 0 ? (
                <div className={styles.valuesMore}>
                  <button
                    type="button"
                    className={styles.valuesBtn}
                    onClick={() => setShowAllValues(true)}
                  >
                    Show all values ({data.values.length})
                  </button>
                </div>
              ) : null}
            </div>

            <div className={styles.swipeHint}>Swipe for more</div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox ? (
        <div
          className={styles.lightbox}
          onClick={(e) => e.target === e.currentTarget && setLightbox(false)}
        >
          <div className={styles.lbBox}>
            <button
              className={styles.lbClose}
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className={styles.lbAspect}>
              {ytSrc ? (
                <iframe src={ytSrc} allow="autoplay; encrypted-media" allowFullScreen />
              ) : vmSrc ? (
                <iframe src={vmSrc} allow="autoplay; fullscreen" allowFullScreen />
              ) : (
                videoUrl && <video src={videoUrl} controls autoPlay playsInline />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
