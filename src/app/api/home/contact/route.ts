// src/app/api/home/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transporter, escapeHtml, INTERNAL_EMAIL, EMAIL_LOGO_URL } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEY = 'contact';

const CONTACT_FROM =
  process.env.CONTACT_FROM_EMAIL || 'Nocturna Contact <contact@nocturnagency.com>';

type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'soundcloud';

type SocialLink = { platform: SocialPlatform; url: string };

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

const LOGO_ROW = EMAIL_LOGO_URL
  ? `<tr>
       <td style="padding-bottom:18px;" align="center">
         <img
           src="${EMAIL_LOGO_URL}"
           alt="Nocturna"
           width="160"
           style="display:block;width:160px;max-width:60%;height:auto;margin:0 auto;opacity:0.96;"
         />
       </td>
     </tr>`
  : '';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function parseJsonArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function s(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeFieldsFromRow(row: unknown): FormField[] {
  if (!isRecord(row)) return [];
  const arr = parseJsonArray(row.formFields);
  return arr
    .map((x) => (isRecord(x) ? x : null))
    .filter(Boolean)
    .map((x) => {
      const r = x as Record<string, unknown>;
      return {
        id: s(r.id) || s(r.name) || 'field',
        name: s(r.name),
        label: s(r.label) || s(r.name),
        type: s(r.type) as FieldType,
        required: Boolean(r.required),
        multipleFiles: Boolean(r.multipleFiles) || undefined,
      } satisfies FormField;
    })
    .filter((f) => !!f.name);
}

function safeSocialsFromRow(row: unknown): SocialLink[] {
  if (!isRecord(row)) return [];
  const arr = parseJsonArray(row.socialLinks);
  return arr
    .map((x) => (isRecord(x) ? x : null))
    .filter(Boolean)
    .map((x) => {
      const r = x as Record<string, unknown>;
      return { platform: s(r.platform) as SocialPlatform, url: s(r.url) };
    })
    .filter((x) => !!x.platform && !!x.url);
}

async function filesToAttachments(files: File[]) {
  // Keep this conservative; you can loosen later.
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB each
  const MAX_FILES = 3;

  const picked = files.slice(0, MAX_FILES);
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];

  for (const f of picked) {
    if (!f || !f.name) continue;
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

    // 1) Load config from DB (so required fields + recipient match admin)
    const row = await prisma.homeContact.findUnique({ where: { key: KEY } });

    const recipientEmail =
      (row?.recipientEmail ?? '').trim() ||
      INTERNAL_EMAIL || // fallback to env internal inbox
      (row?.contactEmail ?? '').trim();

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient configured.' }, { status: 500 });
    }

    const fields = safeFieldsFromRow(row ?? {});
    const socials = safeSocialsFromRow(row ?? {});
    const contactEmail = (row?.contactEmail ?? '').trim() || recipientEmail;

    // 2) Read as FormData (THIS is the fix vs JSON.parse)
    const formData = await req.formData();

    // Build key/value payload
    const payload: Record<string, string | string[]> = {};
    const uploaded: Record<string, File[]> = {};

    for (const [key, val] of formData.entries()) {
      if (val instanceof File) {
        if (!uploaded[key]) uploaded[key] = [];
        uploaded[key].push(val);
        continue;
      }

      const v = String(val).trim();
      if (key in payload) {
        const prev = payload[key];
        payload[key] = Array.isArray(prev) ? [...prev, v] : [prev, v];
      } else {
        payload[key] = v;
      }
    }

    // 3) Validate required fields (based on admin config)
    const missing: string[] = [];
    for (const f of fields) {
      if (!f.required) continue;
      const v = payload[f.name];
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0);

      if (empty) missing.push(f.label || f.name);
    }
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // 4) Determine "reply to" email if provided
    const senderName = typeof payload.name === 'string' ? payload.name : '';
    const senderEmail = typeof payload.email === 'string' ? payload.email : '';

    const subject = `New contact message${senderName ? ` from ${senderName}` : ''}`;

    // Render message rows in configured order (fallback to whatever was posted)
    const ordered = fields.length
      ? fields.map((f) => ({ key: f.name, label: f.label || f.name }))
      : Object.keys(payload).map((k) => ({ key: k, label: k }));

    const rowsText: string[] = [];
    const rowsHtml: string[] = [];

    for (const rowDef of ordered) {
      const raw = payload[rowDef.key];
      if (raw === undefined) continue;

      const val = Array.isArray(raw) ? raw.join(', ') : raw;
      if (!String(val).trim()) continue;

      rowsText.push(`${rowDef.label}: ${val}`);
      rowsHtml.push(`
        <tr>
          <td style="padding:4px 0;color:rgba(148,163,184,0.95);vertical-align:top;width:160px;">
            ${escapeHtml(rowDef.label)}
          </td>
          <td style="padding:4px 0;color:#f9fafb;white-space:pre-wrap;">
            ${escapeHtml(val)}
          </td>
        </tr>
      `);
    }

    // Attachments (any file inputs)
    const allFiles = Object.values(uploaded).flat();
    const attachments = await filesToAttachments(allFiles);

    const textBody = ['New contact message', '', ...rowsText].join('\n');

    const htmlBody = `
      <!doctype html>
      <html lang="en">
        <head><meta charSet="utf-8" /><title>${escapeHtml(subject)}</title></head>
        <body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                  style="max-width:720px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;color:#e5e7eb;">
                  ${LOGO_ROW}
                  <tr>
                    <td style="padding-bottom:12px;">
                      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">Nocturna · Contact</div>
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">New contact message</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">A visitor submitted the contact form.</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:10px;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                        style="border-collapse:collapse;background:radial-gradient(circle at top left,#020617,#030712);border-radius:14px;border:1px solid rgba(55,65,81,0.9);overflow:hidden;font-size:13px;">
                        <tr>
                          <td style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:rgba(249,250,251,0.75);border-bottom:1px solid rgba(55,65,81,0.9);">
                            Message details
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 14px 10px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                              ${rowsHtml.join('')}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${
                    socials.length
                      ? `<tr>
                           <td style="padding-top:14px;font-size:12px;color:rgba(148,163,184,0.9);">
                             Social links configured: ${escapeHtml(
                               socials.map((x) => `${x.platform}: ${x.url}`).join(' · ')
                             )}
                           </td>
                         </tr>`
                      : ''
                  }

                  <tr>
                    <td style="padding-top:12px;font-size:11px;color:rgba(148,163,184,0.75);">
                      Reply directly to this email to respond to the sender (if they provided an email).
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // 5) Internal notification
    await transporter.sendMail({
      from: CONTACT_FROM,
      to: recipientEmail,
      replyTo: senderEmail || undefined,
      subject,
      text: textBody,
      html: htmlBody,
      ...(attachments.length ? { attachments } : {}),
    });

    // 6) Auto-reply (only if user provided email)
    if (senderEmail) {
      const thanksSubject = 'Thanks — we got your message (Nocturna)';
      const thanksText = [
        `Hi ${senderName || 'there'},`,
        '',
        'Thanks for reaching out.',
        'We’ve received your message and will get back to you shortly.',
        '',
        '— The Nocturna team',
      ].join('\n');

      const thanksHtml = `
        <!doctype html>
        <html lang="en">
          <head><meta charSet="utf-8" /><title>${escapeHtml(thanksSubject)}</title></head>
          <body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                    style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;">
                    ${LOGO_ROW}
                    <tr>
                      <td>
                        <h1 style="margin:0;font-size:22px;line-height:1.3;">Thanks for your message</h1>
                        <p style="margin:10px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                          Hi ${escapeHtml(senderName || 'there')},<br/>
                          We’ve received your message and will get back to you shortly.
                        </p>
                        <p style="margin:16px 0 0;font-size:13px;color:rgba(148,163,184,0.95);">
                          — The Nocturna team
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
        replyTo: contactEmail, // replies go back to your inbox
        headers: {
          ...(INTERNAL_EMAIL ? { 'List-Unsubscribe': `<mailto:${INTERNAL_EMAIL}>` } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Server error while sending contact.' }, { status: 500 });
  }
}
