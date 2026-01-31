// src/app/api/home/join/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'join';

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

export type JoinConfig = {
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
    id: 'role',
    name: 'role',
    label: 'Are you a musician or DJ?',
    type: 'radio',
    required: true,
    options: ['DJ', 'Musician'],
  },
  {
    id: 'instrument',
    name: 'instrument',
    label: 'If musician, what do you play?',
    type: 'text',
    required: false,
    placeholder: 'e.g. Saxophone, keys, percussion…',
    showIf: { field: 'role', equals: 'Musician' },
  },
  {
    id: 'full_name',
    name: 'full_name',
    label: 'Full legal or birth name',
    type: 'text',
    required: true,
  },
  { id: 'email', name: 'email', label: 'Email address', type: 'email', required: true },
  { id: 'phone', name: 'phone', label: 'Mobile number', type: 'tel', required: true },
  { id: 'dob', name: 'dob', label: 'Date of birth', type: 'date', required: true },
  { id: 'address', name: 'address', label: 'Full address', type: 'textarea', required: true },
  { id: 'genres', name: 'genres', label: 'Favourite genres', type: 'textarea', required: false },
];

const DEFAULT_CONFIG: JoinConfig = {
  eyebrow: 'For artists & collectives',
  title: 'Join the Essentia roster.',
  lead: 'DJs, musicians and live acts who care about atmosphere, consistency and good hospitality.',
  buttonLabel: 'Open application form',

  modalKicker: 'Join Essentia',
  modalTitle: 'Tell us about your sound.',
  modalLead: 'Share links, socials and a short intro — we’ll review and get back if there’s a fit.',
  submitLabel: 'Apply to join',
  successMessage: 'Thanks — we’ll review your submission and follow up.',

  recipientEmail: null,
  fields: DEFAULT_FIELDS,
};

// ---- small runtime helpers (no any) ----
type JsonObj = Record<string, unknown>;
function isJsonObj(v: unknown): v is JsonObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const sanitizeStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function sanitizeNum(v: unknown): number | undefined {
  if (typeof v !== 'number') return undefined;
  if (!Number.isFinite(v)) return undefined;
  return v;
}

function sanitizeField(raw: unknown, idx: number): FormField | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const label = sanitizeStr(r.label) || `Field ${idx + 1}`;
  const name = sanitizeStr(r.name) || label.toLowerCase().replace(/\s+/g, '_');

  const typeRaw = sanitizeStr(r.type) as FieldType;
  const allowedTypes: FieldType[] = [
    'text',
    'textarea',
    'email',
    'tel',
    'date',
    'time',
    'datetime',
    'url',
    'number',
    'select',
    'multiselect',
    'radio',
    'checkbox',
    'checkboxes',
    'file',
  ];
  const type = allowedTypes.includes(typeRaw) ? typeRaw : 'text';

  const required = Boolean(r.required);
  const placeholder = sanitizeStr(r.placeholder);
  const helpText = sanitizeStr(r.helpText);
  const id = sanitizeStr(r.id) || `join_${name}_${idx}`;

  const needsOptions =
    type === 'select' || type === 'multiselect' || type === 'radio' || type === 'checkboxes';

  let options: string[] | undefined;
  if (needsOptions && Array.isArray(r.options)) {
    options = r.options.map((x) => sanitizeStr(x)).filter((x) => x.length > 0);
  }

  let showIf: { field: string; equals: string } | undefined;
  if (r.showIf && typeof r.showIf === 'object' && !Array.isArray(r.showIf)) {
    const rr = r.showIf as Record<string, unknown>;
    const f = sanitizeStr(rr.field);
    const eq = sanitizeStr(rr.equals);
    if (f && eq) showIf = { field: f, equals: eq };
  }

  let min: number | undefined;
  let max: number | undefined;
  let step: number | undefined;
  if (type === 'number') {
    min = sanitizeNum(r.min);
    max = sanitizeNum(r.max);
    step = sanitizeNum(r.step);
  }

  let accept: string | undefined;
  let multipleFiles: boolean | undefined;
  if (type === 'file') {
    accept = sanitizeStr(r.accept) || undefined;
    multipleFiles = Boolean(r.multipleFiles);
  }

  return {
    id,
    name,
    label,
    type,
    required,
    placeholder: placeholder || undefined,
    helpText: helpText || undefined,
    options,
    min,
    max,
    step,
    accept,
    multipleFiles,
    showIf,
  };
}

function sanitizeConfig(body: Partial<JoinConfig>): JoinConfig {
  const fieldsRaw = Array.isArray(body.fields) ? body.fields : DEFAULT_FIELDS;
  const fields: FormField[] = fieldsRaw
    .map((f, i) => sanitizeField(f, i))
    .filter((f): f is FormField => !!f);

  return {
    eyebrow: sanitizeStr(body.eyebrow) || DEFAULT_CONFIG.eyebrow,
    title: sanitizeStr(body.title) || DEFAULT_CONFIG.title,
    lead: sanitizeStr(body.lead) || DEFAULT_CONFIG.lead,
    buttonLabel: sanitizeStr(body.buttonLabel) || DEFAULT_CONFIG.buttonLabel,

    modalKicker: sanitizeStr(body.modalKicker) || DEFAULT_CONFIG.modalKicker,
    modalTitle: sanitizeStr(body.modalTitle) || DEFAULT_CONFIG.modalTitle,
    modalLead: sanitizeStr(body.modalLead) || DEFAULT_CONFIG.modalLead,
    submitLabel: sanitizeStr(body.submitLabel) || DEFAULT_CONFIG.submitLabel,
    successMessage: sanitizeStr(body.successMessage) || DEFAULT_CONFIG.successMessage,

    recipientEmail: sanitizeStr(body.recipientEmail) || null,

    fields: fields.length ? fields : DEFAULT_FIELDS,
  };
}

// Type the DB row shape so submitLabel is accessible without any-casting.
// If your Prisma model already includes submitLabel, this will match.
// If it doesn't exist yet, TS will tell you (which is correct) and you should run the migration.
type HomeJoinRow = {
  id: string;
  key: string;
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  recipientEmail: string | null;
  formFields: Prisma.JsonValue | null;
};

export async function GET() {
  try {
    const row = (await prisma.homeJoin.findUnique({
      where: { key: KEY },
    })) as HomeJoinRow | null;

    if (!row) return NextResponse.json(DEFAULT_CONFIG);

    const fieldsRaw: unknown = row.formFields ?? [];
    const fields = (Array.isArray(fieldsRaw) ? fieldsRaw : DEFAULT_FIELDS)
      .map((f, i) => sanitizeField(f, i))
      .filter((f): f is FormField => !!f);

    const config: JoinConfig = {
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
  } catch (e: unknown) {
    console.error('GET /api/home/join failed:', e);
    return NextResponse.json({ error: 'Server error (GET join).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    if (!isJsonObj(raw)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const body = raw as Partial<JoinConfig>;
    const data = sanitizeConfig(body);

    // Prisma JSON accepts JsonValue. Arrays are valid JsonValue.
    const fieldsJson: Prisma.JsonValue = data.fields;

    // Use Prisma’s generated input type: no `as any` needed.
    const payload: Prisma.HomeJoinUncheckedCreateInput = {
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

      recipientEmail: data.recipientEmail ?? null,
      formFields: fieldsJson,
    };

    const saved = await prisma.homeJoin.upsert({
      where: { key: KEY },
      create: payload,
      update: payload,
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e: unknown) {
    console.error('POST /api/home/join failed:', e);
    return NextResponse.json({ error: 'Server error (POST join).' }, { status: 500 });
  }
}
