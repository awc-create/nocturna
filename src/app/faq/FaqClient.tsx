'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useModals } from '@/components/home/modals/ModalContext';
import styles from './Faq.module.scss';

type FaqCtaType = 'none' | 'enquire' | 'join' | 'contact';

type FaqItem = {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  ctaType?: FaqCtaType;
  ctaLabel?: string;
};

type FaqConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  items: FaqItem[];
};

const FALLBACK: FaqConfig = {
  eyebrow: 'Help centre',
  title: 'Frequently asked questions.',
  lead: 'A quick guide for venues, events and artists working with Essentia. If you can’t find what you’re looking for, just get in touch.',
  items: [
    {
      category: 'For venues & events',
      question: 'What kind of venues do you work with?',
      answer:
        'We curate music for restaurants, bars, rooftops, lounges, members’ clubs and private events. The focus is always on atmosphere – matching the music to your brand, guest profile and schedule.',
      ctaType: 'enquire',
      ctaLabel: 'Enquire about a booking',
    },
    {
      category: 'For venues & events',
      question: 'How does the booking process work?',
      answer:
        'Start by sending an enquiry with details about your venue, schedule and music brief. We’ll follow up with a short call, then propose artists and a music direction. Once approved, we lock in dates and send a simple agreement.',
      ctaType: 'enquire',
      ctaLabel: 'Open enquiry form',
    },
    {
      category: 'For artists',
      question: 'How do I join the Essentia roster?',
      answer:
        'Use the “Join the roster” form on the homepage to share your links, current venues and a short intro. We review every application carefully and will be in touch if there is a suitable fit.',
      ctaType: 'join',
      ctaLabel: 'Apply to join',
    },
    {
      category: 'General',
      question: 'I still have questions that aren’t covered here.',
      answer:
        'No problem. You can contact us directly and we’ll route your message to the right person on the team.',
      ctaType: 'contact',
      ctaLabel: 'Contact us',
    },
    {
      category: 'General',
      question: 'What areas do you currently cover?',
      answer:
        'We work primarily across the UK with a core presence in major cities. For international bookings, please include travel details in your enquiry and we’ll confirm what’s possible.',
      ctaType: 'none',
    },
    {
      category: 'General',
      question: 'Do you help with sound or equipment?',
      answer:
        'We provide guidance on DJ booth layout, PA requirements and basic equipment choices. For full production setups such as lighting or larger PAs, we collaborate with trusted partners.',
      ctaType: 'none',
    },
    {
      category: 'General',
      question: 'Can you provide DJs and musicians for private events?',
      answer:
        'Yes. We regularly curate music for private dinners, brand activations, corporate events and intimate functions, always matching the atmosphere you want to create.',
      ctaType: 'none',
    },
    {
      category: 'General',
      question: 'How far in advance should we book?',
      answer:
        'For residencies, earlier is always better. One-off events are typically booked 1–4 weeks in advance, though we can often accommodate shorter notice depending on artist availability.',
      ctaType: 'none',
    },
  ],
};

export default function FaqClient() {
  const [config, setConfig] = useState<FaqConfig>(FALLBACK);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { openEnquire, openJoin, openContact } = useModals();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/settings/faq', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as Partial<FaqConfig>;
        if (!mounted) return;

        setConfig({
          eyebrow: data.eyebrow?.trim() || FALLBACK.eyebrow,
          title: data.title?.trim() || FALLBACK.title,
          lead: data.lead?.trim() || FALLBACK.lead,
          items: (data.items ?? FALLBACK.items).map((item, idx) => ({
            id: item.id || `faq_${idx}`,
            question: item.question ?? '',
            answer: item.answer ?? '',
            category: item.category ?? undefined,
            ctaType: (item.ctaType as FaqCtaType) || 'none',
            ctaLabel: item.ctaLabel ?? '',
          })),
        });
      } catch {
        // keep fallback
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleAnswerCta = (type: FaqCtaType | undefined) => {
    if (!type || type === 'none') return;
    if (type === 'enquire' && typeof openEnquire === 'function') {
      openEnquire();
    } else if (type === 'join' && typeof openJoin === 'function') {
      openJoin();
    } else if (type === 'contact' && typeof openContact === 'function') {
      openContact();
    }
  };

  const getCtaLabel = (item: FaqItem) => {
    if (item.ctaLabel && item.ctaLabel.trim()) return item.ctaLabel.trim();
    switch (item.ctaType) {
      case 'enquire':
        return 'Enquire now';
      case 'join':
        return 'Apply to join';
      case 'contact':
        return 'Contact us';
      default:
        return '';
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>{config.eyebrow}</p>
          <h1 className={styles.title}>{config.title}</h1>
          <p className={styles.lead}>{config.lead}</p>
        </header>

        <div className={styles.accordion} aria-label="Frequently asked questions">
          {config.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-trigger-${index}`;
            const hasCta = item.ctaType && item.ctaType !== 'none';

            return (
              <article
                key={item.id ?? index}
                className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              >
                <button
                  id={buttonId}
                  type="button"
                  className={styles.question}
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <div className={styles.questionTextWrap}>
                    {item.category && <span className={styles.category}>{item.category}</span>}
                    <span className={styles.questionText}>{item.question}</span>
                  </div>
                  <span
                    className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`${styles.answer} ${isOpen ? styles.answerOpen : ''}`}
                >
                  <p>{item.answer}</p>

                  {hasCta && (
                    <button
                      type="button"
                      className={styles.answerCta}
                      onClick={() => handleAnswerCta(item.ctaType as FaqCtaType)}
                    >
                      {getCtaLabel(item)}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.footerCta}>
          <p>Still have a question?</p>
          <Link href="/#contact">Get in touch</Link>
        </div>
      </div>
    </section>
  );
}
