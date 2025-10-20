'use client';

import { useEffect, useState } from 'react';

type ContactForm = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  recipientEmail: string;
};

const DEFAULTS: ContactForm = {
  title: 'Contact Us',
  description: 'We’re a team of passionate developers turning ideas into reality.',
  submitLabel: 'Send Message',
  successMessage: 'Message sent! We’ll get back to you soon.',
  recipientEmail: '',
};

export default function ContactSettings() {
  const [form, setForm] = useState<ContactForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/contact', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          title: data.title ?? DEFAULTS.title,
          description: data.description ?? DEFAULTS.description,
          submitLabel: data.submitLabel ?? DEFAULTS.submitLabel,
          successMessage: data.successMessage ?? DEFAULTS.successMessage,
          recipientEmail: data.recipientEmail ?? '',
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const setField =
    (key: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) return alert('Failed to save Contact settings.');
      alert('Contact settings saved!');
    } catch {
      alert('Network error saving Contact settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h2>Contact Page</h2>
      <p>Manage the Contact page heading, description, and submit/success text.</p>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', maxWidth: 900 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Title
          <input value={form.title} onChange={setField('title')} placeholder="Contact Us" />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Submit Button Label
          <input
            value={form.submitLabel}
            onChange={setField('submitLabel')}
            placeholder="Send Message"
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

        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Success Message
          <input
            value={form.successMessage}
            onChange={setField('successMessage')}
            placeholder="Message sent! We’ll get back to you soon."
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          Recipient Email (optional)
          <input
            type="email"
            value={form.recipientEmail}
            onChange={setField('recipientEmail')}
            placeholder="inbox@example.com"
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
