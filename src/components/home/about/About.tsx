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
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  lead: 'A curated collective of DJs and musicians crafting atmosphere-first experiences — from soulful acoustics to floor-filling sets. We deliver sound that fits the room, the guests, and the brand.',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ],
  videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
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

const PRIMARY_VALUES = 4;

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
  const [lightbox, setLightbox] = useState(false);
  const [valuesOpen, setValuesOpen] = useState(false);
  const [valuesMaxH, setValuesMaxH] = useState(0);
  const [valuesLockOpen, setValuesLockOpen] = useState(false);
  const [showAllValues] = useState(false);

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
        if (mounted) {
          setData({
            ...FALLBACK,
            ...json,
            videoUrl: json.videoUrl ? normalizeUrl(json.videoUrl) : FALLBACK.videoUrl,
            videoPoster: json.videoPoster ? normalizeUrl(json.videoPoster) : undefined,
          });
        }
      } catch {
        /* fallback */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* Measure values panel */
  useEffect(() => {
    const el = valuesInnerRef.current;
    if (!el) return;

    const measure = () => setValuesMaxH(el.scrollHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data, valuesOpen, showAllValues]);

  useEffect(() => {
    if (!valuesOpen) {
      setValuesLockOpen(false);
      return;
    }
    const t = setTimeout(() => setValuesLockOpen(true), 480);
    return () => clearTimeout(t);
  }, [valuesOpen]);

  const videoUrl = normalizeUrl(data.videoUrl);
  const ytSrc = ytEmbed(videoUrl);
  const vmSrc = vmEmbed(videoUrl);

  return (
    <section ref={sectionRef} className={styles.about} aria-label="About">
      <div className={styles.inner}>
        <div className={styles.kicker}>{data.eyebrow}</div>
        <h2 className={styles.title}>{data.title}</h2>

        <div className={styles.mediaBlock}>
          <button
            type="button"
            className={styles.videoThumb}
            onClick={() => setLightbox(true)}
            aria-label="Play About video"
          >
            {data.videoPoster && (
              <Image
                src={data.videoPoster}
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 1160px"
                priority={false}
              />
            )}

            <span className={styles.thumbFallback} />
            <span className={styles.thumbVignette} />

            <span className={styles.playBadge}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M6 4.5l7 4.5-7 4.5V4.5z" fill="currentColor" />
              </svg>
            </span>

            {data.videoCaption && <span className={styles.thumbCaption}>{data.videoCaption}</span>}
          </button>

          <p className={styles.blurb}>{data.lead}</p>
        </div>

        <button
          type="button"
          className={`${styles.bigLink} ${valuesOpen ? styles.active : ''}`}
          onClick={() => setValuesOpen((s) => !s)}
        >
          <span className={styles.bigLinkLabel}>
            <span className={styles.underline}>
              {valuesOpen ? 'Hide values' : 'More about Nocturna'}
            </span>
            <span className={styles.subnote}>Ethos & values</span>
          </span>
        </button>

        <div
          className={styles.valuesReveal}
          style={{
            maxHeight: valuesOpen ? (valuesLockOpen ? 'none' : `${valuesMaxH + 40}px`) : 0,
          }}
        >
          <div ref={valuesInnerRef} className={styles.valuesInner}>
            <div className={styles.valuesGrid}>
              {primaryValues.map((v) => (
                <article key={v.title} className={styles.valueCard}>
                  <h4>{v.title}</h4>
                  <p>{v.body}</p>
                </article>
              ))}
              {showAllValues &&
                extraValues.map((v) => (
                  <article key={v.title} className={styles.valueCard}>
                    <h4>{v.title}</h4>
                    <p>{v.body}</p>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className={styles.lightbox}
          onClick={(e) => e.target === e.currentTarget && setLightbox(false)}
        >
          <div className={styles.lbBox}>
            <button className={styles.lbClose} onClick={() => setLightbox(false)}>
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
      )}
    </section>
  );
}
