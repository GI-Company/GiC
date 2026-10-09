import { analyticsDecision, PRIVACY_EVENT } from '@/lib/workspace-privacy';

type ConversionEvent = 'gic_cta_clicked' | 'gic_signup_viewed' | 'gic_auth_submitted' | 'gic_auth_success' | 'gic_email_confirmation_required' | 'gic_auth_failed' | 'gic_plan_selected' | 'gic_checkout_started' | 'gic_checkout_failed' | 'gic_answer_received' | 'gic_subscription_activated';
type Properties = {
  plan?: 'paid' | 'enhanced';
  method?: 'email' | 'google';
  mode?: 'signin' | 'signup';
  placement?: 'home' | 'pricing' | 'workspace' | 'navigation';
  action?: 'try_free' | 'create_account' | 'view_plans';
  access?: 'guest' | 'account';
  first_in_session?: boolean;
  status?: 'active' | 'trialing';
  reason?: 'session_expired' | 'checkout_unavailable' | 'auth_rejected';
};
// Only these non-content fields enter analytics; no prompts, answers, credentials,
// user IDs, email addresses, provider error strings, or checkout session IDs.
const fields = new Set(['plan','method','mode','placement','action','access','first_in_session','status','reason']);
const pending: { name: ConversionEvent; properties: Properties; at: number }[] = [];
let listening = false;

export function flushConversionEvents() {
  const decision = analyticsDecision();
  if (decision === false) { pending.length = 0; return; }
  if (decision !== true || !window.posthog?.capture) return;
  for (const item of pending.splice(0)) {
    if (Date.now() - item.at < 30_000) {
      try { window.posthog.capture(item.name, item.properties); } catch { /* Analytics cannot block signup or checkout. */ }
    }
  }
}

export function trackConversion(name: ConversionEvent, properties: Properties = {}) {
  if (typeof window === 'undefined') return;
  if (!listening) {
    window.addEventListener(PRIVACY_EVENT, flushConversionEvents);
    listening = true;
  }
  if (analyticsDecision() === false) return;
  const safe = Object.fromEntries(Object.entries(properties).filter(([key]) => fields.has(key))) as Properties;
  pending.push({ name, properties: safe, at: Date.now() });
  if (pending.length > 25) pending.shift();
  flushConversionEvents();
}
