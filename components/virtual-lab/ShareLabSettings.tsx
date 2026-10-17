'use client';
import { useState } from 'react';
import { labSettingsHash, type SharedLabSettings } from '@/lib/lab-sharing';
import { trackConversion } from '@/lib/conversion-events';
export default function ShareLabSettings({ value }: { value: SharedLabSettings }) {
  const [notice, setNotice] = useState('');
  async function copy() {
    try {
      const link = new URL('/virtual-lab/demo', window.location.origin);
      link.hash = labSettingsHash(value);
      await navigator.clipboard.writeText(link.toString());
      setNotice('Settings link copied. Recipients need Paid / Enhanced access and must run it themselves.');
      trackConversion('gic_settings_shared', { tool: value.tool });
    } catch { setNotice('Could not copy. Check the settings and clipboard permissions.'); }
  }
  return <div className="text-xs leading-5"><button type="button" onClick={() => void copy()} className="min-h-10 rounded-lg border border-slate-500 px-3 py-2 font-semibold">Copy settings link</button><p role="status" className="mt-2">{notice}</p><p className="mt-1 opacity-75">Only numeric assumptions are shared. Results, files, credentials and approval are excluded.</p></div>;
}
