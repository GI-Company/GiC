import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';
import { escapeHtml, safeTextToHtml, checkRateLimit } from '@/lib/security';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. IP extraction & rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

    const rateLimit = checkRateLimit(clientIp, 5, 10 * 60 * 1000); // 5 requests per 10 mins
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateLimit.retryAfterSec} seconds before sending another inquiry.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSec),
          },
        }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      subject,
      message,
      to,
      from,
      // Honeypot field for anti-bot protection
      website_hp,
    } = body;

    // 2. Anti-bot Honeypot check: If filled, silently drop to prevent quota draining
    if (website_hp && typeof website_hp === 'string' && website_hp.trim().length > 0) {
      console.warn('[Honeypot Triggered] Spambot detected from IP:', clientIp);
      return NextResponse.json({
        success: true,
        id: 'bot_discarded',
        dispatchedAt: new Date().toISOString(),
      });
    }

    // 3. Input Validation & Bounds
    const rawEmail = typeof email === 'string' ? email.trim() : '';
    const rawMessage = typeof message === 'string' ? message.trim() : '';
    const rawSubject = typeof subject === 'string' ? subject.trim() : '';
    const rawName = typeof name === 'string' ? name.trim() : '';

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!rawMessage || rawMessage.length < 5) {
      return NextResponse.json(
        { error: 'Message must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    if (rawMessage.length > 5000) {
      return NextResponse.json(
        { error: 'Message exceeds maximum allowable length of 5000 characters.' },
        { status: 400 }
      );
    }

    if (rawSubject.length > 200) {
      return NextResponse.json(
        { error: 'Subject exceeds maximum allowable length of 200 characters.' },
        { status: 400 }
      );
    }

    if (rawName.length > 100) {
      return NextResponse.json(
        { error: 'Name exceeds maximum allowable length of 100 characters.' },
        { status: 400 }
      );
    }

    // 4. Sanitization & HTML Escaping
    const safeSenderName = escapeHtml(rawName || 'GIC Research Visitor');
    const safeSenderEmail = escapeHtml(rawEmail);
    const safeEmailSubject = escapeHtml(rawSubject || 'Technical Inquiry — Global Intent Company');
    const safeFormattedMessage = safeTextToHtml(rawMessage);

    const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toAddress = to || process.env.SUPPORT_TO_EMAIL || 'support@globalintentcompany.space';

    const plainTextContent = `
Global Intent Company — Direct Technical Inquiry
------------------------------------------------
From: ${rawName || 'GIC Research Visitor'} (${rawEmail})
Subject: ${rawSubject || 'Technical Inquiry — Global Intent Company'}
Timestamp: ${new Date().toISOString()}

Message:
${rawMessage}

------------------------------------------------
Dispatched via Resend • Global Intent Company
    `.trim();

    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0e14; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 8px;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #10b981; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
            Global Intent Company
          </h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-family: monospace;">
            Direct Technical Inquiry &amp; Transmission
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 100px;">From:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${safeSenderName} &lt;${safeSenderEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Subject:</td>
            <td style="padding: 6px 0; color: #f8fafc;">${safeEmailSubject}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Timestamp:</td>
            <td style="padding: 6px 0; color: #94a3b8; font-family: monospace;">${new Date().toISOString()}</td>
          </tr>
        </table>

        <div style="background-color: #030712; border: 1px solid #1e293b; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace;">
            Transmitted Payload:
          </p>
          <div style="color: #f1f5f9; font-size: 14px; line-height: 1.6;">${safeFormattedMessage}</div>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center; font-family: monospace;">
          Routed through Resend • Global Intent Company
        </div>
      </div>
    `.trim();

    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      replyTo: rawEmail,
      subject: rawSubject || 'Technical Inquiry — Global Intent Company',
      html: formattedHtml,
      text: plainTextContent,
    });

    if (error) {
      console.error('[Resend Error]:', error);
      return NextResponse.json(
        {
          error: error.message || 'Failed to dispatch email via Resend API.',
          details: error,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      recipient: toAddress,
      dispatchedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('[Send Email Exception]:', err);
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
