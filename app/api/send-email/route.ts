import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      subject,
      message,
      to,
      from,
    } = body;

    // Validate email and message for inquiry or direct dispatch
    if (!message && !body.html) {
      return NextResponse.json(
        { error: 'A message body or HTML content is required.' },
        { status: 400 }
      );
    }

    const resend = getResend();

    const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toAddress = to || process.env.SUPPORT_TO_EMAIL || 'support@globalintentcompany.space';
    const emailSubject = subject || 'Technical Inquiry — Global Intent Company';
    const senderEmail = email || 'inquiry@globalintentcompany.space';
    const senderName = name || 'GIC Research Visitor';

    const formattedHtml = body.html || `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0e14; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 8px;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #10b981; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">
            Global Intent Company
          </h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-family: monospace;">
            Direct Technical Inquiry & Transmission
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 100px;">From:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${senderName} &lt;${senderEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Subject:</td>
            <td style="padding: 6px 0; color: #f8fafc;">${emailSubject}</td>
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
          <div style="color: #f1f5f9; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message || ''}</div>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 12px; font-size: 11px; color: #64748b; text-align: center; font-family: monospace;">
          Routed through Resend • Global Intent Company
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      replyTo: senderEmail,
      subject: emailSubject,
      html: formattedHtml,
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
