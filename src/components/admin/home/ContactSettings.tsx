// src/components/admin/home/ContactSettings.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ContactSettings.module.scss';

/* =========================
   Types (match API)
   ========================= */

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'date'
  | 'time'
  | 'datetime'
  | 'url'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'checkboxgroup'
  | 'file';

type ShowIf = { field: string; equals: string };

type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;

  placeholder?: string;
  helpText?: string;

  options?: string[];

  min?: number;
  max?: number;
  step?: number;

  accept?: string;
  multipleFiles?: boolean;

  showIf?: ShowIf;
};

type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'soundcloud';

type SocialLink = {
  platform: SocialPlatform;
  url: string;
};

type ContactConfig = {
  // section
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;

  // public details (shown on site)
  contactEmail: string;
  contactPhone?: string | null;
  socialLinks: SocialLink[];

  // modal
  modalKicker: string;
  modalTitle: string;
  modalLead: string;

  submitLabel: string;
  successMessage: string;

  // delivery (submissions destination)
  recipientEmail?: string | null;

  // form fields
  fields: FormField[];
};

/* =========================
   Defaults
   ========================= */

const FALLBACK: ContactConfig = {
  eyebrow: 'Contact',
  title: 'Send us a message.',
  lead: 'We’ll get back to you shortly.',
  buttonLabel: 'Open contact form',

  contactEmail: 'info@nocturna.com',
  contactPhone: null,
  socialLinks: [
    { platform: 'instagram', url: 'https://www.instagram.com/nocturna_artist_agency' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@nocturna_artist_agency' },
  ],

  modalKicker: 'Contact',
  modalTitle: 'Send us a message.',
  modalLead: 'We’ll get back to you shortly.',

  submitLabel: 'Send Message',
  successMessage: 'Thanks — we’ll be in touch soon.',

  recipientEmail: null,
  fields: [],
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date + time' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkbox (single)' },
  { value: 'checkboxgroup', label: 'Checkbox group' },
  { value: 'file', label: 'File upload' },
];

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'soundcloud', label: 'SoundCloud' },
];

const makeId = () => `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const makeSocialId = () =>
  `soc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

type SocialRow = SocialLink & { _id: string };

function withSocialIds(list: SocialLink[]): SocialRow[] {
  return list.map((s) => ({ ...s, _id: makeSocialId() }));
}

const isOptionsType = (t: FieldType) =>
  t === 'select' || t === 'multiselect' || t === 'radio' || t === 'checkboxgroup';

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
      errs.push('Field name must be letters/numbers/underscore only (e.g. order_id).');
    }
    const duplicates = allFields.filter((f) => normalizeKey(f.name) === name);
    if (duplicates.length > 1) errs.push('Field name (key) must be unique (duplicate found).');
  }

  if (isOptionsType(field.type)) {
    const opts = (field.options ?? []).map((s) => s.trim()).filter(Boolean);
    if (opts.length < 1) errs.push('This field type needs at least 1 option.');
  }

  if (field.type === 'number') {
    if (typeof field.min === 'number' && typeof field.max === 'number' && field.min > field.max) {
      errs.push('Min cannot be greater than Max.');
    }
  }

  return errs;
}

/* =========================
   Component
   ========================= */

export default function ContactSettings() {
  const [config, setConfig] = useState<ContactConfig>(FALLBACK);
  const [socialRows, setSocialRows] = useState<SocialRow[]>(withSocialIds(FALLBACK.socialLinks));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [optionsDrafts, setOptionsDrafts] = useState<Record<string, string>>({});

  const getOptionsDraft = (fieldId: string, options?: string[]) => {
    const existing = optionsDrafts[fieldId];
    if (typeof existing === 'string') return existing;
    return (options ?? []).join('\n');
  };

  const setOptionsDraft = (fieldId: string, val: string) => {
    setOptionsDrafts((prev) => ({ ...prev, [fieldId]: val }));
  };

  const updateField = (idx: number, patch: Partial<FormField>) => {
    setConfig((prev) => {
      const next = [...prev.fields];
      const existing = next[idx];
      if (!existing) return prev;

      // switching away from options type -> wipe options + draft
      if (patch.type && !isOptionsType(patch.type) && isOptionsType(existing.type)) {
        setOptionsDrafts((d) => {
          const copy = { ...d };
          delete copy[existing.id];
          return copy;
        });
        next[idx] = { ...existing, ...patch, options: undefined };
        return { ...prev, fields: next };
      }

      // switching away from number -> wipe min/max/step
      if (patch.type && patch.type !== 'number' && existing.type === 'number') {
        next[idx] = { ...existing, ...patch, min: undefined, max: undefined, step: undefined };
        return { ...prev, fields: next };
      }

      // switching away from file -> wipe accept/multipleFiles
      if (patch.type && patch.type !== 'file' && existing.type === 'file') {
        next[idx] = { ...existing, ...patch, accept: undefined, multipleFiles: undefined };
        return { ...prev, fields: next };
      }

      next[idx] = { ...existing, ...patch };
      return { ...prev, fields: next };
    });
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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<ContactConfig>;
          const merged: ContactConfig = {
            ...FALLBACK,
            ...data,
            socialLinks: data.socialLinks ?? FALLBACK.socialLinks,
            fields: data.fields ?? [],
          };

          setConfig(merged);
          setSocialRows(withSocialIds(merged.socialLinks));

          const seed: Record<string, string> = {};
          for (const f of merged.fields) {
            if (isOptionsType(f.type)) seed[f.id] = (f.options ?? []).join('\n');
          }
          setOptionsDrafts(seed);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const onText =
    (key: keyof ContactConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const validateAll = () => {
    // commit options before validation/save
    config.fields.forEach((f, idx) => {
      if (isOptionsType(f.type)) commitOptions(idx);
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
        alert(
          'Fix these before saving:\n\n' +
            problems.map((p) => `Field #${p.idx + 1}: ${p.errors.join(' ')}`).join('\n')
        );
        return;
      }

      const payload: ContactConfig = {
        ...config,
        socialLinks: socialRows
          .map((row) => {
            const { platform, url } = row; // pick only what you want
            return { platform, url: url.trim() };
          })
          .filter((s) => s.url.length > 0),
      };

      const res = await fetch('/api/home/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('Save /api/home/contact failed:', res.status, txt);
        throw new Error('Failed to save');
      }

      alert('Contact settings updated. Refresh the site to see changes.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Network error saving Contact.');
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
        <h2>Contact</h2>
        <p>Loading contact settings…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Contact</h2>
      <p>Control the contact section + modal content, public details, social icons, and fields.</p>

      <div className={styles.form}>
        {/* ===== Section copy ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Section copy</legend>

          <div className={styles.fieldGrid}>
            <label>
              Eyebrow
              <input value={config.eyebrow} onChange={onText('eyebrow')} />
            </label>

            <label>
              Button label
              <input value={config.buttonLabel} onChange={onText('buttonLabel')} />
            </label>

            <label className={styles.full}>
              Title
              <input value={config.title} onChange={onText('title')} />
            </label>

            <label className={styles.full}>
              Lead
              <textarea rows={3} value={config.lead} onChange={onText('lead')} />
            </label>
          </div>
        </fieldset>

        {/* ===== Public contact details ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Public contact details</legend>

          <div className={styles.fieldGrid}>
            <label>
              Email (shown on site)
              <input
                value={config.contactEmail ?? ''}
                onChange={onText('contactEmail')}
                placeholder="hello@nocturnaagency.com"
              />
            </label>

            <label>
              Phone number (shown on site)
              <input
                value={config.contactPhone ?? ''}
                onChange={onText('contactPhone')}
                placeholder="+44 7xxx xxx xxx"
              />
            </label>
          </div>
        </fieldset>

        {/* ===== Social links (array) ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Social links</legend>

          {socialRows.length ? (
            <div className={styles.socialList}>
              {socialRows.map((s, idx) => (
                <div key={s._id} className={styles.socialRow}>
                  <label>
                    Platform
                    <select
                      value={s.platform}
                      onChange={(e) => {
                        const platform = e.target.value as SocialPlatform;
                        setSocialRows((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], platform };
                          return next;
                        });
                      }}
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.socialUrl}>
                    URL
                    <input
                      value={s.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setSocialRows((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], url };
                          return next;
                        });
                      }}
                      placeholder="https://..."
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => setSocialRows((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>No social links yet.</p>
          )}

          <div className={styles.socialActions}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() =>
                setSocialRows((prev) => [
                  ...prev,
                  { _id: makeSocialId(), platform: 'instagram', url: '' },
                ])
              }
            >
              + Add social link
            </button>
          </div>

          <p className={styles.muted}>These render as icons on the site automatically.</p>
        </fieldset>

        {/* ===== Modal copy + delivery ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Modal copy + delivery</legend>

          <div className={styles.fieldGrid}>
            <label>
              Modal kicker
              <input value={config.modalKicker} onChange={onText('modalKicker')} />
            </label>

            <label>
              Recipient email (submissions go here)
              <input
                value={config.recipientEmail ?? ''}
                onChange={onText('recipientEmail')}
                placeholder="bookings@nocturnaagency.com"
              />
            </label>

            <label className={styles.full}>
              Modal title
              <input value={config.modalTitle} onChange={onText('modalTitle')} />
            </label>

            <label className={styles.full}>
              Modal lead
              <textarea rows={3} value={config.modalLead} onChange={onText('modalLead')} />
            </label>

            <label>
              Submit label
              <input value={config.submitLabel} onChange={onText('submitLabel')} />
            </label>

            <label>
              Success message
              <input value={config.successMessage} onChange={onText('successMessage')} />
            </label>
          </div>
        </fieldset>

        {/* ===== Form fields ===== */}
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
                      placeholder="order_id, message, etc."
                    />
                    <small>
                      Use letters/numbers/underscore only (e.g. <code>order_id</code>).
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

                {isOptionsType(field.type) && (
                  <div className={styles.fieldGrid}>
                    <label className={styles.full}>
                      Options (one per line)
                      <textarea
                        rows={4}
                        value={optionsStr}
                        onChange={(e) => setOptionsDraft(field.id, e.target.value)}
                        onBlur={() => commitOptions(idx)}
                      />
                      <small>Blank lines are ignored when you leave the box.</small>
                    </label>
                  </div>
                )}

                {field.type === 'number' && (
                  <div className={styles.fieldGrid}>
                    <label>
                      Min
                      <input
                        type="number"
                        value={field.min ?? ''}
                        onChange={(e) =>
                          updateField(idx, {
                            min: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </label>

                    <label>
                      Max
                      <input
                        type="number"
                        value={field.max ?? ''}
                        onChange={(e) =>
                          updateField(idx, {
                            max: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </label>

                    <label>
                      Step
                      <input
                        type="number"
                        value={field.step ?? ''}
                        onChange={(e) =>
                          updateField(idx, {
                            step: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                )}

                {field.type === 'file' && (
                  <div className={styles.fieldGrid}>
                    <label className={styles.full}>
                      Accept (optional)
                      <input
                        value={field.accept ?? ''}
                        onChange={(e) => updateField(idx, { accept: e.target.value })}
                        placeholder="image/*,.pdf"
                      />
                    </label>

                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(field.multipleFiles)}
                        onChange={(e) => updateField(idx, { multipleFiles: e.target.checked })}
                      />
                      <span>Allow multiple files</span>
                    </label>
                  </div>
                )}

                <div className={styles.fieldGrid}>
                  <label className={styles.full}>
                    Show only if (optional) — format: <code>field=value</code>
                    <input
                      value={
                        field.showIf?.field && field.showIf?.equals
                          ? `${field.showIf.field}=${field.showIf.equals}`
                          : ''
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) return updateField(idx, { showIf: undefined });
                        const [f, ...rest] = raw.split('=');
                        const eq = rest.join('=');
                        const fieldKey = (f ?? '').trim();
                        const equals = (eq ?? '').trim();
                        if (!fieldKey || !equals) return updateField(idx, { showIf: undefined });
                        updateField(idx, { showIf: { field: fieldKey, equals } });
                      }}
                      placeholder="preferred_contact=Phone"
                    />
                    <small>
                      Example: preferred_contact=Phone (field appears only when Phone is chosen).
                    </small>
                  </label>
                </div>

                {errs.length > 0 && (
                  <div className={styles.errors}>
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
