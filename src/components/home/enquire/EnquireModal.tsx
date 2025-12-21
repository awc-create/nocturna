'use client';

import { useEffect, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './EnquireModal.module.scss';

const GOOGLE_BOOKING_URL = process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL || '';

type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'url';

type FormField = {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

type ApiConfig = {
  title: string;
  intro: string;
  submitLabel: string;
  successMessage: string;
  fields: FormField[];
};

type EnquireConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: EnquireConfig = {
  modalKicker: 'Enquire Now',
  modalTitle: 'Tell us about your venue or event.',
  modalLead:
    'Share a few details about your space, schedule and music brief — we’ll match you with the right artists.',
  submitLabel: 'Send enquiry',
  successMessage: 'Thanks — we’ll be in touch shortly.',
  formFields: [
    {
      id: 'name',
      label: 'Full name *',
      name: 'name',
      type: 'text',
      required: true,
      placeholder: 'Your full name',
    },
    {
      id: 'email',
      label: 'Email address *',
      name: 'email',
      type: 'email',
      required: true,
      placeholder: 'you@example.com',
    },
    {
      id: 'phone',
      label: 'Mobile number *',
      name: 'phone',
      type: 'tel',
      required: true,
      placeholder: '+44…',
    },
    {
      id: 'message',
      label: 'Message *',
      name: 'message',
      type: 'textarea',
      required: true,
      placeholder: 'Venue name, location, preferred days, music style, budget, tech notes…',
    },
  ],
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function ensureId(item: Record<string, unknown>, idx: number, prefix: string) {
  const id = safeString(item.id).trim();
  const name = safeString(item.name).trim();
  if (id) return id;
  if (name) return name;
  return `${prefix}_${idx}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return [];

  const allowed: readonly FormFieldType[] = [
    'text',
    'textarea',
    'email',
    'tel',
    'date',
    'url',
    'select',
    'multiselect',
  ] as const;

  const out: Array<FormField | null> = raw.map((item, idx) => {
    if (!isRecord(item)) return null;

    const typeRaw = safeString(item.type).trim() as FormFieldType;
    const type: FormFieldType = allowed.includes(typeRaw) ? typeRaw : 'text';

    const name = safeString(item.name).trim();
    const label = safeString(item.label).trim();
    if (!name || !label) return null;

    const placeholder = safeString(item.placeholder).trim();

    const options =
      Array.isArray(item.options) && (type === 'select' || type === 'multiselect')
        ? item.options.map((x) => safeString(x).trim()).filter(Boolean)
        : undefined;

    const field: FormField = {
      id: ensureId(item, idx, 'enq'),
      name,
      label,
      type,
      required: Boolean(item.required),
      ...(placeholder ? { placeholder } : {}),
      ...(options && options.length ? { options } : {}),
    };

    return field;
  });

  return out.filter((x): x is FormField => x !== null);
}

function mapApiToModal(api: Partial<ApiConfig>): EnquireConfig {
  const fields = normalizeFields(api.fields);
  return {
    ...FALLBACK,
    modalTitle: safeString(api.title).trim() || FALLBACK.modalTitle,
    modalLead: safeString(api.intro).trim() || FALLBACK.modalLead,
    submitLabel: safeString(api.submitLabel).trim() || FALLBACK.submitLabel,
    successMessage: safeString(api.successMessage).trim() || FALLBACK.successMessage,
    formFields: fields.length ? fields : FALLBACK.formFields,
  };
}

export default function EnquireModal() {
  const { open, close } = useModals();
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EnquireConfig>(FALLBACK);
  const [values, setValues] = useState<Record<string, string>>({});

  const visible = open === 'enquire';

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/enquire', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<ApiConfig>;
        if (!mounted) return;
        setConfig(mapApiToModal(json));
      } catch {
        // fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/enquire', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send enquiry. Please try again.');

      setStatus('success');
      form.reset();
      setValues({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting enquiry.');
      setStatus('error');
    }
  }

  const handleValueChange =
    (field: FormField) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      let value = '';

      if (field.type === 'multiselect' && e.target instanceof HTMLSelectElement) {
        value = Array.from(e.target.selectedOptions)
          .map((opt) => opt.value)
          .join(',');
      } else {
        value = e.target.value;
      }

      setValues((prev) => ({
        ...prev,
        [field.name]: value,
      }));
    };

  const renderField = (field: FormField) => {
    const baseId = `enq-${field.id}`;

    if (field.type === 'textarea') {
      return (
        <textarea
          id={baseId}
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          onChange={handleValueChange(field)}
        />
      );
    }

    if (field.type === 'select' || field.type === 'multiselect') {
      const current = values[field.name] ?? '';
      const isEmpty = field.type === 'select' ? current === '' : current.trim() === '';

      return (
        <select
          id={baseId}
          name={field.name}
          required={field.required}
          multiple={field.type === 'multiselect'}
          onChange={handleValueChange(field)}
          data-empty={isEmpty ? 'true' : 'false'}
          value={field.type === 'multiselect' ? undefined : current}
        >
          {field.type === 'select' && (
            <option value="" disabled={field.required} hidden>
              Select…
            </option>
          )}

          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : field.type;

    return (
      <input
        id={baseId}
        name={field.name}
        required={field.required}
        placeholder={field.placeholder}
        type={inputType}
        onChange={handleValueChange(field)}
      />
    );
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Enquire now"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close enquiry form"
        >
          ✕
        </button>

        <div className={styles.scrollArea}>
          <p className={styles.kicker}>{config.modalKicker}</p>
          <h2 className={styles.title}>{config.modalTitle}</h2>
          <p className={styles.lead}>{config.modalLead}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              {config.formFields.map((field) => {
                const isWide = field.type === 'textarea';
                return (
                  <div
                    key={field.id}
                    className={`${styles.field} ${isWide ? styles.fieldFull : ''}`}
                  >
                    <label htmlFor={`enq-${field.id}`}>
                      <span className={styles.labelText}>{field.label}</span>
                      {renderField(field)}
                    </label>
                  </div>
                );
              })}
            </div>

            <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : config.submitLabel}
            </button>

            {status === 'success' && (
              <>
                <p className={styles.success}>{config.successMessage}</p>

                {GOOGLE_BOOKING_URL && (
                  <a
                    href={GOOGLE_BOOKING_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.bookingCta}
                  >
                    Book a call in our calendar
                  </a>
                )}
              </>
            )}

            {status === 'error' && <p className={styles.error}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
