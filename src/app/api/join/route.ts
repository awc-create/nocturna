// src/app/api/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transporter, escapeHtml, BOOKING_URL, INTERNAL_EMAIL, EMAIL_LOGO_URL } from '@/lib/mailer';

const JOIN_FROM = process.env.JOIN_FROM_EMAIL || 'Nocturna Artists <jobs@nocturnagency.com>';

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

export async function POST(req: NextRequest) {
  try {
    if (!transporter || !INTERNAL_EMAIL) {
      return NextResponse.json({ error: 'Email transport not configured.' }, { status: 500 });
    }

    const formData = await req.formData();

    const fullName = String(formData.get('full_name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const entries: { key: string; value: string }[] = [];
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string' && value.trim() !== '') {
        entries.push({ key, value: value.trim() });
      }
    }

    const subject = `New artist application from ${fullName}`;

    const textLines: string[] = ['New artist application', ''];
    for (const row of entries) textLines.push(`${row.key}: ${row.value}`);
    const textBody = textLines.join('\n');

    const rowsHtml = entries
      .map(
        (row) => `
        <tr>
          <td style="padding:4px 0;color:rgba(148,163,184,0.95);vertical-align:top;width:160px;">
            ${escapeHtml(row.key)}
          </td>
          <td style="padding:4px 0;color:#f9fafb;white-space:pre-wrap;">
            ${escapeHtml(row.value)}
          </td>
        </tr>`
      )
      .join('');

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
                      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">Nocturna · Artists</div>
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">New artist application</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                        ${escapeHtml(fullName)} has applied to join the roster.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:10px;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                        style="border-collapse:collapse;background:radial-gradient(circle at top left,#020617,#030712);border-radius:14px;border:1px solid rgba(55,65,81,0.9);overflow:hidden;font-size:13px;">
                        <tr>
                          <td style="padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:rgba(249,250,251,0.75);border-bottom:1px solid rgba(55,65,81,0.9);">
                            Application details
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:10px 14px 10px;">
                            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
                              ${rowsHtml}
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:10px;font-size:11px;color:rgba(148,163,184,0.75);">
                      You can reply directly to this email to contact the applicant.
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // ✅ Internal email
    await transporter.sendMail({
      from: JOIN_FROM,
      to: INTERNAL_EMAIL,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    // ✅ Auto-reply
    const thanksSubject = 'Thanks for your interest in joining Nocturna';

    const thanksText = [
      `Hi ${fullName || 'there'},`,
      '',
      'Thanks for sending through your details.',
      'We review every application carefully and will come back to you if we think there’s a fit.',
      '',
      BOOKING_URL ? 'If you’ve been invited to book an intro chat, you can use this link:' : '',
      BOOKING_URL ? BOOKING_URL : '',
      '',
      '— The Nocturna team',
    ]
      .filter(Boolean)
      .join('\n');

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
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">Thanks for your interest</h1>
                      <p style="margin:10px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                        Hi ${escapeHtml(fullName || 'there')},<br/>
                        Thanks for taking the time to apply to join the Nocturna roster.
                      </p>

                      <p style="margin:12px 0 0;font-size:13px;color:rgba(148,163,184,0.95);">
                        We review every application carefully and we’ll be in touch if we think there’s a good fit for our current venues and projects.
                      </p>

                      ${
                        BOOKING_URL
                          ? `<p style="margin:16px 0 0;font-size:13px;color:rgba(148,163,184,0.95);">
                               If we’ve already invited you to book an intro chat, you can choose a time here:
                             </p>
                             <p style="margin:10px 0 0;">
                               <a href="${BOOKING_URL}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#facc6b;color:#020617;font-weight:600;font-size:13px;text-decoration:none;">
                                 Book an intro chat
                               </a>
                             </p>`
                          : ''
                      }

                      <p style="margin:18px 0 0;font-size:13px;color:rgba(148,163,184,0.95);">
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
      from: JOIN_FROM,
      to: email,
      subject: thanksSubject,
      text: thanksText,
      html: thanksHtml,
      replyTo: JOIN_FROM,
      headers: {
        ...(INTERNAL_EMAIL ? { 'List-Unsubscribe': `<mailto:${INTERNAL_EMAIL}>` } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[join] error:', err);
    return NextResponse.json({ error: 'Server error while sending application.' }, { status: 500 });
  }
}
