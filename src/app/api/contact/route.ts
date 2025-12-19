// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transporter, escapeHtml, BOOKING_URL, INTERNAL_EMAIL, EMAIL_LOGO_URL } from '@/lib/mailer';

const CONTACT_FROM = process.env.CONTACT_FROM_EMAIL || 'Nocturna Support <help@nocturnagency.com>';

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

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const subject = `New contact message from ${name}`;

    const textBody = [
      'New contact message',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Message:',
      message,
    ].join('\n');

    const htmlBody = `
      <!doctype html>
      <html lang="en">
        <head><meta charSet="utf-8" /><title>${escapeHtml(subject)}</title></head>
        <body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#020617;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                  style="max-width:640px;background:#020617;border-radius:18px;border:1px solid rgba(148,163,184,0.5);box-shadow:0 24px 60px rgba(15,23,42,0.9);padding:24px 26px 28px;color:#e5e7eb;">
                  ${LOGO_ROW}
                  <tr>
                    <td style="padding-bottom:12px;">
                      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(148,163,184,0.9);margin-bottom:4px;">Nocturna · Contact</div>
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">New contact message</h1>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p style="margin:6px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                        <strong>${escapeHtml(name)}</strong> has sent a message from the website.
                      </p>
                      <p style="margin:10px 0 0;font-size:13px;">
                        <strong>Email:</strong>
                        <a href="mailto:${escapeHtml(email)}" style="color:#facc6b;text-decoration:none;">${escapeHtml(
                          email
                        )}</a>
                      </p>
                      <div style="margin-top:12px;">
                        <div style="font-size:12px;color:rgba(148,163,184,0.95);margin-bottom:4px;">Message</div>
                        <div style="white-space:pre-wrap;font-size:13px;line-height:1.5;color:#e5e7eb;background:rgba(15,23,42,0.9);border-radius:10px;padding:10px 11px;border:1px solid rgba(55,65,81,0.9);">
                          ${escapeHtml(message)}
                        </div>
                      </div>
                      <p style="margin:14px 0 0;font-size:11px;color:rgba(148,163,184,0.75);">
                        You can reply directly to this email to contact them.
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

    // ✅ Internal notification
    await transporter.sendMail({
      from: CONTACT_FROM,
      to: INTERNAL_EMAIL,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    // ✅ Auto-reply to customer
    const thanksSubject = 'We’ve received your message – Nocturna';

    const thanksText = [
      `Hi ${name || 'there'},`,
      '',
      'Thanks for getting in touch.',
      'We’ve received your message and will get back to you as soon as we can.',
      '',
      BOOKING_URL ? 'If you prefer to talk things through live, you can book a call here:' : '',
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
                      <h1 style="margin:0;font-size:22px;line-height:1.3;">We’re here to help</h1>
                      <p style="margin:10px 0 0;font-size:14px;color:rgba(209,213,219,0.9);">
                        Hi ${escapeHtml(name || 'there')},<br/>
                        We’ve received your message and will get back to you as soon as we can.
                      </p>

                      ${
                        BOOKING_URL
                          ? `<p style="margin:14px 0 0;font-size:14px;color:rgba(209,213,219,0.95);">
                               If you’d prefer to speak directly, you can choose a time for a call:
                             </p>
                             <p style="margin:10px 0 0;">
                               <a href="${BOOKING_URL}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#facc6b;color:#020617;font-weight:600;font-size:13px;text-decoration:none;">
                                 Book a call with Nocturna
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
      from: CONTACT_FROM,
      to: email,
      subject: thanksSubject,
      text: thanksText,
      html: thanksHtml,
      // ✅ If customer replies, it routes back to your support inbox/alias
      replyTo: CONTACT_FROM,
      headers: {
        ...(INTERNAL_EMAIL ? { 'List-Unsubscribe': `<mailto:${INTERNAL_EMAIL}>` } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err);
    return NextResponse.json({ error: 'Server error while sending message.' }, { status: 500 });
  }
}
