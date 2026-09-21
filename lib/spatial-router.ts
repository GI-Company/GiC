import { RESEARCH_DOMAINS, RESEARCH_NODES, ResearchDomain } from './research-data';

export interface SpatialRouteState {
  domainId: ResearchDomain | null;
  nodeId: string | null;
  sectionId: string | null;
}

// Canonical URL mappings requested:
// /research/cortex-ms
// /research/bnlm
// /systems/kernos
// /systems/acmk
// /virtual-lab/sensor-node
// /software/quantumology
// /software/ggslots
// /software/resume-builder

export const DOMAIN_URL_PREFIXES: Record<ResearchDomain, string> = {
  machine_learning: '/research',
  virtual_lab: '/virtual-lab',
  systems_research: '/systems',
  shipped_software: '/software',
};

export const URL_PREFIX_TO_DOMAIN: Record<string, ResearchDomain> = {
  research: 'machine_learning',
  'virtual-lab': 'virtual_lab',
  systems: 'systems_research',
  software: 'shipped_software',
};

// Map node IDs to URL slugs (and vice versa)
export const NODE_ID_TO_SLUG: Record<string, string> = {
  tinycoherent: 'tinycoherent',
  'cortex-ms': 'cortex-ms',
  bnlm: 'bnlm',
  cortex: 'cortex',
  'physio-model': 'physiological-model',
  'physiological-model': 'physiological-model',
  'virtual-lab': 'core',
  'sensor-node': 'sensor-node',
  'evidence-vault': 'evidence-vault',
  kernos: 'kernos',
  acmk: 'acmk',
  aetheros: 'aetheros',
  axon: 'axon',
  kb: 'kb',
  quantumology: 'quantumology',
  ggslots: 'ggslots',
  resumebuilder: 'resume-builder',
};

export const SLUG_TO_NODE_ID: Record<string, string> = {
  tinycoherent: 'tinycoherent',
  'cortex-ms': 'cortex-ms',
  bnlm: 'bnlm',
  cortex: 'cortex',
  'physio-model': 'physio-model',
  'physiological-model': 'physio-model',
  core: 'virtual-lab',
  'virtual-lab': 'virtual-lab',
  'sensor-node': 'sensor-node',
  'evidence-vault': 'evidence-vault',
  kernos: 'kernos',
  acmk: 'acmk',
  aetheros: 'aetheros',
  axon: 'axon',
  kb: 'kb',
  quantumology: 'quantumology',
  ggslots: 'ggslots',
  'resume-builder': 'resumebuilder',
  resumebuilder: 'resumebuilder',
};

/**
 * Generate a canonical URL for the given spatial position.
 */
export function getCanonicalUrl(state: SpatialRouteState): string {
  if (!state.domainId && !state.nodeId) {
    return '/';
  }

  const domain = state.domainId || (state.nodeId ? RESEARCH_NODES.find(n => n.id === state.nodeId)?.domain : null);
  if (!domain) return '/';

  const prefix = DOMAIN_URL_PREFIXES[domain] || '/research';

  if (!state.nodeId) {
    return prefix;
  }

  const slug = NODE_ID_TO_SLUG[state.nodeId] || state.nodeId;
  const basePath = `${prefix}/${slug}`;

  if (state.sectionId && state.sectionId !== 'architecture') {
    return `${basePath}?section=${encodeURIComponent(state.sectionId)}`;
  }

  return basePath;
}

/**
 * Parse pathname and query string into SpatialRouteState.
 */
export function parseSpatialUrl(pathname: string, searchParams?: URLSearchParams | string): SpatialRouteState {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);

  const params = typeof searchParams === 'string'
    ? new URLSearchParams(searchParams)
    : searchParams instanceof URLSearchParams
    ? searchParams
    : typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

  const sectionId = params.get('section') || null;

  if (parts.length === 0) {
    return { domainId: null, nodeId: null, sectionId };
  }

  const firstSeg = parts[0];
  const domainId = URL_PREFIX_TO_DOMAIN[firstSeg] || null;

  if (parts.length === 1) {
    return { domainId, nodeId: null, sectionId };
  }

  const secondSeg = parts[1];
  const nodeId = SLUG_TO_NODE_ID[secondSeg] || secondSeg;

  // Verify node exists
  const nodeExists = RESEARCH_NODES.some(n => n.id === nodeId);
  if (nodeExists) {
    const node = RESEARCH_NODES.find(n => n.id === nodeId);
    return {
      domainId: node?.domain || domainId,
      nodeId,
      sectionId,
    };
  }

  return { domainId, nodeId: null, sectionId };
}
