/**
 * Security & sanitization utilities for public API endpoints
 */

/**
 * Escapes HTML characters to prevent HTML/script injection in email templates
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats multi-line plain text safely into escaped HTML with preserved linebreaks
 */
export function safeTextToHtml(text: string): string {
  return escapeHtml(text).replace(/\r\n|\r|\n/g, '<br/>');
}

/**
 * Basic in-memory sliding window rate limiter
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Checks if an identifier (IP address) has exceeded the rate limit
 * @param identifier Client IP or fingerprint
 * @param maxRequests Maximum allowed requests in the window (default: 5)
 * @param windowMs Time window in milliseconds (default: 10 minutes)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSec: 0,
  };
}
