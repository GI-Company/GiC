/** Campaign inspection is optional; identity, entitlement and integrity failures are not. */
export type ResearchFailureKind = 'signed-out' | 'denied' | 'unavailable' | 'integrity' | 'revoked';

export function campaignReadDisposition(kind: ResearchFailureKind): 'deny' | 'show-observations' {
  return kind === 'revoked' || kind === 'unavailable' ? 'show-observations' : 'deny';
}
