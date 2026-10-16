import { canonicalJson } from '@/lib/virtual-lab-demo';

export const RHO_LIMITATIONS = 'Illustrative four-state model adapted from the supplied cockpit prototype. All rates and the chaperone coupling are assumptions, not fitted experimental parameters. This does not predict human P23H structure, drug efficacy, cell viability, or clinical outcomes.';
export const RHO_BOUNDS = {
  synthesis: { label: 'Synthesis rate', min: 0.2, max: 3, step: 0.1, unit: 'normalized units/h' },
  defect: { label: 'Assumed folding defect', min: 0, max: 0.95, step: 0.01, unit: 'fraction' },
  chaperone: { label: 'Assumed chaperone effect', min: 0, max: 0.95, step: 0.05, unit: 'fraction' },
  clearance: { label: 'Aggregate clearance rate', min: 0.05, max: 0.8, step: 0.01, unit: '1/h' },
} as const;
export type RhoProtocol = Record<keyof typeof RHO_BOUNDS, number> & { duration: number };
export const RHO_PRESETS: Record<string, { label: string; protocol: RhoProtocol }> = {
  wt: { label: 'Low-defect reference', protocol: { synthesis: 1.2, defect: 0.05, chaperone: 0, clearance: 0.28, duration: 48 } },
  p23h: { label: 'High-defect scenario', protocol: { synthesis: 1.2, defect: 0.82, chaperone: 0, clearance: 0.24, duration: 48 } },
  rescue: { label: 'Chaperone-effect scenario', protocol: { synthesis: 1.2, defect: 0.78, chaperone: 0.75, clearance: 0.34, duration: 48 } },
};
export type RhoPoint = { time: number; nascent: number; aggregate: number; mature: number; stress: number };
export type RhoResult = { protocol: RhoProtocol; points: RhoPoint[]; matureFraction: number; aggregateFraction: number; clearanceHalfLife: number; effectiveDefect: number };
export function validateRhoProtocol(input: unknown): RhoProtocol {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid rhodopsin protocol.');
  const p = input as Record<string, unknown>;
  for (const [key, bound] of Object.entries(RHO_BOUNDS)) {
    const value = p[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < bound.min || value > bound.max) throw new Error(`${bound.label} must be between ${bound.min} and ${bound.max}.`);
  }
  if (typeof p.duration !== 'number' || !Number.isFinite(p.duration) || p.duration < 1 || p.duration > 72) throw new Error('Duration must be between 1 and 72 hours.');
  return { synthesis: p.synthesis as number, defect: p.defect as number, chaperone: p.chaperone as number, clearance: p.clearance as number, duration: p.duration };
}
export function runRhodopsin(input: unknown): RhoResult {
  const protocol = validateRhoProtocol(input), p = protocol;
  const effectiveDefect = p.defect * (1 - 0.72 * p.chaperone);
  const fold = 0.45 * (1 - effectiveDefect), misfold = 0.38 * effectiveDefect;
  const rhs = (y: number[]) => [p.synthesis - (fold + misfold + 0.1 * p.clearance) * y[0], misfold * y[0] - p.clearance * y[1], fold * y[0] - 0.08 * y[2], 0.25 * y[1] - 0.3 * y[3]];
  let y = [1, 0.1, 0.2, 0.05];
  const point = (time: number): RhoPoint => ({ time, nascent: y[0], aggregate: y[1], mature: y[2], stress: y[3] });
  const points = [point(0)], dt = p.duration / 2400;
  for (let i = 1; i <= 2400; i++) {
    const a = rhs(y), b = rhs(y.map((v, j) => v + dt * a[j] / 2));
    const c = rhs(y.map((v, j) => v + dt * b[j] / 2)), d = rhs(y.map((v, j) => v + dt * c[j]));
    y = y.map((v, j) => v + dt * (a[j] + 2 * b[j] + 2 * c[j] + d[j]) / 6);
    if (y.some(v => !Number.isFinite(v) || v < 0)) throw new Error('Invalid solver trajectory.');
    if (i % 10 === 0) points.push(point(i * dt));
  }
  const pool = y[0] + y[1] + y[2];
  return { protocol, points, matureFraction: y[2] / pool, aggregateFraction: y[1] / pool, clearanceHalfLife: Math.LN2 / p.clearance, effectiveDefect };
}
export async function rhoEvidence(input: unknown) {
  const result = runRhodopsin(input);
  const payload = { format: 'gic-rhodopsin-demo-v1', input_state: 'MODEL_ASSUMPTION', output_state: 'SIMULATED', solver: { method: 'RK4', steps: 2400 }, initial: { nascent: 1, aggregate: 0.1, mature: 0.2, stress: 0.05 }, constants: { fold: 0.45, misfold: 0.38, chaperoneCoupling: 0.72, matureDecay: 0.08, stressInput: 0.25, stressDecay: 0.3 }, limitations: RHO_LIMITATIONS, result };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(payload)));
  return { payload, sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('') };
}
