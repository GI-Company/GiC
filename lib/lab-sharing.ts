import { validateRhoProtocol, type RhoProtocol } from '@/lib/virtual-lab-rhodopsin';
import { validateOpticalSettings, type OpticalSettings } from '@/lib/virtual-lab-optics';

export type SharedLabSettings = { tool: 'rho'; settings: RhoProtocol } | { tool: 'optics'; settings: OpticalSettings };
const key = 'gic-lab-share-v1';
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function labSettingsHash(value: SharedLabSettings) {
  const settings = value.tool === 'rho' ? validateRhoProtocol(value.settings) : validateOpticalSettings(value.settings);
  return '#'+new URLSearchParams({ lab: 'v1', tool: value.tool, ...Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, String(v)])) }).toString();
}
export function parseLabSettings(hash: string): SharedLabSettings | null {
  if (!hash || hash.length > 512) return null;
  try {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.get('lab') !== 'v1') return null;
    const tool = params.get('tool');
    const fields = tool === 'rho' ? ['synthesis','defect','chaperone','clearance','duration'] : tool === 'optics' ? ['exposure','laser','gain'] : [];
    if (!fields.length || [...params.keys()].some(k => !['lab','tool',...fields].includes(k) || params.getAll(k).length !== 1)) return null;
    const settings = Object.fromEntries(fields.map(k => [k, params.get(k)?.trim() ? Number(params.get(k)) : NaN]));
    if (tool === 'rho') return { tool, settings: validateRhoProtocol(settings) };
    return { tool: 'optics', settings: validateOpticalSettings(settings) };
  } catch { return null; }
}
export function rememberLabSettings(storage: Store, hash: string, now = Date.now()) {
  const shared = parseLabSettings(hash);
  if (shared) try { storage.setItem(key, JSON.stringify({ hash: labSettingsHash(shared), at: now })); } catch { /* Direct fragment still works. */ }
}
export function takeLabSettings(storage: Store, hash: string, now = Date.now()): SharedLabSettings | null {
  const direct = parseLabSettings(hash);
  try {
    const saved = storage.getItem(key);
    storage.removeItem(key);
    if (direct) return direct;
    if (hash || !saved) return null;
    const item = JSON.parse(saved);
    return typeof item.at === 'number' && now >= item.at && now - item.at <= 600_000 && typeof item.hash === 'string' ? parseLabSettings(item.hash) : null;
  } catch { return direct; }
}
