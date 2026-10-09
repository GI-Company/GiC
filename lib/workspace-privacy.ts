// Pending workspace policy is deliberately private until billing and preferences resolve.
let workspaceEnabled: boolean | null = null;
export const PRIVACY_EVENT = 'gic-workspace-privacy';

export function setWorkspaceAnalytics(enabled: boolean | null) {
  workspaceEnabled = enabled;
  if (enabled !== null) {
    try {
      if (enabled) localStorage.removeItem('gic-posthog-opt-out');
      else localStorage.setItem('gic-posthog-opt-out', '1');
    } catch { /* In-memory policy still applies when storage is unavailable. */ }
  }
  window.dispatchEvent(new Event(PRIVACY_EVENT));
}

export function analyticsDecision(): boolean | null {
  if (typeof window === 'undefined') return false;
  if (/^\/intent(?:\/|$)/.test(window.location.pathname) || window.location.pathname === '/virtual-lab/demo') return workspaceEnabled;
  try { return localStorage.getItem('gic-posthog-opt-out') !== '1'; }
  catch { return false; }
}

export function analyticsAllowed() { return analyticsDecision() === true; }
