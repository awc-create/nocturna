// src/lib/mailer.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  // Will show in server logs if env is wrong
  console.warn('[mailer] SMTP configuration incomplete. Emails will fail to send.');
}

export const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    : null;

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const BOOKING_URL =
  process.env.BOOKING_URL || process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL || '';

export const INTERNAL_EMAIL = process.env.NOTURNA_INTERNAL_EMAIL || SMTP_USER || '';

// ✅ NEW: email logo absolute URL (must be public https URL)
export const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || '';
