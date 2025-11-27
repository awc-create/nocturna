// src/components/admin/home/EnquireSettings.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './EnquireSettings.module.scss';

type FieldType = 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'url' | 'select' | 'multiselect';

type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
};

type EnquireConfig = {
  title: string;
  intro: string;
  submitLabel: string;
  successMessage: string;
  fields: FormField[];
};

const FALLBACK: EnquireConfig = {
  title: 'Enquire about DJs and live music.',
  intro:
    'Tell us about your venue or event – we’ll match you with the right artists and schedules.',
  submitLabel: 'Send enquiry',
  successMessage: 'Thanks – we’ll be in touch shortly.',
  fields: [],
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-select' },
];

const makeId = () => `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export default function EnquireSettings() {
  const [config, setConfig] = useState<EnquireConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load config
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/enquire', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<EnquireConfig>;
          setConfig({
            ...FALLBACK,
            ...data,
            fields: data.fields ?? [],
          });
        }
      } catch {
        // swallow, fallback stays
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField = (idx: number, patch: Partial<FormField>) => {
    setConfig((prev) => {
      const next = [...prev.fields];
      const existing = next[idx];
      if (!existing) return prev;
      next[idx] = { ...existing, ...patch };
      return { ...prev, fields: next };
    });
  };

  const addField = () => {
    setConfig((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: makeId(),
          name: '',
          label: 'New field',
          type: 'text',
          required: false,
          placeholder: '',
          helpText: '',
        },
      ],
    }));
  };

  const removeField = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  };

  const moveField = (from: number, to: number) => {
    setConfig((prev) => {
      if (to < 0 || to >= prev.fields.length) return prev;
      const next = [...prev.fields];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...prev, fields: next };
    });
  };

  const onConfigText =
    (key: keyof EnquireConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setConfig((prev) => ({ ...prev, [key]: v }));
    };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Save /api/home/enquire failed:', res.status, text);
        throw new Error('Failed to save');
      }
      alert('Enquiry form updated. Refresh the site to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving Enquire.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>Enquire</h2>
        <p>Loading enquiry form settings…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Enquire</h2>
      <p>Control the enquiry lightbox fields and copy.</p>

      <div className={styles.form}>
        <label className={styles.full}>
          Title
          <input
            value={config.title}
            onChange={onConfigText('title')}
            placeholder="Enquire about DJs and live music."
          />
        </label>

        <label className={styles.full}>
          Intro text
          <textarea rows={3} value={config.intro} onChange={onConfigText('intro')} />
        </label>

        <label>
          Submit button label
          <input value={config.submitLabel} onChange={onConfigText('submitLabel')} />
        </label>

        <label>
          Success message
          <input value={config.successMessage} onChange={onConfigText('successMessage')} />
        </label>

        {/* Dynamic fields builder */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Form fields</legend>

          {config.fields.map((field, idx) => {
            const optionsStr = (field.options ?? []).join('\n');
            return (
              <div key={field.id ?? idx} className={styles.fieldRow}>
                <div className={styles.fieldHeader}>
                  <span className={styles.fieldIndex}>#{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => moveField(idx, idx - 1)}
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(idx, idx + 1)}
                    disabled={idx === config.fields.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeField(idx)}
                  >
                    Remove
                  </button>
                </div>

                <div className={styles.fieldGrid}>
                  <label>
                    Label
                    <input
                      value={field.label}
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                    />
                  </label>
                  <label>
                    Field name (key)
                    <input
                      value={field.name}
                      onChange={(e) => updateField(idx, { name: e.target.value })}
                      placeholder="venue_name, budget, etc."
                    />
                  </label>
                  <label>
                    Type
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(idx, {
                          type: e.target.value as FieldType,
                        })
                      }
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                    />
                    <span>Required</span>
                  </label>
                </div>

                <div className={styles.fieldGrid}>
                  <label className={styles.full}>
                    Placeholder (optional)
                    <input
                      value={field.placeholder ?? ''}
                      onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                    />
                  </label>
                  <label className={styles.full}>
                    Help text (optional)
                    <input
                      value={field.helpText ?? ''}
                      onChange={(e) => updateField(idx, { helpText: e.target.value })}
                    />
                  </label>
                </div>

                {(field.type === 'select' || field.type === 'multiselect') && (
                  <div className={styles.fieldGrid}>
                    <label className={styles.full}>
                      Options (one per line)
                      <textarea
                        rows={3}
                        value={optionsStr}
                        onChange={(e) => {
                          const lines = e.target.value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          updateField(idx, { options: lines });
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}

          <button type="button" className={styles.addBtn} onClick={addField}>
            + Add field
          </button>
        </fieldset>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
