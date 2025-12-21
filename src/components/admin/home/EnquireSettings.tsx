// src/components/admin/home/EnquireSettings.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
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

const isSelectType = (t: FieldType) => t === 'select' || t === 'multiselect';

// Only allow safe keys that work well as JSON keys + HTML field names
const normalizeKey = (raw: string) => raw.trim();
const isValidKey = (key: string) => /^[a-z][a-z0-9_]*$/i.test(key);

function fieldErrors(field: FormField, allFields: FormField[]) {
  const errs: string[] = [];

  const label = (field.label ?? '').trim();
  const name = normalizeKey(field.name ?? '');

  if (!label) errs.push('Label is required.');

  if (!name) {
    errs.push('Field name (key) is required.');
  } else {
    if (!isValidKey(name)) {
      errs.push('Field name must be letters/numbers/underscore only (e.g. venue_name).');
    }
    const duplicates = allFields.filter((f) => normalizeKey(f.name) === name);
    if (duplicates.length > 1) {
      errs.push('Field name (key) must be unique (duplicate found).');
    }
  }

  // Type-specific rules
  if (isSelectType(field.type)) {
    const opts = (field.options ?? []).map((s) => s.trim()).filter(Boolean);
    if (opts.length < 1) errs.push('Select fields need at least 1 option.');
  }

  return errs;
}

export default function EnquireSettings() {
  const [config, setConfig] = useState<EnquireConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * ✅ Draft store per field for "options" textarea
   * This is the key fix that makes Enter/newlines work.
   */
  const [optionsDrafts, setOptionsDrafts] = useState<Record<string, string>>({});

  const getOptionsDraft = (fieldId: string, options?: string[]) => {
    const existing = optionsDrafts[fieldId];
    if (typeof existing === 'string') return existing;
    return (options ?? []).join('\n');
  };

  const setOptionsDraft = (fieldId: string, val: string) => {
    setOptionsDrafts((prev) => ({ ...prev, [fieldId]: val }));
  };

  const commitOptions = (idx: number) => {
    const field = config.fields[idx];
    if (!field) return;

    const raw = optionsDrafts[field.id] ?? (field.options ?? []).join('\n');
    const lines = raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateField(idx, { options: lines });
  };

  // load config
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/enquire', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<EnquireConfig>;
          const merged: EnquireConfig = {
            ...FALLBACK,
            ...data,
            fields: data.fields ?? [],
          };
          setConfig(merged);

          // seed drafts once from loaded data
          const seed: Record<string, string> = {};
          for (const f of merged.fields) {
            if (isSelectType(f.type)) seed[f.id] = (f.options ?? []).join('\n');
          }
          setOptionsDrafts(seed);
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

      // If switching type away from select types, clean options + draft
      if (patch.type && !isSelectType(patch.type) && isSelectType(existing.type)) {
        setOptionsDrafts((d) => {
          const copy = { ...d };
          delete copy[existing.id];
          return copy;
        });
        next[idx] = { ...existing, ...patch, options: undefined };
        return { ...prev, fields: next };
      }

      next[idx] = { ...existing, ...patch };
      return { ...prev, fields: next };
    });
  };

  const addField = () => {
    const id = makeId();
    setConfig((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id,
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
    setConfig((prev) => {
      const target = prev.fields[idx];
      if (target) {
        setOptionsDrafts((d) => {
          const copy = { ...d };
          delete copy[target.id];
          return copy;
        });
      }
      return { ...prev, fields: prev.fields.filter((_, i) => i !== idx) };
    });
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

  // Save-time validation (and also commit any open drafts)
  const validateAll = () => {
    // Commit drafts for all select/multiselect fields before validation
    config.fields.forEach((f, idx) => {
      if (isSelectType(f.type)) commitOptions(idx);
    });

    const problems: { idx: number; id: string; errors: string[] }[] = [];
    config.fields.forEach((f, idx) => {
      const errs = fieldErrors(f, config.fields);
      if (errs.length) problems.push({ idx, id: f.id, errors: errs });
    });
    return problems;
  };

  const save = async () => {
    setSaving(true);
    try {
      const problems = validateAll();
      if (problems.length) {
        const msg =
          'Fix these before saving:\n\n' +
          problems.map((p) => `Field #${p.idx + 1}: ${p.errors.join(' ')}`).join('\n');
        alert(msg);
        return;
      }

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

  const liveErrors = useMemo(() => {
    const map: Record<string, string[]> = {};
    config.fields.forEach((f) => {
      map[f.id] = fieldErrors(f, config.fields);
    });
    return map;
  }, [config.fields]);

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

        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Form fields</legend>

          {config.fields.map((field, idx) => {
            const optionsStr = getOptionsDraft(field.id, field.options);
            const errs = liveErrors[field.id] ?? [];

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
                    <small>
                      Use letters/numbers/underscore only (e.g. <code>venue_name</code>).
                    </small>
                  </label>

                  <label>
                    Type
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
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
                        rows={4}
                        value={optionsStr}
                        onChange={(e) => setOptionsDraft(field.id, e.target.value)}
                        onBlur={() => commitOptions(idx)}
                        onKeyDown={(e) => {
                          // ✅ Allow Enter newlines but stop parent handlers stealing the event
                          if (e.key === 'Enter') e.stopPropagation();
                        }}
                      />
                      <small>
                        Enter adds a new option line. Blank lines are ignored when you leave the
                        box.
                      </small>
                    </label>
                  </div>
                )}

                {errs.length > 0 && (
                  <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                    {errs.map((m, i) => (
                      <div key={i}>• {m}</div>
                    ))}
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
