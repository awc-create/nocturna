// src/components/admin/home/AboutSettings.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AboutSettings.module.scss';

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
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Nocturna delivers sound that fits the room — and the brand.',
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
};

export default function AboutUsSettings() {
  const [form, setForm] = useState<AboutData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Draft text for the bullets textarea (keeps blank lines while typing)
  const [bulletsDraft, setBulletsDraft] = useState<string>(FALLBACK.bullets.join('\n'));
  const bulletsRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow helper
  const autoresize = (ta: HTMLTextAreaElement | null) => {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  };

  // Resize when draft changes
  useEffect(() => {
    autoresize(bulletsRef.current);
  }, [bulletsDraft]);

  // Load existing data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/about', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<AboutData>;
          const merged: AboutData = {
            ...FALLBACK,
            ...data,
            bullets: data.bullets ?? FALLBACK.bullets,
            quickFacts: data.quickFacts ?? FALLBACK.quickFacts,
          };
          setForm(merged);
          setBulletsDraft((merged.bullets ?? []).join('\n')); // keep raw text in the textarea
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof AboutData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = typeof e?.target?.value === 'string' ? e.target.value : '';
      setForm((f) => ({ ...f, [key]: val as AboutData[K] }));
    };

  // Update only the draft while typing; parse to array on blur/save
  const onBulletsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = typeof e?.target?.value === 'string' ? e.target.value : '';
    setBulletsDraft(val);
  };

  const commitBullets = () => {
    const parsed = (bulletsDraft ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean); // remove empty lines on commit
    setForm((f) => ({ ...f, bullets: parsed }));
  };

  // ---------- Quick Facts controls ----------
  const addFact = () =>
    setForm((f) => ({ ...f, quickFacts: [...f.quickFacts, { value: '', label: '' }] }));

  const removeFact = (idx: number) =>
    setForm((f) => ({ ...f, quickFacts: f.quickFacts.filter((_, i) => i !== idx) }));

  const onFactChange =
    (idx: number, field: keyof QuickFact) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = typeof e?.target?.value === 'string' ? e.target.value : '';
      setForm((f) => {
        const next = [...f.quickFacts];
        next[idx] = { ...next[idx], [field]: val };
        return { ...f, quickFacts: next };
      });
    };

  const moveFact = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.quickFacts.length) return f;
      const next = [...f.quickFacts];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...f, quickFacts: next };
    });

  const save = async () => {
    // ensure bullets array is up to date with the draft text
    commitBullets();
    setSaving(true);
    try {
      const res = await fetch('/api/home/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('About updated! Refresh Home to see changes.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Network error saving About.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>About Us</h2>
        <p>Loading current content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>About Us</h2>
      <p>Update the mini About block under the hero.</p>

      <div className={styles.form}>
        <label>
          Eyebrow
          <input value={form.eyebrow} onChange={onText('eyebrow')} />
        </label>

        <label className={styles.full}>
          Title
          <input value={form.title} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Lead Paragraph
          <textarea rows={4} value={form.lead} onChange={onText('lead')} />
        </label>

        <label className={styles.full}>
          Bullets (one per line)
          <textarea
            ref={bulletsRef}
            rows={5}
            value={bulletsDraft}
            onChange={onBulletsChange}
            onBlur={commitBullets}
            onInput={(e) => autoresize(e.currentTarget)}
            onKeyDown={(e) => {
              // Let Enter insert newline; just avoid bubbling to any parent key handlers
              if (e.key === 'Enter') e.stopPropagation();
            }}
          />
        </label>

        {/* Dynamic Quick Facts */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Quick Facts</legend>

          {form.quickFacts.map((fact, i) => (
            <div key={i} className={styles.factRow}>
              <label>
                Value
                <input
                  placeholder="e.g. 200+"
                  value={fact.value}
                  onChange={onFactChange(i, 'value')}
                />
              </label>
              <label>
                Label
                <input
                  placeholder="e.g. Gigs curated"
                  value={fact.label}
                  onChange={onFactChange(i, 'label')}
                />
              </label>

              <div className={styles.factActions} aria-label="Quick fact actions">
                <button type="button" onClick={() => moveFact(i, i - 1)} title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => moveFact(i, i + 1)} title="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => removeFact(i)} title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addFact}>
            + Add Fact
          </button>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Primary CTA</legend>
          <label>
            Text
            <input value={form.ctaPrimaryText} onChange={onText('ctaPrimaryText')} />
          </label>
          <label>
            Link
            <input value={form.ctaPrimaryHref} onChange={onText('ctaPrimaryHref')} />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Secondary CTA</legend>
          <label>
            Text
            <input value={form.ctaGhostText} onChange={onText('ctaGhostText')} />
          </label>
          <label>
            Link
            <input value={form.ctaGhostHref} onChange={onText('ctaGhostHref')} />
          </label>
        </fieldset>

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
