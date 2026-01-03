// src/lib/form-builder.ts
import type { FormField, FormFieldType, ShowIf } from '@/types/form-builder';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function s(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}
function n(v: unknown): number | undefined {
  if (typeof v !== 'number') return undefined;
  if (!Number.isFinite(v)) return undefined;
  return v;
}

const ALLOWED: readonly FormFieldType[] = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'multiselect',
  'date',
  'url',
  'number',
  'radio',
  'checkbox',
  'checkboxes',
  'time',
  'datetime',
  'file',
] as const;

function stableId(item: Record<string, unknown>, idx: number, prefix: string) {
  // IMPORTANT: deterministic id generation (no Math.random)
  const id = s(item.id);
  if (id) return id;

  const name = s(item.name);
  if (name) return `${prefix}_${name}`;

  return `${prefix}_${idx}`;
}

export function normalizeFields(raw: unknown, prefix: string): FormField[] {
  if (!Array.isArray(raw)) return [];

  const out: Array<FormField | null> = raw.map((item, idx) => {
    if (!isRecord(item)) return null;

    const typeRaw = s(item.type) as FormFieldType;
    const type: FormFieldType = ALLOWED.includes(typeRaw) ? typeRaw : 'text';

    const name = s(item.name);
    const label = s(item.label);
    if (!name || !label) return null;

    const placeholder = s(item.placeholder);
    const helpText = s(item.helpText);

    const needsOptions =
      type === 'select' || type === 'multiselect' || type === 'radio' || type === 'checkboxes';
    const options =
      needsOptions && Array.isArray(item.options)
        ? item.options.map((x) => s(x)).filter(Boolean)
        : undefined;

    let showIf: ShowIf | undefined;
    if (isRecord(item.showIf)) {
      const field = s(item.showIf.field);
      const equals = s(item.showIf.equals);
      if (field && equals) showIf = { field, equals };
    }

    const field: FormField = {
      id: stableId(item, idx, prefix),
      name,
      label,
      type,
      required: Boolean(item.required),

      ...(placeholder ? { placeholder } : {}),
      ...(helpText ? { helpText } : {}),
      ...(options && options.length ? { options } : {}),
      ...(showIf ? { showIf } : {}),

      // number
      ...(type === 'number'
        ? {
            min: n(item.min),
            max: n(item.max),
            step: n(item.step),
          }
        : {}),

      // file
      ...(type === 'file'
        ? {
            accept: s(item.accept) || undefined,
            multipleFiles: Boolean(item.multipleFiles),
          }
        : {}),
    };

    return field;
  });

  return out.filter((x): x is FormField => x !== null);
}
