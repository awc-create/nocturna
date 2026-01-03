// src/components/home/modals/renderField.tsx
'use client';

import type React from 'react';
import type { FormField } from '@/types/form-builder';
import RadioPills from './RadioPills';
import CheckboxPills from './CheckboxPills';

export type Values = Record<string, string>;

export function shouldShowField(field: FormField, values: Values) {
  if (!field.showIf) return true;
  const controllingValue = values[field.showIf.field] ?? '';
  return controllingValue === field.showIf.equals;
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

  // checkbox group + multiselect
  if (
    (field.type === 'checkboxes' && e.target instanceof HTMLInputElement) ||
    (field.type === 'multiselect' && e.target instanceof HTMLSelectElement)
  ) {
    // handled elsewhere (see renderers)
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
    // Browser denied it (no trusted gesture) — ignore.
    // The native calendar icon / default behavior still works.
  }
}

export function renderFieldControl(
  field: FormField,
  values: Values,
  setValues: React.Dispatch<React.SetStateAction<Values>>,
  idPrefix: string
) {
  const id = `${idPrefix}-${field.id}`;
  const value = values[field.name] ?? '';

  const baseProps = {
    id,
    name: field.name,
    required: field.required,
    'aria-label': field.label,
  };

  const set = (name: string, v: string) =>
    setValues((prev) => ({
      ...prev,
      [name]: v,
    }));

  if (field.type === 'textarea') {
    return (
      <textarea
        {...baseProps}
        placeholder={field.placeholder}
        rows={4}
        value={value}
        onChange={(e) => set(field.name, e.target.value)}
      />
    );
  }

  if (field.type === 'select' || field.type === 'multiselect') {
    if (field.type === 'multiselect') {
      const selected = value
        ? value
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

      return (
        <select
          {...baseProps}
          multiple
          value={selected}
          onChange={(e) => {
            const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
            set(field.name, vals.join(','));
          }}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <select {...baseProps} value={value} onChange={(e) => set(field.name, e.target.value)}>
        <option value="">Select…</option>
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
        value={value}
        options={field.options ?? []}
        required={field.required}
        onChange={(v) => set(field.name, v)}
      />
    );
  }

  if (field.type === 'checkbox') {
    const checked = value === 'true';
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
  if (field.type === 'checkboxes') {
    return (
      <CheckboxPills
        name={field.name}
        value={value}
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
      value={value}
      onChange={(e) => set(field.name, e.target.value)}
      // ✅ IMPORTANT: only attempt showPicker on pointerdown (trusted gesture)
      onPointerDown={isPickerType ? (e) => tryShowPickerFromEvent(e) : undefined}
      min={field.type === 'number' && typeof field.min === 'number' ? field.min : undefined}
      max={field.type === 'number' && typeof field.max === 'number' ? field.max : undefined}
      step={field.type === 'number' && typeof field.step === 'number' ? field.step : undefined}
    />
  );
}
