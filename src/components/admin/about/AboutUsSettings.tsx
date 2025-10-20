'use client';

import { useEffect, useState } from 'react';

type AboutForm = {
  title: string;
  description: string;
  bulletsCsv: string; // UI convenience; API converts to array
};

const DEFAULTS: AboutForm = {
  title: 'About Us',
  description: 'We’re a team of passionate developers turning ideas into reality.',
  bulletsCsv: '🚀 Fast & scalable, 🎨 Design-driven, 🤝 Client-focused',
};

export default function AboutUsSettings() {
  const [form, setForm] = useState<AboutForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/about', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          title: data.title ?? DEFAULTS.title,
          description: data.description ?? DEFAULTS.description,
          bulletsCsv: Array.isArray(data.bullets) ? data.bullets.join(', ') : DEFAULTS.bulletsCsv,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const setField =
    (key: keyof AboutForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          bullets: form.bulletsCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) return alert('Failed to save About settings.');
      alert('About settings saved!');
    } catch {
      alert('Network error saving About settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>About Us</h2>
      <p>Manage the About page heading, paragraph, and bullets.</p>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', maxWidth: 900 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Title
          <input value={form.title} onChange={setField('title')} placeholder="About Us" />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Bullets (comma-separated)
          <input
            value={form.bulletsCsv}
            onChange={setField('bulletsCsv')}
            placeholder="🚀 Fast & scalable, 🎨 Design-driven, 🤝 Client-focused"
          />
        </label>

        <label
          style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '.35rem' }}
        >
          Description
          <textarea
            rows={4}
            value={form.description}
            onChange={setField('description')}
            placeholder="We’re a team of passionate developers turning ideas into reality."
          />
        </label>

        <div style={{ gridColumn: '1 / -1' }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '.55rem 1rem',
              borderRadius: 6,
              border: '1px solid #111',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
