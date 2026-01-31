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
  videoUrl?: string;
  videoPoster?: string;
  videoCaption?: string;
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT Essentia',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Essentia delivers sound that fits the room — and the brand.',
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
  // ↓ Use your own video link(s); YT/Vimeo or MP4 both work.
  videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
  // videoPoster: '/media/Essentia-about-poster.jpg',
  videoCaption: '1-min overview',
};

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const [data, setData] = useState<AboutData>(FALLBACK);

  // lightbox state/refs
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);

  const noPanel = true;

  // fade-in
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

  // optional API hydrate
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

  // platform helpers
  const isYouTube = (u?: string) => !!u && /youtube\.com|youtu\.be/i.test(u);
  const isVimeo = (u?: string) => !!u && /vimeo\.com/i.test(u);

  const ytEmbed = (u?: string) => {
    if (!u) return '';
    const id = u.match(/v=([^&]+)/)?.[1] || u.match(/youtu\.be\/([^?]+)/)?.[1] || '';
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  };
  const vimeoEmbed = (u?: string) => {
    if (!u) return '';
    const id = u.match(/vimeo\.com\/(\d+)/)?.[1] || '';
    return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`;
  };

  const onClose = () => {
    setOpen(false);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  // esc + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const backdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === lightboxRef.current) onClose();
  };

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
          {/* LEFT: title + clickable video card */}
          <div className={styles.leftCol}>
            <h2 id="about-title" className={styles.title}>
              {data.title}
            </h2>

            {data.videoUrl ? (
              <button
                type="button"
                className={styles.videoBanner}
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="about-video-dialog"
              >
                {/* Poster if supplied */}
                {data.videoPoster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.videoPoster} alt="" />
                ) : null}

                {/* Always-visible fallback background */}
                <span className={styles.videoFallback} aria-hidden="true" />

                <span className={styles.videoShade} aria-hidden="true" />
                <span className={styles.videoPlay} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                    <path d="M6 4.5l7 4.5-7 4.5V4.5z" fill="currentColor" />
                  </svg>
                </span>
                <span className={styles.videoLabel}>
                  Watch: Inside Essentia {data.videoCaption ? <em>{data.videoCaption}</em> : null}
                </span>
              </button>
            ) : null}
          </div>

          {/* RIGHT: lead + bullets + ctas + quick facts */}
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

      {/* Lightbox */}
      {data.videoUrl ? (
        <div
          id="about-video-dialog"
          ref={lightboxRef}
          className={`${styles.videoModal} ${open ? styles.open : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="About video"
          onClick={backdropClick}
        >
          <div className={styles.videoBox}>
            <button className={styles.close} onClick={onClose} aria-label="Close video">
              ✕
            </button>
            <div className={styles.aspect}>
              {isYouTube(data.videoUrl) ? (
                <iframe
                  src={ytEmbed(data.videoUrl)}
                  title="About video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : isVimeo(data.videoUrl) ? (
                <iframe
                  src={vimeoEmbed(data.videoUrl)}
                  title="About video"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef}
                  src={data.videoUrl}
                  poster={data.videoPoster}
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.vignette} aria-hidden="true" />
    </section>
  );
}
