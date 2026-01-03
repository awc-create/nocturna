// src/types/form-builder.ts

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'url'
  | 'number'
  | 'radio'
  | 'checkbox'
  | 'checkboxes'
  | 'time'
  | 'datetime'
  | 'file';

export type ShowIf = {
  field: string; // controlling field name
  equals: string; // value required for this field to show
};

export type FormField = {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;

  placeholder?: string;
  helpText?: string;

  /**
   * Used by:
   * - select
   * - multiselect
   * - radio
   * - checkboxes (group)
   */
  options?: string[];

  /**
   * Used by:
   * - file
   */
  accept?: string; // e.g. "audio/*,image/*,.pdf"
  multipleFiles?: boolean;

  /**
   * Used by:
   * - number
   */
  min?: number;
  max?: number;
  step?: number;

  /**
   * Conditional rendering
   */
  showIf?: ShowIf;
};

export type ApiFormConfig = {
  title: string;
  intro: string; // or description (we’ll map in contact)
  submitLabel: string;
  successMessage: string;
  fields: FormField[];
};
