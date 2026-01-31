// src/lib/mailer.ts
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ✅ Visible in server logs so you can confirm production is using relay + 587
console.log('[mailer] SMTP config', {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT === 587,
  hasUser: Boolean(SMTP_USER),
  hasPass: Boolean(SMTP_PASS),
});

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  // Will show in server logs if env is wrong
  console.warn('[mailer] SMTP configuration incomplete. Emails will fail to send.');
}

export const transporter =
  SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,

        // 465 = implicit TLS, 587 = STARTTLS
        secure: SMTP_PORT === 465,

        // ✅ Force TLS for relay on 587 (prevents downgrade / weird prod behavior)
        requireTLS: SMTP_PORT === 587,

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

export const INTERNAL_EMAIL = process.env.Essentia_INTERNAL_EMAIL || SMTP_USER || '';

// ✅ Email logo absolute URL (must be public https URL)
export const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || '';
