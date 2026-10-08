import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_URL } from '@/lib/supabase-public';
import { getResend } from '@/lib/resend';
import { escapeHtml, safeTextToHtml, checkRateLimit } from '@/lib/security';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
    }
    if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Expected a JSON request.' }, { status: 415 });
    }
    if (Number(req.headers.get('content-length') || 0) > 8192) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }

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

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > 8192) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON body');
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const {
      name,
      email,
      subject,
      message,
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

    if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
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

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toAddress = process.env.SUPPORT_TO_EMAIL || 'cory.tortorici@globalintentcompany.space';

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

    // Accept the inquiry into a private, durable queue before contacting Resend.
    // If email delivery fails, the message remains available to the site operator.
    const inquiryId = randomUUID();
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const endpoint = new URL('/rest/v1/gic_contact_inquiries', SUPABASE_URL);
    let stored = false;

    if (serviceKey) {
      // Rate limiting in Postgres works across all serverless instances.
      try {
        const actor = createHash('sha256').update('contact:' + clientIp).digest('hex');
        const rate = await fetch(new URL('/rest/v1/rpc/consume_inference_quota', SUPABASE_URL), {
          method: 'POST',
          headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_actor_key: 'contact:' + actor, p_limit: 5, p_window_seconds: 600 }),
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        if (rate.ok) {
          const payload: unknown = await rate.json();
          const result = Array.isArray(payload) ? payload[0] as { allowed?: boolean; reset_at?: string } | undefined : undefined;
          if (result?.allowed === false) {
            return NextResponse.json({
              error: 'Too many inquiries. Please wait 10 minutes and try again.',
            }, { status: 429 });
          }
        } else {
          console.warn('[Contact intake] Database quota unavailable, using local rate limit:', rate.status);
        }
      } catch {
        console.warn('[Contact intake] Database quota unavailable, using local rate limit.');
      }
    }

    if (serviceKey) {
      try {
        const queued = await fetch(endpoint, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            id: inquiryId,
            sender_name: rawName,
            sender_email: rawEmail,
            subject: rawSubject,
            message: rawMessage,
            delivery_status: 'pending',
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(7000),
        });
        stored = queued.ok;
        if (!queued.ok) console.error('[Contact intake] Supabase write failed:', queued.status);
      } catch (cause) {
        console.error('[Contact intake] Unable to persist inquiry:', cause instanceof Error ? cause.name : 'unknown');
      }
    } else {
      console.error('[Contact intake] Supabase service role key unavailable.');
    }

    let deliveryId: string | undefined;
    let deliveryError = '';
    try {
      const resend = getResend();
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: toAddress,
        replyTo: rawEmail,
        subject: rawSubject || 'Technical Inquiry — Global Intent Company',
        html: formattedHtml,
        text: plainTextContent,
      });
      if (error || !data?.id) {
        deliveryError = error?.name || 'provider_rejected';
        console.error('[Contact delivery] Resend rejected inquiry:', deliveryError);
      } else {
        deliveryId = data.id;
      }
    } catch (cause) {
      deliveryError = cause instanceof Error ? cause.name : 'email_provider_unavailable';
      console.error('[Contact delivery] Resend unavailable:', deliveryError);
    }

    if (stored && serviceKey) {
      try {
        const updateUrl = new URL(endpoint);
        updateUrl.searchParams.set('id', 'eq.' + inquiryId);
        const result = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: 'Bearer ' + serviceKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            delivery_status: deliveryId ? 'sent' : 'pending',
            resend_message_id: deliveryId || null,
            delivery_error: deliveryId ? null : deliveryError.slice(0, 120) || 'not_delivered',
            updated_at: new Date().toISOString(),
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        if (!result.ok) console.error('[Contact intake] Status update failed:', result.status);
      } catch {
        console.error('[Contact intake] Could not update delivery state.');
      }
    }

    if (deliveryId) {
      return NextResponse.json({
        success: true,
        delivered: true,
        status: 'sent',
        id: inquiryId,
        dispatchedAt: new Date().toISOString(),
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (stored) {
      return NextResponse.json({
        success: true,
        delivered: false,
        status: 'queued',
        id: inquiryId,
        message: 'Your inquiry was received and saved, but email delivery is pending.',
      }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({
      success: false,
      error: 'Your inquiry could not be received. Please email cory.tortorici@globalintentcompany.space directly.',
    }, { status: 503 });

  } catch (err: unknown) {
    console.error('[Send Email Exception]:', err);
    return NextResponse.json(
      {
        error: 'We could not receive your inquiry. Please email cory.tortorici@globalintentcompany.space directly.',
      },
      { status: 500 }
    );
  }
}
