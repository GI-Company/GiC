import { canonicalJson } from '@/lib/virtual-lab-demo';
export type LedgerArtifact = { id: string; name: string; content: string; sha256: string };
export type LedgerLink = { index: number; artifactId: string; artifactHash: string; previousHash: string; sha256: string };
export type EvidenceLedger = { format: 'gic-evidence-ledger-v1'; artifacts: LedgerArtifact[]; events: LedgerLink[]; root: string };
const GENESIS = '0'.repeat(64);
export async function contentHash(content: string) {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(result), b => b.toString(16).padStart(2, '0')).join('');
}
export async function createEvidenceLedger(entries: unknown[]): Promise<EvidenceLedger> {
  if (entries.length > 200) throw new Error('Maximum 200 evidence entries.');
  const artifacts: LedgerArtifact[] = [], events: LedgerLink[] = [];
  let previousHash = GENESIS;
  for (let i = 0; i < entries.length; i++) {
    const content = canonicalJson(entries[i]);
    if (typeof content !== 'string' || content.length > 100000) throw new Error('Evidence entry is too large.');
    const artifact = { id: 'artifact-' + i, name: 'entry-' + i + '.json', content, sha256: await contentHash(content) };
    artifacts.push(artifact);
    const link = { index: i, artifactId: artifact.id, artifactHash: artifact.sha256, previousHash };
    const sha256 = await contentHash(canonicalJson(link));
    events.push({ ...link, sha256 }); previousHash = sha256;
  }
  return { format: 'gic-evidence-ledger-v1', artifacts, events, root: previousHash };
}
export async function verifyEvidenceLedger(input: unknown): Promise<{ valid: boolean; code: string; message: string }> {
  const fail = (code: string, message: string) => ({ valid: false, code, message });
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('INVALID_FORMAT', 'Expected an evidence ledger object.');
  const bundle = input as EvidenceLedger;
  if (bundle.format !== 'gic-evidence-ledger-v1' || !Array.isArray(bundle.artifacts) || !Array.isArray(bundle.events) || bundle.events.length > 200 || bundle.artifacts.length > 200) return fail('INVALID_FORMAT', 'Unsupported format or entry limit.');
  const artifacts = new Map<string, LedgerArtifact>();
  for (const a of bundle.artifacts) {
    if (!a || typeof a.id !== 'string' || typeof a.name !== 'string' || typeof a.content !== 'string' || a.content.length > 100000 || typeof a.sha256 !== 'string' || artifacts.has(a.id)) return fail('INVALID_FORMAT', 'Invalid or duplicate artifact.');
    if (await contentHash(a.content) !== a.sha256) return fail('HASH_MISMATCH', 'Artifact bytes changed: ' + a.name);
    artifacts.set(a.id, a);
  }
  let previousHash = GENESIS;
  const linked = new Set<string>();
  for (let i = 0; i < bundle.events.length; i++) {
    const e = bundle.events[i];
    if (!e || e.index !== i || e.previousHash !== previousHash) return fail('CHAIN_MISMATCH', 'Hash-chain continuity failed at event ' + i + '.');
    const artifact = artifacts.get(e.artifactId);
    if (!artifact) return fail('MISSING_ARTIFACT', 'Referenced artifact is absent at event ' + i + '.');
    if (linked.has(e.artifactId) || e.artifactHash !== artifact.sha256) return fail('HASH_MISMATCH', 'Event artifact binding failed at event ' + i + '.');
    const { sha256, ...link } = e;
    if (await contentHash(canonicalJson(link)) !== sha256) return fail('CHAIN_MISMATCH', 'Event bytes changed at index ' + i + '.');
    linked.add(e.artifactId); previousHash = sha256;
  }
  if (linked.size !== artifacts.size || previousHash !== bundle.root) return fail('CHAIN_MISMATCH', 'Root or artifact coverage mismatch.');
  return { valid: true, code: 'CHECKSUMS_MATCH', message: 'Artifact hashes and event links match. This unsigned ledger does not authenticate an author, laboratory, instrument, or measurement.' };
}
