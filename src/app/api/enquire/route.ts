// src/app/api/enquire/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transporter, escapeHtml, INTERNAL_EMAIL, EMAIL_LOGO_URL } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENQUIRE_FROM =
  process.env.ENQUIRE_FROM_EMAIL || 'Essentia Enquiries <enquire@Essentiagency.com>';

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

function pickStr(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function pickFirst(fd: FormData, keys: string[]) {
  for (const k of keys) {
    const v = pickStr(fd, k);
    if (v) return v;
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    if (!transporter || !INTERNAL_EMAIL) {
      return NextResponse.json({ error: 'Email transport not configured.' }, { status: 500 });
    }

    const formData = await req.formData();

    const name = pickFirst(formData, ['contact_name', 'name', 'full_name']);
    const email = pickFirst(formData, ['email']);
    const message = pickFirst(formData, ['message']);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields (name, email, message).' },
        { status: 400 }
      );
    }

    const subject = `New venue / event enquiry from ${name}`;

    const rows: Array<{ key: string; value: string }> = [];
    for (const [k, v] of formData.entries()) {
      if (v instanceof File) continue;
      const s = String(v).trim();
      if (!s) continue;
      rows.push({ key: k, value: s });
    }

    const textBody = ['New Essentia enquiry', '', ...rows.map((r) => `${r.key}: ${r.value}`)].join(
      '\n'
    );

    const rowsHtml = rows
      .map(
        (r) => `
          <tr>
            <td style="padding:4px 0;color:rgba(148,163,184,0.95);width:130px;">
              ${escapeHtml(r.key)}
            </td>
            <td style="padding:4px 0;color:#f9fafb;font-weight:500;white-space:pre-wrap;">
              ${escapeHtml(r.value)}
            </td>
          </tr>
        `
      )
      .join('');

    const htmlBody = `
<!doctype html>
<html lang="en">
<head>
  <meta charSet="utf-8" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;color:#e5e7eb;">
          
          ${LOGO_ROW}

          <tr>
            <td style="padding-bottom:12px;">
              <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">
                Essentia · Enquiry
              </div>
              <h1 style="margin:0;font-size:22px;line-height:1.3;">
                New venue / event enquiry
              </h1>
              <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:rgba(209,213,219,0.9);">
                Someone has submitted the enquiry form on the website.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-top:10px;padding-bottom:10px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                style="border-collapse:collapse;background:radial-gradient(circle at top left,#020617,#030712);border-radius:14px;border:1px solid rgba(55,65,81,0.9);overflow:hidden;">
                
                <tr>
                  <td style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:rgba(249,250,251,0.75);border-bottom:1px solid rgba(55,65,81,0.9);">
                    Enquiry details
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 14px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:13px;">
                      ${rowsHtml}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 14px 12px;">
                    <div style="font-size:12px;color:rgba(148,163,184,0.95);margin-bottom:4px;">
                      Message
                    </div>
                    <div style="white-space:pre-wrap;font-size:13px;line-height:1.5;color:#e5e7eb;background:rgba(15,23,42,0.9);border-radius:10px;padding:10px 11px;border:1px solid rgba(55,65,81,0.9);">
                      ${escapeHtml(message)}
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:10px;font-size:11px;color:rgba(148,163,184,0.75);">
              You can reply directly to this email to contact the enquirer.
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
      from: ENQUIRE_FROM,
      to: INTERNAL_EMAIL,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    const thanksSubject = 'Thanks for your enquiry – Essentia';

    const thanksText = [
      `Hi ${name || 'there'},`,
      '',
      'We’ve received your enquiry about your venue or event and we’ll be in touch shortly.',
      '',
      'We’ll review your details and get back to you as soon as possible.',
      '',
      '— The Essentia team',
    ].join('\n');

    const thanksHtml = `
<!doctype html>
<html lang="en">
<head>
  <meta charSet="utf-8" />
  <title>${escapeHtml(thanksSubject)}</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;">
          
          ${LOGO_ROW}

          <tr>
            <td>
              <h1 style="margin:0;font-size:22px;line-height:1.3;">
                Thank you for your enquiry
              </h1>

              <p style="margin:10px 0 4px;font-size:14px;line-height:1.4;color:rgba(209,213,219,0.95);">
                Hi ${escapeHtml(name || 'there')},
              </p>

              <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(209,213,219,0.9);">
                We’ve received your enquiry about your venue or event and we’ll be in touch shortly.
              </p>

              <p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:rgba(148,163,184,0.95);">
                We’ll review your details and get back to you as soon as possible.
              </p>

              <p style="margin:14px 0 0;font-size:13px;color:rgba(209,213,219,0.95);">
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
      from: ENQUIRE_FROM,
      to: email,
      subject: thanksSubject,
      text: thanksText,
      html: thanksHtml,
      replyTo: ENQUIRE_FROM,
      headers: {
        ...(INTERNAL_EMAIL ? { 'List-Unsubscribe': `<mailto:${INTERNAL_EMAIL}>` } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[enquire] error:', err);
    return NextResponse.json({ error: 'Server error while sending enquiry.' }, { status: 500 });
  }
}
