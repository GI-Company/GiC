import { DEFAULT_PROPOSAL, LAB_LIMITATIONS, LAB_SOURCE, LAB_VERSION, PARAMS,
  canonicalJson, evidenceBundle, experimentReport, type LabProposal } from '@/lib/virtual-lab-demo';

export const PUBLIC_PRESETS = {
  stimulus: { ...DEFAULT_PROPOSAL, rationale: 'Public fixed stimulus/control comparison; MODEL_ASSUMPTION.' },
  mrna_decay: { parameter: 'mrna_decay', values: [0.1, 0.5, 1], duration: 24, rationale: 'Public fixed mRNA decay comparison; MODEL_ASSUMPTION.' },
  protein_decay: { parameter: 'protein_decay', values: [0.05, 0.1, 0.5], duration: 24, rationale: 'Public fixed protein decay comparison; MODEL_ASSUMPTION.' },
} satisfies Record<string, LabProposal>;
export type PublicPreset = keyof typeof PUBLIC_PRESETS;

async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

export async function publicReferenceReport(preset: PublicPreset) {
  const proposal = PUBLIC_PRESETS[preset];
  const bundle = await evidenceBundle(proposal);
  const content = {
    preset, model: LAB_VERSION, source: LAB_SOURCE, mode: 'SIMULATED', protocol: proposal,
    results: bundle.payload.runs.map(run => ({ value: run.value, unit: PARAMS[proposal.parameter].unit,
      finalMrna: run.finalMrna, finalProtein: run.finalProtein })),
    sha256: bundle.sha256, report: experimentReport(proposal, bundle.payload.runs),
    limitations: LAB_LIMITATIONS, scientificValidation: 'NOT ESTABLISHED',
  };
  return { ...content, reportSha256: await digest(content) };
}

// Traverse only the shallow expected structure; arbitrary nested input is never canonicalized.
function sameShape(value: unknown, expected: unknown): boolean {
  if (typeof expected === 'string') return typeof value === 'string' && value.length <= 2500;
  if (typeof expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (Array.isArray(expected)) return Array.isArray(value) && value.length === expected.length && value.every((v, i) => sameShape(v, expected[i]));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(expected as object);
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === keys.length && keys.every(key => Object.hasOwn(record, key) && sameShape(record[key], (expected as Record<string, unknown>)[key]));
}

export async function verifyPublicReport(preset: PublicPreset, artifact: unknown) {
  const expected = await publicReferenceReport(preset);
  if (!sameShape(artifact, expected)) return null;
  const { reportSha256, ...content } = artifact as typeof expected;
  if (!/^[a-f0-9]{64}$/i.test(reportSha256) || !/^[a-f0-9]{64}$/i.test(content.sha256)) return null;
  const { reportSha256: expectedReportSha256, ...expectedContent } = expected;
  const submittedContentSha256 = await digest(content);
  const digestMatches = submittedContentSha256 === reportSha256.toLowerCase();
  const canonicalMatches = canonicalJson(content) === canonicalJson(expectedContent);
  return {
    preset, matches: digestMatches && canonicalMatches, reportVerified: digestMatches && canonicalMatches,
    digestMatches, canonicalMatches, submittedContentSha256, expectedReportSha256,
    verified: 'COMPLETE FIXED PUBLIC REPORT CONTENT', signed: false,
    scientificValidation: 'NOT ESTABLISHED',
    limitation: 'Checks the supplied JSON report against this server\'s fixed reference. Does not verify text outside it, biological truth, or a digital signature.',
  };
}

const text = { type: 'string', maxLength: 2500 };
export const PUBLIC_REPORT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['preset', 'model', 'source', 'mode', 'protocol', 'results', 'sha256', 'report', 'limitations', 'scientificValidation', 'reportSha256'],
  properties: {
    preset: text, model: text, source: text, mode: text, report: text, limitations: text, scientificValidation: text,
    sha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
    reportSha256: { type: 'string', pattern: '^[a-fA-F0-9]{64}$' },
    protocol: { type: 'object', additionalProperties: false, required: ['parameter', 'values', 'duration', 'rationale'],
      properties: { parameter: text, values: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } }, duration: { type: 'number' }, rationale: text } },
    results: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', additionalProperties: false,
      required: ['value', 'unit', 'finalMrna', 'finalProtein'], properties: {
        value: { type: 'number' }, unit: text, finalMrna: { type: 'number' }, finalProtein: { type: 'number' },
      } } },
  },
};
