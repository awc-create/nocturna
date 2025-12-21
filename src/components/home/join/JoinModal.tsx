'use client';

import { useEffect, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './JoinModal.module.scss';

type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'url';

type ShowIf = {
  field: string;
  equals: string;
};

type FormField = {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  showIf?: ShowIf;
};

type ApiConfig = {
  title: string;
  intro: string;
  submitLabel: string;
  successMessage: string;
  fields: FormField[];
};

type JoinConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: JoinConfig = {
  modalKicker: 'Join Nocturna',
  modalTitle: 'Tell us about your sound.',
  modalLead:
    'Tell us who you are, what you play, and where you’re currently performing. We’ll review every application carefully.',
  submitLabel: 'Send Application',
  successMessage: 'Thanks — we’ll review your submission and follow up.',
  formFields: [
    {
      id: 'role',
      label: 'Role *',
      name: 'role',
      type: 'select',
      required: true,
      placeholder: 'Select your role',
      options: ['DJ', 'Musician'],
    },
    {
      id: 'instrument',
      label: 'Instrument (if musician)',
      name: 'instrument',
      type: 'text',
      required: false,
      placeholder: 'e.g. Saxophone, keys, percussion…',
      showIf: { field: 'role', equals: 'Musician' },
    },
    {
      id: 'full_name',
      label: 'Full legal name *',
      name: 'full_name',
      type: 'text',
      required: true,
      placeholder: 'As on your ID / passport',
    },
    {
      id: 'address',
      label: 'Full address *',
      name: 'address',
      type: 'textarea',
      required: true,
      placeholder: 'House number, street, city, postcode',
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
      id: 'dob',
      label: 'Date of birth *',
      name: 'dob',
      type: 'date',
      required: true,
    },
    {
      id: 'website',
      label: 'Website',
      name: 'website',
      type: 'url',
      required: false,
      placeholder: 'https://your-site.com',
    },
    {
      id: 'soundcloud',
      label: 'SoundCloud',
      name: 'soundcloud',
      type: 'url',
      required: false,
      placeholder: 'Profile link',
    },
    {
      id: 'genres',
      label: 'Favourite genres to play?',
      name: 'genres',
      type: 'text',
      required: false,
      placeholder: 'e.g. soulful house, amapiano, R&B…',
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

    let showIf: ShowIf | undefined;
    if (isRecord(item.showIf)) {
      const f = safeString(item.showIf.field).trim();
      const eq = safeString(item.showIf.equals).trim();
      if (f && eq) showIf = { field: f, equals: eq };
    }

    const field: FormField = {
      id: ensureId(item, idx, 'join'),
      name,
      label,
      type,
      required: Boolean(item.required),
      ...(placeholder ? { placeholder } : {}),
      ...(options && options.length ? { options } : {}),
      ...(showIf ? { showIf } : {}),
    };

    return field;
  });

  return out.filter((x): x is FormField => x !== null);
}

function mapApiToModal(api: Partial<ApiConfig>): JoinConfig {
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

export default function JoinModal() {
  const { open, close } = useModals();
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<JoinConfig>(FALLBACK);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const visible = open === 'join';

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Hydrate config from API (NEW SHAPE: title/intro/submitLabel/fields)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/join', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<ApiConfig>;
        if (!mounted) return;
        setConfig(mapApiToModal(json));
      } catch {
        // keep fallback
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
      const res = await fetch('/api/join', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send application. Please try again.');

      setStatus('success');
      form.reset();
      setFormValues({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting application.');
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

      setFormValues((prev) => ({
        ...prev,
        [field.name]: value,
      }));
    };

  const shouldShowField = (field: FormField) => {
    if (!field.showIf) return true;
    const controllingValue = formValues[field.showIf.field] ?? '';
    return controllingValue === field.showIf.equals;
  };

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    const baseId = `join-${field.id}`;

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
      return (
        <select
          id={baseId}
          name={field.name}
          required={field.required}
          multiple={field.type === 'multiselect'}
          onChange={handleValueChange(field)}
          value={field.type === 'multiselect' ? undefined : (formValues[field.name] ?? '')}
        >
          {field.type === 'select' && <option value="">Select…</option>}
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
      aria-label="Join Nocturna"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close form">
          ✕
        </button>

        <div className={styles.scrollArea}>
          <p className={styles.kicker}>{config.modalKicker}</p>
          <h2 className={styles.title}>{config.modalTitle}</h2>
          <p className={styles.lead}>{config.modalLead}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              {config.formFields.map((field) => {
                const control = renderField(field);
                if (!control) return null;
                const isWide = field.type === 'textarea';

                return (
                  <div
                    key={field.id}
                    className={`${styles.field} ${isWide ? styles.fieldFull : ''}`}
                  >
                    <label htmlFor={`join-${field.id}`}>
                      <span className={styles.labelText}>{field.label}</span>
                      {control}
                    </label>
                  </div>
                );
              })}
            </div>

            <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : config.submitLabel}
            </button>

            {status === 'success' && <p className={styles.success}>{config.successMessage}</p>}
            {status === 'error' && <p className={styles.error}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
