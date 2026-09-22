import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Returns a lazily initialized Resend client instance.
 * Checks that RESEND_API_KEY exists and is not a placeholder.
 */
export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 're_xxxxxxxxx' || apiKey.trim() === '') {
    throw new Error('RESEND_API_KEY is not configured. Please set your real Resend API key (replacing re_xxxxxxxxx) in your environment settings.');
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}
