'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ContactSettings.module.scss';

type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'soundcloud';

type SocialLink = { platform: SocialPlatform; url: string };

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxgroup'
  | 'radio'
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

type ContactConfig = {
  // section
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;

  // public details (shown on site as icons)
  contactEmail: string; // empty string => hide email icon
  contactPhone?: string | null;

  // delivery (where contact form submits to)
  recipientEmail?: string | null;

  // modal
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;

  // socials + fields
  socialLinks: SocialLink[];
  fields: FormField[];
};

const FALLBACK: ContactConfig = {
  eyebrow: "LET'S CONNECT",
  title: 'Get in touch',
  lead: 'General enquiries',
  buttonLabel: 'Open contact form',

  contactEmail: '',
  contactPhone: null,

  recipientEmail: null,

  modalKicker: 'Contact',
  modalTitle: 'Send us a message.',
  modalLead: 'We’ll get back to you shortly.',
  submitLabel: 'Send message',
  successMessage: 'Thanks — we’ll be in touch soon.',

  socialLinks: [],
  fields: [],
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date + time' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'radio', label: 'Radio buttons' },
  { value: 'checkbox', label: 'Checkbox (single)' },
  { value: 'checkboxgroup', label: 'Checkbox group' },
  { value: 'file', label: 'File upload' },
];

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'soundcloud', label: 'SoundCloud' },
];

const makeId = () => `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const makeSocialId = () =>
  `soc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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
      errs.push('Field name must be letters/numbers/underscore only (e.g. venue_city).');
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

export default function ContactSettings() {
  const [config, setConfig] = useState<ContactConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options drafts for textarea “one-per-line” editing
  const [optionsDrafts, setOptionsDrafts] = useState<Record<string, string>>({});

  // Social rows with stable keys (so adding/removing doesn’t glitch)
  const [socialRows, setSocialRows] = useState<Array<SocialLink & { _id: string }>>([]);

  const seedDrafts = (fields: FormField[]) => {
    const seed: Record<string, string> = {};
    for (const f of fields) {
      if (isOptionsType(f.type)) seed[f.id] = (f.options ?? []).join('\n');
    }
    setOptionsDrafts(seed);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as Partial<ContactConfig>;
        const merged: ContactConfig = {
          ...FALLBACK,
          ...data,
          contactEmail: (data.contactEmail ?? FALLBACK.contactEmail) || '',
          contactPhone: data.contactPhone ?? null,
          recipientEmail: data.recipientEmail ?? null,
          socialLinks: data.socialLinks ?? [],
          fields: data.fields ?? [],
        };

        setConfig(merged);
        seedDrafts(merged.fields);

        // seed socials with stable ids
        const seededSocials = (merged.socialLinks ?? []).map((s) => ({
          ...s,
          _id: makeSocialId(),
        }));
        setSocialRows(seededSocials);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // keep config.socialLinks in sync with socialRows
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: socialRows.map(({ platform, url }) => ({ platform, url })),
    }));
  }, [socialRows]);

  const setText =
    (key: keyof ContactConfig) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const clearText = (key: keyof ContactConfig) => {
    setConfig((prev) => ({ ...prev, [key]: '' as never }));
  };

  const clearNullable = (key: keyof ContactConfig) => {
    setConfig((prev) => ({ ...prev, [key]: null as never }));
  };

  // ---------- Socials ----------
  const addSocial = () => {
    setSocialRows((prev) => [...prev, { _id: makeSocialId(), platform: 'instagram', url: '' }]);
  };

  const removeSocial = (id: string) => {
    setSocialRows((prev) => prev.filter((s) => s._id !== id));
  };

  const updateSocial = (id: string, patch: Partial<SocialLink>) => {
    setSocialRows((prev) => prev.map((s) => (s._id === id ? { ...s, ...patch } : s)));
  };

  const clearSocialUrl = (id: string) => updateSocial(id, { url: '' });

  // ---------- Fields ----------
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

      // If switching away from options-type, drop options + draft
      if (patch.type && !isOptionsType(patch.type) && isOptionsType(existing.type)) {
        setOptionsDrafts((d) => {
          const copy = { ...d };
          delete copy[existing.id];
          return copy;
        });
        next[idx] = { ...existing, ...patch, options: undefined };
        return { ...prev, fields: next };
      }

      // Number cleanup
      if (patch.type && patch.type !== 'number' && existing.type === 'number') {
        next[idx] = { ...existing, ...patch, min: undefined, max: undefined, step: undefined };
        return { ...prev, fields: next };
      }

      // File cleanup
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

  const validateAll = () => {
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
        // trim strings a bit
        eyebrow: config.eyebrow?.trim?.() || '',
        title: config.title?.trim?.() || '',
        lead: config.lead?.trim?.() || '',
        buttonLabel: config.buttonLabel?.trim?.() || '',
        contactEmail: (config.contactEmail ?? '').trim(), // empty => hide icon
        contactPhone: (config.contactPhone ?? '').trim()
          ? (config.contactPhone ?? '').trim()
          : null,
        recipientEmail: (config.recipientEmail ?? '').trim()
          ? (config.recipientEmail ?? '').trim()
          : null,
        modalKicker: config.modalKicker?.trim?.() || '',
        modalTitle: config.modalTitle?.trim?.() || '',
        modalLead: config.modalLead?.trim?.() || '',
        submitLabel: config.submitLabel?.trim?.() || '',
        successMessage: config.successMessage?.trim?.() || '',
        socialLinks: (config.socialLinks ?? []).filter((s) => s.platform && s.url?.trim()),
        fields: config.fields ?? [],
      };

      const res = await fetch('/api/home/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('Save /api/home/contact failed:', res.status, txt);
        throw new Error('Failed to save Contact settings');
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
      <p>Control the contact section + contact modal settings, icons, and fields.</p>

      <div className={styles.form}>
        {/* ===== Section copy ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Section copy</legend>

          <div className={styles.fieldGrid}>
            <div className={styles.inputWrap}>
              <label>Eyebrow</label>
              <div className={styles.row}>
                <input value={config.eyebrow} onChange={setText('eyebrow')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('eyebrow')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.inputWrap}>
              <label>Button label</label>
              <div className={styles.row}>
                <input value={config.buttonLabel} onChange={setText('buttonLabel')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('buttonLabel')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Title</label>
              <div className={styles.row}>
                <input value={config.title} onChange={setText('title')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('title')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Lead</label>
              <div className={styles.row}>
                <textarea rows={3} value={config.lead} onChange={setText('lead')} />
                <button type="button" className={styles.clearBtn} onClick={() => clearText('lead')}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </fieldset>

        {/* ===== Public icons (email/phone) ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Public icons (shown on site)</legend>

          <div className={styles.fieldGrid}>
            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Public email (shows email icon when filled)</label>
              <div className={styles.row}>
                <input
                  value={config.contactEmail ?? ''}
                  onChange={setText('contactEmail')}
                  placeholder="info@Essentia.com"
                />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('contactEmail')}
                >
                  Clear
                </button>
              </div>
              <small>
                Leave blank to hide the email icon. When filled, the site shows the email icon only
                (no email text).
              </small>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Public phone (shows phone icon when filled)</label>
              <div className={styles.row}>
                <input
                  value={config.contactPhone ?? ''}
                  onChange={(e) => setConfig((p) => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="+44..."
                />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearNullable('contactPhone')}
                >
                  Clear
                </button>
              </div>
              <small>Leave blank to hide the phone icon.</small>
            </div>
          </div>
        </fieldset>

        {/* ===== Delivery ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Delivery (where contact form emails go)</legend>

          <div className={styles.fieldGrid}>
            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Recipient email (optional)</label>
              <div className={styles.row}>
                <input
                  value={config.recipientEmail ?? ''}
                  onChange={(e) => setConfig((p) => ({ ...p, recipientEmail: e.target.value }))}
                  placeholder="bookings@Essentia.com"
                />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearNullable('recipientEmail')}
                >
                  Clear
                </button>
              </div>
              <small>
                If blank, your contact email route will fall back to INTERNAL_EMAIL / contactEmail.
              </small>
            </div>
          </div>
        </fieldset>

        {/* ===== Modal copy ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Modal copy</legend>

          <div className={styles.fieldGrid}>
            <div className={styles.inputWrap}>
              <label>Modal kicker</label>
              <div className={styles.row}>
                <input value={config.modalKicker} onChange={setText('modalKicker')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('modalKicker')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.inputWrap}>
              <label>Submit button label</label>
              <div className={styles.row}>
                <input value={config.submitLabel} onChange={setText('submitLabel')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('submitLabel')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Modal title</label>
              <div className={styles.row}>
                <input value={config.modalTitle} onChange={setText('modalTitle')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('modalTitle')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Modal lead</label>
              <div className={styles.row}>
                <textarea rows={3} value={config.modalLead} onChange={setText('modalLead')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('modalLead')}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={`${styles.inputWrap} ${styles.full}`}>
              <label>Success message</label>
              <div className={styles.row}>
                <input value={config.successMessage} onChange={setText('successMessage')} />
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearText('successMessage')}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </fieldset>

        {/* ===== Social icons ===== */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Social icons</legend>

          <div className={styles.socialList}>
            {socialRows.map((s) => (
              <div key={s._id} className={styles.socialRow}>
                <div className={styles.socialGrid}>
                  <div className={styles.inputWrap}>
                    <label>Platform</label>
                    <select
                      value={s.platform}
                      onChange={(e) =>
                        updateSocial(s._id, { platform: e.target.value as SocialPlatform })
                      }
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.inputWrap} ${styles.full}`}>
                    <label>URL</label>
                    <div className={styles.row}>
                      <input
                        value={s.url}
                        onChange={(e) => updateSocial(s._id, { url: e.target.value })}
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => clearSocialUrl(s._id)}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeSocial(s._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className={styles.socialActions}>
              <button type="button" className={styles.addBtn} onClick={addSocial}>
                + Add social
              </button>

              {socialRows.length > 0 && (
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={() => setSocialRows([])}
                >
                  Clear all socials
                </button>
              )}
            </div>
          </div>
        </fieldset>

        {/* ===== Fields ===== */}
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
                  <div className={styles.inputWrap}>
                    <label>Label</label>
                    <div className={styles.row}>
                      <input
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => updateField(idx, { label: '' })}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputWrap}>
                    <label>Field name (key)</label>
                    <div className={styles.row}>
                      <input
                        value={field.name}
                        onChange={(e) => updateField(idx, { name: e.target.value })}
                        placeholder="name, email, message, etc."
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => updateField(idx, { name: '' })}
                      >
                        Clear
                      </button>
                    </div>
                    <small>
                      Use letters/numbers/underscore only (e.g. <code>event_date</code>).
                    </small>
                  </div>

                  <div className={styles.inputWrap}>
                    <label>Type</label>
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
                  </div>

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
                  <div className={`${styles.inputWrap} ${styles.full}`}>
                    <label>Placeholder (optional)</label>
                    <div className={styles.row}>
                      <input
                        value={field.placeholder ?? ''}
                        onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => updateField(idx, { placeholder: '' })}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className={`${styles.inputWrap} ${styles.full}`}>
                    <label>Help text (optional)</label>
                    <div className={styles.row}>
                      <input
                        value={field.helpText ?? ''}
                        onChange={(e) => updateField(idx, { helpText: e.target.value })}
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => updateField(idx, { helpText: '' })}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {isOptionsType(field.type) && (
                  <div className={styles.fieldGrid}>
                    <div className={`${styles.inputWrap} ${styles.full}`}>
                      <label>Options (one per line)</label>
                      <div className={styles.row}>
                        <textarea
                          rows={4}
                          value={optionsStr}
                          onChange={(e) => setOptionsDraft(field.id, e.target.value)}
                          onBlur={() => commitOptions(idx)}
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => {
                            setOptionsDraft(field.id, '');
                            updateField(idx, { options: [] });
                          }}
                        >
                          Clear
                        </button>
                      </div>
                      <small>Blank lines are ignored when you leave the box.</small>
                    </div>
                  </div>
                )}

                {field.type === 'number' && (
                  <div className={styles.fieldGrid}>
                    <div className={styles.inputWrap}>
                      <label>Min</label>
                      <div className={styles.row}>
                        <input
                          type="number"
                          value={field.min ?? ''}
                          onChange={(e) =>
                            updateField(idx, {
                              min: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => updateField(idx, { min: undefined })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputWrap}>
                      <label>Max</label>
                      <div className={styles.row}>
                        <input
                          type="number"
                          value={field.max ?? ''}
                          onChange={(e) =>
                            updateField(idx, {
                              max: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => updateField(idx, { max: undefined })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputWrap}>
                      <label>Step</label>
                      <div className={styles.row}>
                        <input
                          type="number"
                          value={field.step ?? ''}
                          onChange={(e) =>
                            updateField(idx, {
                              step: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => updateField(idx, { step: undefined })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {field.type === 'file' && (
                  <div className={styles.fieldGrid}>
                    <div className={`${styles.inputWrap} ${styles.full}`}>
                      <label>Accept (optional)</label>
                      <div className={styles.row}>
                        <input
                          value={field.accept ?? ''}
                          onChange={(e) => updateField(idx, { accept: e.target.value })}
                          placeholder="audio/*,image/*,.pdf"
                        />
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={() => updateField(idx, { accept: '' })}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

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
                  <div className={`${styles.inputWrap} ${styles.full}`}>
                    <label>
                      Show only if (optional) — format: <code>field=value</code>
                    </label>
                    <div className={styles.row}>
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
                        placeholder="enq_type=Booking"
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => updateField(idx, { showIf: undefined })}
                      >
                        Clear
                      </button>
                    </div>
                    <small>Example: enq_type=Booking</small>
                  </div>
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

          {config.fields.length > 0 && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={() => {
                setConfig((p) => ({ ...p, fields: [] }));
                setOptionsDrafts({});
              }}
            >
              Clear all fields
            </button>
          )}
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
