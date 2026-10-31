import type { NextRequest } from 'next/server';
import { user, entitlement } from '@/lib/workbench-access';
import { vlabEntitlement, isActiveVirtualLab } from '@/lib/virtual-lab-billing';
import { createResearchReader } from '@/lib/virtual-lab-research-reader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const read = createResearchReader({
    enabled: process.env.VLAB_RESEARCH_READER_ENABLED === 'true',
    serviceOrigin: process.env.VLAB_RESEARCH_SERVICE_ORIGIN || '',
    issuer: process.env.VLAB_RESEARCH_ISSUER || '',
    audience: process.env.VLAB_RESEARCH_AUDIENCE || '',
    keyId: process.env.VLAB_RESEARCH_KEY_ID || '',
    privateKey: process.env.VLAB_RESEARCH_SIGNING_KEY || '',
  }, {
    authenticate: () => user(request),
    accountAccess: async (id) => {
      // Preserve the same qualifying legacy accounts as the existing cockpit.
      const legacy = await entitlement(id);
      if (legacy === 'paid' || legacy === 'enhanced') return true;
      try {
        if (isActiveVirtualLab(await vlabEntitlement(id))) return true;
        return legacy === null ? null : false;
      } catch {
        return null;
      }
    },
    fetch,
  });
  return read(request);
}
