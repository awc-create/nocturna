// src/components/admin/settings/FAQSettings.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './FAQSettings.module.scss';

type FaqCtaType = 'none' | 'enquire' | 'join' | 'contact';

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  ctaType: FaqCtaType;
  ctaLabel: string;
};

type FaqConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  items: FaqItem[];
};

const FALLBACK_ITEMS: FaqItem[] = [
  {
    id: 'venues-1',
    category: 'For venues & events',
    question: 'What kind of venues do you work with?',
    answer:
      'We curate music for restaurants, bars, rooftops, lounges, members’ clubs and private events. The focus is always on atmosphere – matching the music to your brand, guest profile and schedule.',
    ctaType: 'enquire',
    ctaLabel: 'Enquire about a booking',
  },
  {
    id: 'venues-2',
    category: 'For venues & events',
    question: 'How does the booking process work?',
    answer:
      'Start by sending an enquiry with details about your venue, schedule and music brief. We’ll follow up with a short call, then propose artists and a music direction. Once approved, we lock in dates and send a simple agreement.',
    ctaType: 'enquire',
    ctaLabel: 'Open enquiry form',
  },
  {
    id: 'artists-1',
    category: 'For artists',
    question: 'How do I join the Essentia roster?',
    answer:
      'Use the “Join the roster” form on the homepage to share your links, current venues and a short intro. We review every application carefully and will be in touch if there is a suitable fit.',
    ctaType: 'join',
    ctaLabel: 'Apply to join',
  },
  {
    id: 'general-1',
    category: 'General',
    question: 'I still have questions that aren’t covered here.',
    answer:
      'No problem. You can contact us directly and we’ll route your message to the right person on the team.',
    ctaType: 'contact',
    ctaLabel: 'Contact us',
  },
  {
    id: 'general-2',
    category: 'General',
    question: 'What areas do you currently cover?',
    answer:
      'We work primarily across the UK with a core presence in major cities. For international bookings, please include travel details in your enquiry and we’ll confirm what’s possible.',
    ctaType: 'none',
    ctaLabel: '',
  },
  {
    id: 'general-3',
    category: 'General',
    question: 'Do you help with sound or equipment?',
    answer:
      'We provide guidance on DJ booth layout, PA requirements and basic equipment choices. For full production setups such as lighting or larger PAs, we collaborate with trusted partners.',
    ctaType: 'none',
    ctaLabel: '',
  },
  {
    id: 'general-4',
    category: 'General',
    question: 'Can you provide DJs and musicians for private events?',
    answer:
      'Yes. We regularly curate music for private dinners, brand activations, corporate events and intimate functions, always matching the atmosphere you want to create.',
    ctaType: 'none',
    ctaLabel: '',
  },
  {
    id: 'general-5',
    category: 'General',
    question: 'How far in advance should we book?',
    answer:
      'For residencies, earlier is always better. One-off events are typically booked 1–4 weeks in advance, though we can often accommodate shorter notice depending on artist availability.',
    ctaType: 'none',
    ctaLabel: '',
  },
];

const FALLBACK: FaqConfig = {
  eyebrow: 'Help centre',
  title: 'Frequently asked questions.',
  lead: 'A quick guide for venues, events and artists working with Essentia. If you can’t find what you’re looking for, just get in touch.',
  items: FALLBACK_ITEMS,
};

const makeId = () => `faq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function FAQSettings() {
  const [config, setConfig] = useState<FaqConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/faq', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<FaqConfig>;
          setConfig({
            eyebrow: data.eyebrow?.trim() || FALLBACK.eyebrow,
            title: data.title?.trim() || FALLBACK.title,
            lead: data.lead?.trim() || FALLBACK.lead,
            items: (data.items ?? FALLBACK_ITEMS).map((item, idx) => ({
              id: item.id || makeId() + '_' + idx,
              category: item.category ?? '',
              question: item.question ?? '',
              answer: item.answer ?? '',
              ctaType: (item.ctaType as FaqCtaType) || 'none',
              ctaLabel: item.ctaLabel ?? '',
            })),
          });
        }
      } catch {
        // ignore, keep fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateItem = (index: number, patch: Partial<FaqItem>) => {
    setConfig((prev) => {
      const nextItems = [...prev.items];
      const existing = nextItems[index];
      if (!existing) return prev;
      nextItems[index] = { ...existing, ...patch };
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setConfig((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: makeId(),
          category: '',
          question: 'New question',
          answer: '',
          ctaType: 'none',
          ctaLabel: '',
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const moveItem = (from: number, to: number) => {
    setConfig((prev) => {
      if (to < 0 || to >= prev.items.length) return prev;
      const next = [...prev.items];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...prev, items: next };
    });
  };

  const onTextChange =
    (key: keyof FaqConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('Save /api/settings/faq failed:', res.status, txt);
        throw new Error('Failed to save FAQ settings.');
      }

      alert('FAQ updated. Refresh the site to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving FAQ.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>FAQ</h2>
        <p>Loading FAQ settings…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>FAQ</h2>
      <p>Control the help centre heading and individual questions.</p>

      <div className={styles.form}>
        <label className={styles.full}>
          Eyebrow (small label above title)
          <input
            value={config.eyebrow}
            onChange={onTextChange('eyebrow')}
            placeholder="Help centre"
          />
        </label>

        <label className={styles.full}>
          Title
          <input
            value={config.title}
            onChange={onTextChange('title')}
            placeholder="Frequently asked questions."
          />
        </label>

        <label className={styles.full}>
          Lead paragraph
          <textarea rows={3} value={config.lead} onChange={onTextChange('lead')} />
        </label>

        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>FAQ items</legend>

          {config.items.map((item, index) => (
            <div key={item.id ?? index} className={styles.itemRow}>
              <div className={styles.itemHeader}>
                <span className={styles.itemIndex}>#{index + 1}</span>
                <button
                  type="button"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === config.items.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeItem(index)}
                >
                  Remove
                </button>
              </div>

              <div className={styles.itemGrid}>
                <label>
                  Category (optional)
                  <input
                    value={item.category}
                    onChange={(e) => updateItem(index, { category: e.target.value })}
                    placeholder="For venues & events, For artists, General…"
                  />
                </label>

                <label className={styles.full}>
                  Question
                  <input
                    value={item.question}
                    onChange={(e) => updateItem(index, { question: e.target.value })}
                  />
                </label>

                <label className={styles.full}>
                  Answer
                  <textarea
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateItem(index, { answer: e.target.value })}
                  />
                </label>

                <label>
                  Answer CTA type
                  <select
                    value={item.ctaType}
                    onChange={(e) =>
                      updateItem(index, {
                        ctaType: e.target.value as FaqCtaType,
                      })
                    }
                  >
                    <option value="none">None</option>
                    <option value="enquire">Open enquiry modal</option>
                    <option value="join">Open join modal</option>
                    <option value="contact">Open contact modal</option>
                  </select>
                </label>

                {item.ctaType !== 'none' && (
                  <label>
                    Answer CTA label
                    <input
                      value={item.ctaLabel}
                      onChange={(e) => updateItem(index, { ctaLabel: e.target.value })}
                      placeholder={
                        item.ctaType === 'enquire'
                          ? 'Enquire about a booking'
                          : item.ctaType === 'join'
                            ? 'Apply to join'
                            : 'Contact us'
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            + Add FAQ item
          </button>
        </fieldset>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save FAQ'}
          </button>
        </div>
      </div>
    </section>
  );
}
