// Browser adaptation of VirtualLab's uncalibrated GeneExpressionModel.
// Source: GI-Company/virtual-lab @ a02bcd1a0f904cd54c163a3fe373df49137c276b.
export const LAB_SOURCE = 'https://github.com/GI-Company/virtual-lab/blob/a02bcd1a0f904cd54c163a3fe373df49137c276b/virtual_lab/models/gene_expression.py';
export const LAB_VERSION = 'gene-expression-browser-rk4-v1';
export const PARAMS = {
  concentration: { label: 'Stimulus concentration', unit: 'µM', min: 0, max: 100, value: 1 },
  mrna_decay: { label: 'mRNA decay', unit: '1/h', min: 0.01, max: 2, value: 0.5 },
  translation: { label: 'Translation rate', unit: '1/h', min: 0.01, max: 10, value: 2 },
  protein_decay: { label: 'Protein decay', unit: '1/h', min: 0.01, max: 2, value: 0.1 },
} as const;
export type SweepParameter = keyof typeof PARAMS;
export type LabProposal = { parameter: SweepParameter; values: number[]; duration: number; rationale: string };
export type LabRun = { value: number; points: { time: number; mrna: number; protein: number }[]; finalMrna: number; finalProtein: number };
export const DEFAULT_PROPOSAL: LabProposal = { parameter: 'concentration', values: [0, 1, 5], duration: 24, rationale: 'Compare a zero-stimulus control with two assumed stimulus levels. Inspect mRNA and protein accumulation under the same assumed rates.' };
export const LAB_LIMITATIONS = 'Generic, uncalibrated model. Rates and stimulus response are assumptions; normalized abundances are not measurements. No named gene, tissue, organism, disease, clinical outcome, feedback, stochastic effects, resource limits or cell division is represented.';

export function validateProposal(input: unknown): LabProposal {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid experiment proposal.');
  const p = input as Record<string, unknown>;
  if (typeof p.parameter !== 'string' || !Object.hasOwn(PARAMS, p.parameter)) throw new Error('Choose a supported sweep parameter.');
  const parameter = p.parameter as SweepParameter, bounds = PARAMS[parameter];
  if (!Array.isArray(p.values) || p.values.length < 2 || p.values.length > 5 || p.values.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < bounds.min || v > bounds.max)) throw new Error(`Use 2–5 values between ${bounds.min} and ${bounds.max} ${bounds.unit}.`);
  if (new Set(p.values).size !== p.values.length) throw new Error('Each sweep value must be distinct.');
  if (typeof p.duration !== 'number' || !Number.isFinite(p.duration) || p.duration < 1 || p.duration > 72) throw new Error('Choose a duration between 1 and 72 hours.');
  return { parameter, values: [...p.values], duration: p.duration, rationale: typeof p.rationale === 'string' ? p.rationale.slice(0, 1200) : 'Operator-defined parameter comparison.' };
}

export function runLabExperiment(input: unknown): LabRun[] {
  const p = validateProposal(input);
  return p.values.map(value => {
    const rates = { transcription: 1, induction: 2, ec50: 1, concentration: 1, mrna_decay: 0.5, translation: 2, protein_decay: 0.1, [p.parameter]: value };
    const stimulus = rates.transcription * (1 + rates.induction * rates.concentration / (rates.ec50 + rates.concentration));
    const rhs = (m: number, protein: number) => [stimulus - rates.mrna_decay * m, rates.translation * m - rates.protein_decay * protein];
    let mrna = 0, protein = 0;
    const points = [{ time: 0, mrna, protein }];
    // 240 sample intervals, ten RK4 substeps each; dt <= .03h.
    const dt = p.duration / 2400;
    for (let i = 1; i <= 2400; i++) {
      const a = rhs(mrna, protein), b = rhs(mrna + dt*a[0]/2, protein + dt*a[1]/2);
      const c = rhs(mrna + dt*b[0]/2, protein + dt*b[1]/2), d = rhs(mrna + dt*c[0], protein + dt*c[1]);
      mrna += dt*(a[0]+2*b[0]+2*c[0]+d[0])/6;
      protein += dt*(a[1]+2*b[1]+2*c[1]+d[1])/6;
      if (!Number.isFinite(mrna) || !Number.isFinite(protein) || mrna < 0 || protein < 0) throw new Error('Solver produced an invalid trajectory.');
      if (i % 10 === 0) points.push({ time: i*dt, mrna, protein });
    }
    return { value, points, finalMrna: mrna, finalProtein: protein };
  });
}

export function experimentReport(proposal: LabProposal, runs: LabRun[]) {
  const param = PARAMS[proposal.parameter];
  return `# Gene-expression comparison\n\n**SIMULATED** · ${proposal.duration} hours · normalized abundance\n\n${proposal.rationale}\n\n| ${param.label} (${param.unit}) | Final mRNA | Final protein |\n| --- | ---: | ---: |\n${runs.map(r => `| ${r.value} | ${r.finalMrna.toFixed(4)} | ${r.finalProtein.toFixed(4)} |`).join('\n')}\n\n## Method and assumptions\n\nJavaScript RK4, 2,400 steps per trajectory. Both states start at zero. Basal transcription 1 normalized unit/h; mRNA decay 0.5/h; translation 2/h; protein decay 0.1/h; induction 2; EC50 1 µM; stimulus 1 µM, except the parameter explicitly swept. All inputs are MODEL_ASSUMPTION.\n\n## Limitations\n\n${LAB_LIMITATIONS}\n\n[Source model](${LAB_SOURCE})\n\nThis is an online adaptation, not a desktop VirtualLab run or a signed .vlab bundle.`;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b, 'en')).map(([k,v]) => JSON.stringify(k)+':'+canonicalJson(v)).join(',') + '}';
  return JSON.stringify(value);
}
export async function evidenceBundle(proposal: LabProposal) {
  const payload = { format: 'gic-browser-lab-demo', version: 1, model: LAB_VERSION, source: LAB_SOURCE, solver: { method: 'RK4', steps: 2400 }, input_state: 'MODEL_ASSUMPTION', output_state: 'SIMULATED', protocol: validateProposal(proposal), limitations: LAB_LIMITATIONS, runs: runLabExperiment(proposal) };
  const bytes = new TextEncoder().encode(canonicalJson(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return { payload, sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('') };
}
