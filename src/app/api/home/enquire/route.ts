// src/app/api/home/enquire/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'enquire';

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
  | 'checkboxes'
  | 'file';

export type FormField = {
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

  showIf?: { field: string; equals: string };
};

export type EnquireConfig = {
  // section
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;

  // modal
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;

  // delivery
  recipientEmail?: string | null;

  // fields
  fields: FormField[];
};

const DEFAULT_FIELDS: FormField[] = [
  {
    id: 'enq_type',
    name: 'enq_type',
    label: 'What is this about?',
    type: 'radio',
    required: true,
    options: ['Booking', 'Partnership', 'General'],
  },
  { id: 'contact_name', name: 'contact_name', label: 'Your name', type: 'text', required: true },
  { id: 'email', name: 'email', label: 'Email address', type: 'email', required: true },
  { id: 'phone', name: 'phone', label: 'Phone number', type: 'tel', required: false },
  { id: 'event_date', name: 'event_date', label: 'Event date', type: 'date', required: false },
  { id: 'event_time', name: 'event_time', label: 'Event time', type: 'time', required: false },
  { id: 'location', name: 'location', label: 'Location', type: 'text', required: false },
  { id: 'message', name: 'message', label: 'Details', type: 'textarea', required: true },
];

const DEFAULT_CONFIG: EnquireConfig = {
  eyebrow: 'For venues & events',
  title: 'Enquire about DJs and live music.',
  lead: 'We curate DJs and musicians for restaurants, bars and event spaces — matching artists to your brand, guest profile and schedule.',
  buttonLabel: 'Open enquiry form',

  modalKicker: 'Enquire Now',
  modalTitle: 'Tell us about your venue or event.',
  modalLead:
    'Share a few details about your space, schedule and music brief — we’ll match you with the right artists.',
  submitLabel: 'Send enquiry',
  successMessage: 'Thanks — we’ll be in touch shortly.',

  recipientEmail: null,
  fields: DEFAULT_FIELDS,
};

/** -----------------------------
 *  Guards / sanitizers
 *  ---------------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const sanitizeStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function sanitizeNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function isFieldType(v: string): v is FieldType {
  return (
    v === 'text' ||
    v === 'textarea' ||
    v === 'email' ||
    v === 'tel' ||
    v === 'date' ||
    v === 'time' ||
    v === 'datetime' ||
    v === 'url' ||
    v === 'number' ||
    v === 'select' ||
    v === 'multiselect' ||
    v === 'radio' ||
    v === 'checkbox' ||
    v === 'checkboxes' ||
    v === 'file'
  );
}

function sanitizeField(raw: unknown, idx: number): FormField | null {
  if (!isRecord(raw)) return null;

  const label = sanitizeStr(raw.label) || `Field ${idx + 1}`;
  const name = sanitizeStr(raw.name) || label.toLowerCase().replace(/\s+/g, '_');

  const typeStr = sanitizeStr(raw.type);
  const type: FieldType = isFieldType(typeStr) ? typeStr : 'text';

  const required = Boolean(raw.required);
  const placeholder = sanitizeStr(raw.placeholder);
  const helpText = sanitizeStr(raw.helpText);
  const id = sanitizeStr(raw.id) || `enquire_${name}_${idx}`;

  const needsOptions =
    type === 'select' || type === 'multiselect' || type === 'radio' || type === 'checkboxes';
  let options: string[] | undefined;
  if (needsOptions && Array.isArray(raw.options)) {
    options = raw.options.map((x) => sanitizeStr(x)).filter(Boolean);
  }

  let showIf: { field: string; equals: string } | undefined;
  if (isRecord(raw.showIf)) {
    const f = sanitizeStr(raw.showIf.field);
    const eq = sanitizeStr(raw.showIf.equals);
    if (f && eq) showIf = { field: f, equals: eq };
  }

  let min: number | undefined;
  let max: number | undefined;
  let step: number | undefined;
  if (type === 'number') {
    min = sanitizeNum(raw.min);
    max = sanitizeNum(raw.max);
    step = sanitizeNum(raw.step);
  }

  let accept: string | undefined;
  let multipleFiles: boolean | undefined;
  if (type === 'file') {
    accept = sanitizeStr(raw.accept) || undefined;
    multipleFiles = Boolean(raw.multipleFiles);
  }

  const out: FormField = {
    id,
    name,
    label,
    type,
    required,
  };

  if (placeholder) out.placeholder = placeholder;
  if (helpText) out.helpText = helpText;
  if (options && options.length) out.options = options;
  if (min !== undefined) out.min = min;
  if (max !== undefined) out.max = max;
  if (step !== undefined) out.step = step;
  if (accept) out.accept = accept;
  if (multipleFiles !== undefined) out.multipleFiles = multipleFiles;
  if (showIf) out.showIf = showIf;

  return out;
}

function sanitizeConfig(body: unknown): EnquireConfig {
  const b = isRecord(body) ? body : {};

  const fieldsRaw = Array.isArray(b.fields) ? b.fields : DEFAULT_FIELDS;
  const fields = fieldsRaw
    .map((f, i) => sanitizeField(f, i))
    .filter((f): f is FormField => Boolean(f));

  const recipientEmail = sanitizeStr(b.recipientEmail);

  return {
    eyebrow: sanitizeStr(b.eyebrow) || DEFAULT_CONFIG.eyebrow,
    title: sanitizeStr(b.title) || DEFAULT_CONFIG.title,
    lead: sanitizeStr(b.lead) || DEFAULT_CONFIG.lead,
    buttonLabel: sanitizeStr(b.buttonLabel) || DEFAULT_CONFIG.buttonLabel,

    modalKicker: sanitizeStr(b.modalKicker) || DEFAULT_CONFIG.modalKicker,
    modalTitle: sanitizeStr(b.modalTitle) || DEFAULT_CONFIG.modalTitle,
    modalLead: sanitizeStr(b.modalLead) || DEFAULT_CONFIG.modalLead,
    submitLabel: sanitizeStr(b.submitLabel) || DEFAULT_CONFIG.submitLabel,
    successMessage: sanitizeStr(b.successMessage) || DEFAULT_CONFIG.successMessage,

    recipientEmail: recipientEmail || null,

    fields: fields.length ? fields : DEFAULT_FIELDS,
  };
}

function parseJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** -----------------------------
 *  Handlers
 *  ---------------------------- */
export async function GET() {
  try {
    const row = await prisma.homeEnquire.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULT_CONFIG);

    const fieldsRaw = parseJsonArray(row.formFields);
    const fields = (fieldsRaw.length ? fieldsRaw : DEFAULT_FIELDS)
      .map((f, i) => sanitizeField(f, i))
      .filter((f): f is FormField => Boolean(f));

    const config: EnquireConfig = {
      eyebrow: row.eyebrow || DEFAULT_CONFIG.eyebrow,
      title: row.title || DEFAULT_CONFIG.title,
      lead: row.lead || DEFAULT_CONFIG.lead,
      buttonLabel: row.buttonLabel || DEFAULT_CONFIG.buttonLabel,

      modalKicker: row.modalKicker || DEFAULT_CONFIG.modalKicker,
      modalTitle: row.modalTitle || DEFAULT_CONFIG.modalTitle,
      modalLead: row.modalLead || DEFAULT_CONFIG.modalLead,
      submitLabel: row.submitLabel || DEFAULT_CONFIG.submitLabel,
      successMessage: row.successMessage || DEFAULT_CONFIG.successMessage,

      recipientEmail: row.recipientEmail ?? null,
      fields: fields.length ? fields : DEFAULT_FIELDS,
    };

    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/home/enquire failed:', e);
    return NextResponse.json({ error: 'Server error (GET enquire).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const data = sanitizeConfig(body);

    const fieldsJson: Prisma.InputJsonValue = data.fields as unknown as Prisma.InputJsonValue;

    const saved = await prisma.homeEnquire.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        buttonLabel: data.buttonLabel,

        modalKicker: data.modalKicker,
        modalTitle: data.modalTitle,
        modalLead: data.modalLead,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,

        recipientEmail: data.recipientEmail,
        formFields: fieldsJson,
      },
      update: {
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        buttonLabel: data.buttonLabel,

        modalKicker: data.modalKicker,
        modalTitle: data.modalTitle,
        modalLead: data.modalLead,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,

        recipientEmail: data.recipientEmail,
        formFields: fieldsJson,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error('POST /api/home/enquire failed:', e);
    return NextResponse.json({ error: 'Server error (POST enquire).' }, { status: 500 });
  }
}
