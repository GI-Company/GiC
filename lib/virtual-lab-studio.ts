/**
 * Presentation catalog only. Server-side /api/virtual-lab and the private
 * research-service policies remain the authorities for paid operations/data.
 */
export type StudioTier = 'free' | 'researcher' | 'laboratory';
export type StudioSection =
  | 'overview' | 'free' | 'simulation' | 'structure' | 'rhodopsin'
  | 'optics' | 'mass' | 'instrument' | 'notebook'
  | 'projects' | 'laboratory' | 'desktop';
export type StudioAvailability = 'open' | 'upgrade' | 'service-off';

export const studioModules: Array<{
  id: StudioSection; label: string; group: 'START' | 'EXPERIMENT' | 'EVIDENCE' | 'ADVANCED';
  description: string; minimum: StudioTier;
}> = [
  { id: 'overview', label: 'Overview', group: 'START', description: 'Research dashboard and available tools', minimum: 'free' },
  { id: 'free', label: 'Free numerical lab', group: 'START', description: 'Browser-local reference comparison', minimum: 'free' },
  { id: 'simulation', label: 'Simulation & AI', group: 'EXPERIMENT', description: 'Approved RK4 studies and bounded AI proposals', minimum: 'researcher' },
  { id: 'structure', label: 'Multi-scale biology', group: 'EXPERIMENT', description: 'Tissue, cell and reference protein inspection', minimum: 'researcher' },
  { id: 'rhodopsin', label: 'RHO kinetics', group: 'EXPERIMENT', description: 'Four-state assumed numerical model', minimum: 'researcher' },
  { id: 'optics', label: 'Optical sandbox', group: 'EXPERIMENT', description: 'Synthetic optical frames and packets', minimum: 'researcher' },
  { id: 'mass', label: 'Mass spectrometry', group: 'EXPERIMENT', description: 'Calculated precursor isotope envelopes', minimum: 'researcher' },
  { id: 'instrument', label: 'File analysis', group: 'EXPERIMENT', description: 'Local CSV/JSONL numeric inspection', minimum: 'researcher' },
  { id: 'notebook', label: 'Evidence notebook', group: 'EVIDENCE', description: 'Session evidence, notes and SHA-256 exports', minimum: 'researcher' },
  { id: 'projects', label: 'Private projects', group: 'EVIDENCE', description: 'Authorized research service projects and campaign reads', minimum: 'researcher' },
  { id: 'laboratory', label: 'Pilot planner', group: 'ADVANCED', description: 'Local review-ready laboratory protocol draft', minimum: 'laboratory' },
  { id: 'desktop', label: 'Desktop & integration', group: 'ADVANCED', description: 'Native Qt and private service readiness', minimum: 'free' },
];

export const cockpitSections = new Set<StudioSection>([
  'simulation', 'structure', 'rhodopsin', 'optics', 'mass', 'instrument', 'notebook',
]);

export function studioTierFromEntitlement(tier: unknown): StudioTier {
  // Existing GIC paid/enhanced subscriptions retain the original paid cockpit.
  // They do not silently acquire the separate Laboratory subscription.
  return tier === 'laboratory' ? 'laboratory'
    : ['researcher', 'paid', 'enhanced'].includes(String(tier)) ? 'researcher'
    : 'free';
}

export function studioAvailability(tier: StudioTier, section: StudioSection,
  privateReaderEnabled: boolean): StudioAvailability {
  const module = studioModules.find(item => item.id === section);
  if (!module) return 'service-off';
  if (tier === 'free' && module.minimum !== 'free') return 'upgrade';
  if (tier === 'researcher' && module.minimum === 'laboratory') return 'upgrade';
  if (section === 'projects' && !privateReaderEnabled) return 'service-off';
  return 'open';
}
