// src/components/home/modals/renderField.tsx
'use client';

import type React from 'react';
import type { FormField } from '@/types/form-builder';
import RadioPills from './RadioPills';
import CheckboxPills from './CheckboxPills';

/**
 * Values must support arrays for:
 * - multiselect
 * - checkboxes group
 */
export type Values = Record<string, string | string[]>;

export function shouldShowField(field: FormField, values: Values) {
  if (!field.showIf) return true;

  const controllingValue = values[field.showIf.field];

  // If the controlling field is multi (array), check inclusion
  if (Array.isArray(controllingValue)) {
    return controllingValue.includes(field.showIf.equals);
  }

  return (controllingValue ?? '') === field.showIf.equals;
}

export function updateValueForField(
  field: FormField,
  e:
    | React.ChangeEvent<HTMLInputElement>
    | React.ChangeEvent<HTMLTextAreaElement>
    | React.ChangeEvent<HTMLSelectElement>
): string {
  // checkbox single
  if (field.type === 'checkbox' && e.target instanceof HTMLInputElement) {
    return e.target.checked ? 'true' : 'false';
  }

  // checkbox group + multiselect are handled in their own renderers
  if (
    (field.type === 'checkboxes' && e.target instanceof HTMLInputElement) ||
    (field.type === 'multiselect' && e.target instanceof HTMLSelectElement)
  ) {
    return '';
  }

  return e.target.value;
}

function tryShowPickerFromEvent(e: React.SyntheticEvent<HTMLInputElement>) {
  const el = e.currentTarget;

  // Chrome / Edge only (safe feature detection)
  const anyEl = el as unknown as { showPicker?: () => void };
  if (typeof anyEl.showPicker !== 'function') return;

  // Must be a trusted user gesture — pointerdown works best
  try {
    anyEl.showPicker();
  } catch {
    // ignore
  }
}

export function renderFieldControl(
  field: FormField,
  values: Values,
  setValues: React.Dispatch<React.SetStateAction<Values>>,
  idPrefix: string
) {
  const id = `${idPrefix}-${field.id}`;
  const raw = values[field.name];

  const baseProps = {
    id,
    name: field.name,
    required: field.required,
    'aria-label': field.label,
  };

  const set = (name: string, v: string | string[]) =>
    setValues((prev) => ({
      ...prev,
      [name]: v,
    }));

  const valueStr = typeof raw === 'string' ? raw : '';
  const valueArr = Array.isArray(raw) ? raw : [];

  if (field.type === 'textarea') {
    return (
      <textarea
        {...baseProps}
        placeholder={field.placeholder}
        rows={4}
        value={valueStr}
        onChange={(e) => set(field.name, e.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select {...baseProps} value={valueStr} onChange={(e) => set(field.name, e.target.value)}>
        <option value="">Select…</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'multiselect') {
    return (
      <select
        {...baseProps}
        multiple
        value={valueArr}
        onChange={(e) => {
          const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
          set(field.name, vals);
        }}
        // Better UX: show a few options at once
        size={Math.min(6, Math.max(3, field.options?.length ?? 3))}
      >
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // ✅ RADIO (pills)
  if (field.type === 'radio') {
    return (
      <RadioPills
        name={field.name}
        value={valueStr}
        options={field.options ?? []}
        required={field.required}
        onChange={(v) => set(field.name, v)}
      />
    );
  }

  if (field.type === 'checkbox') {
    const checked = valueStr === 'true';
    return (
      <input
        id={id}
        name={field.name}
        type="checkbox"
        checked={checked}
        onChange={(e) => set(field.name, e.target.checked ? 'true' : 'false')}
      />
    );
  }

  // ✅ CHECKBOX GROUP (pills)
  // We keep your UI component, but store arrays instead of comma strings
  if (field.type === 'checkboxes') {
    return (
      <CheckboxPills
        name={field.name}
        value={valueArr}
        options={field.options ?? []}
        required={field.required}
        onChange={(v) => set(field.name, v)}
      />
    );
  }

  if (field.type === 'file') {
    return (
      <input
        id={id}
        name={field.name}
        type="file"
        required={field.required}
        accept={field.accept}
        multiple={Boolean(field.multipleFiles)}
      />
    );
  }

  // map to real input types
  const inputType =
    field.type === 'datetime'
      ? 'datetime-local'
      : field.type === 'number'
        ? 'number'
        : field.type === 'time'
          ? 'time'
          : field.type; // text/email/tel/date/url

  const isPickerType =
    inputType === 'date' || inputType === 'time' || inputType === 'datetime-local';

  return (
    <input
      id={id}
      name={field.name}
      required={field.required}
      placeholder={field.placeholder}
      type={inputType}
      value={valueStr}
      onChange={(e) => set(field.name, e.target.value)}
      onPointerDown={isPickerType ? (e) => tryShowPickerFromEvent(e) : undefined}
      min={field.type === 'number' && typeof field.min === 'number' ? field.min : undefined}
      max={field.type === 'number' && typeof field.max === 'number' ? field.max : undefined}
      step={field.type === 'number' && typeof field.step === 'number' ? field.step : undefined}
    />
  );
}
