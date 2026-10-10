import { getResearchAgent, type ResearchAgentTier } from './research-agent-registry';

/** Deterministic INTENT-R orchestration policy. No LLM router call or hidden provider charges. */
export type IntentRoute = 'intent_r' | 'bitvision' | 'plm';
export type IntentTask = 'reasoning' | 'visual_analysis' | 'infrastructure';
export type RoutingDecision = { agent: IntentRoute; task: IntentTask; reason: string; externalInference: true; requiresConfirmation: boolean };

const VISUAL = /\b(image|picture|photo|screenshot|diagram|visual|pixel|spectrum|spectra|mass spectrometry|bitvision|render|illustration)\b/i;
const INFRA = /\b(plm|private model|self.host|on.prem|network|server|deployment|docker|kubernetes|firewall|encryption|infrastructure)\b/i;
const ACTION = /\b(generate|create|draw|edit|modify|delete|deploy|publish|execute|purchase|send)\b/i;

export function routeIntent(prompt: string, tier: ResearchAgentTier, requestedAgent?: unknown): RoutingDecision | null {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) return null;
  let agent: IntentRoute;
  let reason: string;
  if (requestedAgent !== undefined && requestedAgent !== 'auto') {
    const selected = getResearchAgent(requestedAgent, tier);
    if (!selected) return null;
    agent = selected.id;
    reason = 'Explicit user selection';
  } else if (VISUAL.test(prompt)) {
    agent = 'bitvision'; reason = 'Visual or scientific-image task';
  } else if (INFRA.test(prompt)) {
    agent = 'plm'; reason = 'Infrastructure or private-model task';
  } else {
    agent = 'intent_r'; reason = 'General reasoning or research task';
  }
  if (!getResearchAgent(agent, tier)) return null;
  return { agent, task: agent === 'bitvision' ? 'visual_analysis' : agent === 'plm' ? 'infrastructure' : 'reasoning', reason, externalInference: true, requiresConfirmation: ACTION.test(prompt) };
}
