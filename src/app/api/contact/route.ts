// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transporter, escapeHtml, INTERNAL_EMAIL, EMAIL_LOGO_URL } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'contact';

const CONTACT_FROM =
  process.env.CONTACT_FROM_EMAIL || 'Essentia Contact <contact@Essentiagency.com>';

const LOGO_ROW = EMAIL_LOGO_URL
  ? `<tr>
       <td style="padding-bottom:18px;" align="center">
         <img
           src="${EMAIL_LOGO_URL}"
           alt="Essentia"
           width="160"
           style="display:block;width:160px;max-width:60%;height:auto;margin:0 auto;opacity:0.96;"
         />
       </td>
     </tr>`
  : '';

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxgroup'
  | 'radio'
  | 'file';

type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  multipleFiles?: boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function parseJsonArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function s(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

// ✅ Keep values clean + single-line (no random newlines)
function oneLine(v: string) {
  return v
    .replace(/\r?\n+/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeFieldsFromRow(row: unknown): FormField[] {
  if (!isRecord(row)) return [];
  const arr = parseJsonArray((row as Record<string, unknown>).formFields);
  return arr
    .map((x) => (isRecord(x) ? x : null))
    .filter(Boolean)
    .map((x) => {
      const r = x as Record<string, unknown>;
      return {
        id: s(r.id) || s(r.name) || 'field',
        name: s(r.name),
        label: s(r.label) || s(r.name),
        type: (s(r.type) as FieldType) || 'text',
        required: Boolean(r.required),
        multipleFiles: Boolean(r.multipleFiles) || undefined,
      } satisfies FormField;
    })
    .filter((f) => Boolean(f.name));
}

async function filesToAttachments(files: File[]) {
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB each
  const MAX_FILES = 3;

  const picked = files.slice(0, MAX_FILES);
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];

  for (const f of picked) {
    if (!f?.name) continue;
    if (f.size > MAX_FILE_BYTES) continue;

    const ab = await f.arrayBuffer();
    attachments.push({
      filename: f.name,
      content: Buffer.from(ab),
      contentType: f.type || undefined,
    });
  }

  return attachments;
}

export async function POST(req: NextRequest) {
  try {
    if (!transporter) {
      return NextResponse.json({ error: 'Email transport not configured.' }, { status: 500 });
    }

    // Load config (recipient + required fields)
    const row = await prisma.homeContact.findUnique({ where: { key: KEY } });

    const recipientEmail =
      (row?.recipientEmail ?? '').trim() || INTERNAL_EMAIL || (row?.contactEmail ?? '').trim();

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient configured.' }, { status: 500 });
    }

    const fields = safeFieldsFromRow(row ?? {});
    const fallbackRequired = ['name', 'email', 'message']; // in case config is empty

    // IMPORTANT: read as FormData (your modal sends FormData)
    const formData = await req.formData();

    const payload: Record<string, string | string[]> = {};
    const uploaded: Record<string, File[]> = {};

    for (const [key, val] of formData.entries()) {
      if (val instanceof File) {
        if (!uploaded[key]) uploaded[key] = [];
        uploaded[key].push(val);
        continue;
      }

      const v = oneLine(String(val));
      if (key in payload) {
        const prev = payload[key];
        payload[key] = Array.isArray(prev) ? [...prev, v] : [prev, v];
      } else {
        payload[key] = v;
      }
    }

    // Validate required fields based on DB config (or fallback if no config)
    const requiredFields = fields.length
      ? fields.filter((f) => f.required).map((f) => f.name)
      : fallbackRequired;

    const missing: string[] = [];
    for (const key of requiredFields) {
      const v = payload[key];
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0);
      if (empty) missing.push(key);
    }
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const senderName = typeof payload.name === 'string' ? payload.name : '';
    const senderEmail = typeof payload.email === 'string' ? payload.email : '';

    const subject = `New contact message${senderName ? ` from ${senderName}` : ''}`;

    const ordered = fields.length
      ? fields.map((f) => ({ key: f.name, label: f.label || f.name }))
      : Object.keys(payload).map((k) => ({ key: k, label: k }));

    const rowsText: string[] = [];
    const rowsHtml: string[] = [];

    for (const def of ordered) {
      const raw = payload[def.key];
      if (raw === undefined) continue;

      const val = Array.isArray(raw) ? raw.join(', ') : raw;
      if (!String(val).trim()) continue;

      rowsText.push(`${def.label}: ${val}`);

      // ✅ Tight, clean, always-left rows
      rowsHtml.push(`
        <tr>
          <td valign="top" style="padding:4px 0;color:rgba(148,163,184,0.95);width:160px;line-height:16px;mso-line-height-rule:exactly;text-align:left;">
            ${escapeHtml(def.label)}
          </td>
          <td valign="top" style="padding:4px 0;color:#f9fafb;font-weight:600;line-height:16px;mso-line-height-rule:exactly;text-align:left;white-space:normal;word-break:break-word;overflow-wrap:anywhere;">
            ${escapeHtml(val)}
          </td>
        </tr>
      `);
    }

    const allFiles = Object.values(uploaded).flat();
    const attachments = await filesToAttachments(allFiles);

    const textBody = ['New contact message', '', ...rowsText].join('\n');

    // ✅ Match Enquire’s look/structure
    const htmlBody = `
      <!doctype html>
      <html lang="en">
        <head><meta charSet="utf-8" /><title>${escapeHtml(subject)}</title></head>
        <body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                  style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;color:#e5e7eb;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  ${LOGO_ROW}
                  <tr>
                    <td style="padding-bottom:12px;text-align:left;">
                      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">Essentia · Contact</div>
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">New contact message</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">Someone has submitted the contact form on the website.</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:10px;padding-bottom:10px;text-align:left;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                        style="border-collapse:collapse;background:radial-gradient(circle at top left,#020617,#030712);border-radius:14px;border:1px solid rgba(55,65,81,0.9);overflow:hidden;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                        <tr>
                          <td style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:rgba(249,250,251,0.75);border-bottom:1px solid rgba(55,65,81,0.9);text-align:left;">
                            Message details
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="padding:10px 14px 10px;text-align:left;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                              style="border-collapse:collapse;font-size:13px;line-height:16px;text-align:left;table-layout:fixed;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                              ${rowsHtml.join('')}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:10px;font-size:11px;color:rgba(148,163,184,0.75);text-align:left;">
                      You can reply directly to this email to respond to the sender (if they provided an email).
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Internal email
    await transporter.sendMail({
      from: CONTACT_FROM,
      to: recipientEmail,
      replyTo: senderEmail || undefined,
      subject,
      text: textBody,
      html: htmlBody,
      ...(attachments.length ? { attachments } : {}),
    });

    // Auto-reply (only if user provided email)
    if (senderEmail) {
      const thanksSubject = 'Thanks — we got your message (Essentia)';
      const thanksText = [
        `Hi ${senderName || 'there'},`,
        '',
        'Thanks for reaching out.',
        'We’ve received your message and will get back to you shortly.',
        '',
        '— The Essentia team',
      ].join('\n');

      const thanksHtml = `
        <!doctype html>
        <html lang="en">
          <head><meta charSet="utf-8" /><title>${escapeHtml(thanksSubject)}</title></head>
          <body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;mso-table-lspace:0pt;mso-table-rspace:0pt;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                    ${LOGO_ROW}
                    <tr>
                      <td style="text-align:left;">
                        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">Essentia · Contact</div>
                        <h1 style="margin:0;font-size:22px;line-height:1.3;">Thanks for your message</h1>
                        <p style="margin:10px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                          Hi ${escapeHtml(senderName || 'there')},<br/>
                          We’ve received your message and will get back to you shortly.
                        </p>
                        <p style="margin:16px 0 0;font-size:13px;color:rgba(148,163,184,0.95);">
                          — The Essentia team
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      await transporter.sendMail({
        from: CONTACT_FROM,
        to: senderEmail,
        subject: thanksSubject,
        text: thanksText,
        html: thanksHtml,
        replyTo: recipientEmail,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Server error while sending contact.' }, { status: 500 });
  }
}
