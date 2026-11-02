'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { checkoutAccessToken } from '@/lib/checkout-intent';

type Project = { id: string; instance_id: string; name: string; domain_id: string };
type Experiment = { id: string; label: string; research_question: string; status: string; created_at: string };
type Observation = { observation_id: string; kind: string; epistemic_state: string; artifact_sha256: string };
type Campaign = {
  id: string; state: string; next_step: number; total_steps: number;
  plan_sha256: string; host_status: string; error_code?: string | null;
};
type CampaignDetail = Campaign & {
  plan?: { objective?: string; configs?: unknown[] };
  authorization_expires_at?: number | null;
};
type Page<T> = { offset: number; has_more: boolean } & T;
type ViewState = 'loading' | 'ready' | 'signed-out' | 'denied' | 'unavailable' | 'integrity' | 'revoked';
const ID = /^[A-Za-z0-9_-]{1,100}$/;
const VALID_DIGEST = /^[a-f0-9]{64}$/;
const base = '/api/virtual-lab/research/';
const errorCopy: Record<Exclude<ViewState, 'loading' | 'ready'>, string> = {
  'signed-out': 'Sign in with your GIC account to view private research projects.',
  denied: 'This account does not have the required subscription or project access.',
  unavailable: 'The private research service is not available. Existing website simulations are unaffected.',
  integrity: 'Report integrity could not be verified. Nothing was downloaded.',
  revoked: 'The selected project or record is no longer accessible, or the private service has not enabled it.',
};

class ResearchError extends Error {
  constructor(readonly kind: Exclude<ViewState, 'loading' | 'ready'>) { super(errorCopy[kind]); }
}
function partId(value: string): string {
  if (!ID.test(value)) throw new ResearchError('unavailable');
  return value;
}
function projectPath(project: Project): string {
  return 'instances/' + partId(project.instance_id) + '/projects/' + partId(project.id);
}
function experimentPath(project: Project, experiment: Experiment): string {
  return projectPath(project) + '/experiments/' + partId(experiment.id);
}
function asResearchError(cause: unknown): ResearchError {
  return cause instanceof ResearchError ? cause : new ResearchError('unavailable');
}
function isCancelled(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError';
}
function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Same-origin, exact-byte checked projection. No client-supplied identity, tier, tenant or host. */
async function readResearch<T>(token: string, path: string, signal?: AbortSignal):
  Promise<{ data: T; bytes: ArrayBuffer; digest: string }> {
  const response = await fetch(base + path, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) throw new ResearchError('signed-out');
    if (response.status === 403) throw new ResearchError('denied');
    if (response.status === 404) throw new ResearchError('revoked');
    if (response.status === 502) throw new ResearchError('integrity');
    throw new ResearchError('unavailable');
  }
  const digest = response.headers.get('x-content-sha256') || '';
  if (!response.headers.get('content-type')?.startsWith('application/json') || !VALID_DIGEST.test(digest)) {
    throw new ResearchError('integrity');
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 1024 * 1024 || hex(await crypto.subtle.digest('SHA-256', bytes)) !== digest) {
    throw new ResearchError('integrity');
  }
  try {
    return { data: JSON.parse(new TextDecoder().decode(bytes)) as T, bytes, digest };
  } catch {
    throw new ResearchError('integrity');
  }
}
function safeList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}
function downloadJson(bytes: ArrayBuffer, filename: string) {
  const blob = new Blob([bytes], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
export default function ResearchWorkspace() {
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<ViewState>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectKey, setProjectKey] = useState('');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentId, setExperimentId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [moreExperiments, setMoreExperiments] = useState(false);
  const [moreCampaigns, setMoreCampaigns] = useState(false);
  const [moreObservations, setMoreObservations] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  const reset = useCallback((state: ViewState) => {
    setView(state);
    setToken(null); setProjects([]); setProjectKey('');
    setExperiments([]); setExperimentId(''); setCampaigns([]);
    setCampaignId(''); setCampaignDetail(null); setObservations([]);
    setMoreExperiments(false); setMoreCampaigns(false); setMoreObservations(false);
  }, []);
  const fail = useCallback((cause: unknown) => {
    if (!isCancelled(cause)) reset(asResearchError(cause).kind);
  }, [reset]);

  // Refresh the GIC session; the server independently verifies entitlement and project policy.
  useEffect(() => {
    const controller = new AbortController();
    reset('loading');
    void (async () => {
      try {
        const accessToken = await checkoutAccessToken();
        if (controller.signal.aborted) return;
        if (!accessToken) throw new ResearchError('signed-out');
        const response = await readResearch<{ projects: Project[] }>(accessToken, 'projects', controller.signal);
        if (controller.signal.aborted) return;
        setToken(accessToken);
        setProjects(safeList<Project>(response.data.projects).filter(p => ID.test(p.id) && ID.test(p.instance_id)));
        setView('ready');
      } catch (cause) { if (!controller.signal.aborted) fail(cause); }
    })();
    return () => controller.abort();
  }, [attempt, fail, reset]);

  const selectedProject = projects.find(p => projectKey === p.instance_id + '/' + p.id);
  const selectedExperiment = experiments.find(e => e.id === experimentId);

  useEffect(() => {
    setExperiments([]); setExperimentId(''); setCampaigns([]);
    setObservations([]); setCampaignDetail(null); setCampaignId('');
    setMoreExperiments(false); setMoreCampaigns(false); setMoreObservations(false);
    if (!token || !selectedProject) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await readResearch<Page<{experiments: Experiment[]}>>(
          token, projectPath(selectedProject) + '/experiments?limit=50&offset=0', controller.signal);
        if (!controller.signal.aborted) {
          setExperiments(safeList<Experiment>(response.data.experiments).filter(e => ID.test(e.id)));
          setMoreExperiments(response.data.has_more === true);
        }
      } catch (cause) { if (!controller.signal.aborted) fail(cause); }
    })();
    return () => controller.abort();
  }, [token, projectKey, fail]); // Project membership is always checked server-side.

  useEffect(() => {
    setCampaigns([]); setObservations([]); setCampaignDetail(null); setCampaignId('');
    setMoreCampaigns(false); setMoreObservations(false);
    if (!token || !selectedProject || !selectedExperiment) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const prefix = experimentPath(selectedProject, selectedExperiment);
        const [c, o] = await Promise.all([
          readResearch<Page<{campaigns: Campaign[]}>>(token, prefix + '/campaigns?limit=50&offset=0', controller.signal),
          readResearch<Page<{observations: Observation[]}>>(token, prefix + '/observations?limit=50&offset=0', controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setCampaigns(safeList<Campaign>(c.data.campaigns).filter(item => ID.test(item.id)));
          setObservations(safeList<Observation>(o.data.observations).filter(item => ID.test(item.observation_id)));
          setMoreCampaigns(c.data.has_more === true);
          setMoreObservations(o.data.has_more === true);
        }
      } catch (cause) { if (!controller.signal.aborted) fail(cause); }
    })();
    return () => controller.abort();
  }, [token, projectKey, experimentId, fail]);

  useEffect(() => {
    setCampaignDetail(null);
    if (!token || !selectedProject || !selectedExperiment || !campaignId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const result = await readResearch<CampaignDetail>(
          token, experimentPath(selectedProject, selectedExperiment) + '/campaigns/' + partId(campaignId), controller.signal);
        if (!controller.signal.aborted) setCampaignDetail(result.data);
      } catch (cause) { if (!controller.signal.aborted) fail(cause); }
    })();
    return () => controller.abort();
  }, [token, projectKey, experimentId, campaignId, fail]);

  const loadMore = async (section: 'experiments' | 'campaigns' | 'observations') => {
    if (!token || !selectedProject) return;
    const project = selectedProject;
    const experiment = selectedExperiment;
    setBusy(section); setNotice('');
    try {
      const path = section === 'experiments'
        ? projectPath(project) + '/experiments?offset=' + experiments.length + '&limit=50'
        : experiment
          ? experimentPath(project, experiment) + '/' + section + '?offset=' +
            (section === 'campaigns' ? campaigns.length : observations.length) + '&limit=50'
          : '';
      if (!path) return;
      if (section === 'experiments') {
        const r = await readResearch<Page<{experiments: Experiment[]}>>(token, path);
        setExperiments(value => [...value, ...safeList<Experiment>(r.data.experiments).filter(item => ID.test(item.id))]);
        setMoreExperiments(r.data.has_more === true);
      } else if (section === 'campaigns') {
        const r = await readResearch<Page<{campaigns: Campaign[]}>>(token, path);
        setCampaigns(value => [...value, ...safeList<Campaign>(r.data.campaigns).filter(item => ID.test(item.id))]);
        setMoreCampaigns(r.data.has_more === true);
      } else {
        const r = await readResearch<Page<{observations: Observation[]}>>(token, path);
        setObservations(value => [...value, ...safeList<Observation>(r.data.observations).filter(item => ID.test(item.observation_id))]);
        setMoreObservations(r.data.has_more === true);
      }
    } catch (cause) { fail(cause); } finally { setBusy(''); }
  };
  const getDownload = async (suffix: string, filename: string) => {
    if (!token || !selectedProject || !selectedExperiment) return;
    setBusy(filename); setNotice('');
    try {
      const result = await readResearch<unknown>(token, experimentPath(selectedProject, selectedExperiment) + suffix);
      downloadJson(result.bytes, filename);
      setNotice('Verified exact-byte SHA-256 and downloaded ' + filename + '. This does not establish scientific validity.');
    } catch (cause) { fail(cause); } finally { setBusy(''); }
  };

  return <section className="space-y-6" data-ph-mask="true">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Private research workspace</h2>
        <p className="mt-1 text-sm text-slate-600">Read-only project and experiment records from an explicitly authorized VirtualLab research host.</p>
      </div>
      <button type="button" onClick={() => { setNotice(''); setAttempt(n => n + 1); }}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900">
        Refresh access
      </button>
    </div>

    {view !== 'ready' && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8">
      <h3 className="font-semibold">{view === 'loading' ? 'Checking GIC account and private research access…' : 'Research workspace access'}</h3>
      <p className="mt-2 text-sm text-slate-600">{view === 'loading' ? 'Your projects will only appear after both account and research-service authorization.' : errorCopy[view]}</p>
      {view === 'signed-out' && <Link href="/intent?signin=1&return_to=virtual-lab-research"
        className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Sign in to GIC</Link>}
      {view === 'denied' && <Link href="/virtual-lab/plans" className="mt-4 inline-block font-semibold text-blue-700">View VirtualLab plans</Link>}
    </div>}

    {view === 'ready' && <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label htmlFor="research-project" className="block text-sm font-semibold">Authorized project</label>
        <select id="research-project" value={projectKey} onChange={e => setProjectKey(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm">
          <option value="">Select a project</option>
          {projects.map(p => <option key={p.instance_id + '/' + p.id} value={p.instance_id + '/' + p.id}>{p.name || p.id} ({p.domain_id})</option>)}
        </select>
        {projects.length === 0 && <p className="mt-3 text-sm text-slate-600">No projects are currently shared with your account. A subscription alone does not grant project membership.</p>}
      </div>

      {selectedProject && <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold">Experiments</h3>
        <label htmlFor="research-experiment" className="mt-4 block text-sm font-semibold">Choose an experiment</label>
        <select id="research-experiment" value={experimentId} onChange={e => setExperimentId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm">
          <option value="">Select an experiment</option>
          {experiments.map(e => <option key={e.id} value={e.id}>{e.label || e.id} — {e.status}</option>)}
        </select>
        {experiments.length === 0 && <p className="mt-3 text-sm text-slate-600">No experiments returned for this project.</p>}
        {moreExperiments && <button disabled={Boolean(busy)} onClick={() => void loadMore('experiments')} className="mt-3 text-sm font-semibold text-blue-700">Load more experiments</button>}
      </div>}

      {selectedProject && selectedExperiment && <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">{selectedExperiment.label}</h3>
          <p className="mt-2 text-sm text-slate-600">{selectedExperiment.research_question || 'No research question provided.'}</p>
          <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Status: {selectedExperiment.status}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">Research campaigns</h3>
          <p className="mt-1 text-sm text-slate-600">Inspection only. Campaign creation, start, pause and cancellation are not exposed by this website reader.</p>
          <label htmlFor="research-campaign" className="mt-4 block text-sm font-semibold">Campaign</label>
          <select id="research-campaign" value={campaignId} onChange={e => setCampaignId(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm">
            <option value="">Select a campaign</option>
            {campaigns.map(c => <option value={c.id} key={c.id}>{c.id} — {c.state} ({c.next_step}/{c.total_steps})</option>)}
          </select>
          {campaigns.length === 0 && <p className="mt-3 text-sm text-slate-600">No campaigns returned for this experiment.</p>}
          {moreCampaigns && <button disabled={Boolean(busy)} onClick={() => void loadMore('campaigns')} className="mt-3 text-sm font-semibold text-blue-700">Load more campaigns</button>}
          {campaignDetail && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
            <p><strong>State:</strong> {campaignDetail.state}</p>
            <p><strong>Progress:</strong> {campaignDetail.next_step} of {campaignDetail.total_steps} steps</p>
            <p><strong>Host:</strong> {campaignDetail.host_status}</p>
            <p className="mt-2"><strong>Objective:</strong> {campaignDetail.plan?.objective || 'Not supplied'}</p>
            <p className="mt-2 break-all text-xs"><strong>Approved plan SHA-256:</strong> {campaignDetail.plan_sha256}</p>
            <p className="mt-2 text-xs"><strong>Execution authority:</strong> {campaignDetail.authorization_expires_at
              ? new Date(campaignDetail.authorization_expires_at * 1000).toLocaleString()
              : 'No active execution lease shown'}</p>
            <button type="button" disabled={Boolean(busy)} onClick={() => void getDownload('/campaigns/' + partId(campaignDetail.id) + '/results', 'virtuallab-campaign-results.json')}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Download verified campaign results (SIMULATED)</button>
          </div>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold">Observation reports</h3>
          <p className="mt-1 text-sm text-slate-600">Only MS centroid observations have a report endpoint. Imported records can remain unverified.</p>
          <div className="mt-4 space-y-3">{observations.map(o => <div key={o.observation_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div className="min-w-0"><p className="break-all text-xs font-semibold">{o.observation_id}</p><p className="mt-1 text-xs text-slate-500">{o.kind} · {o.epistemic_state}</p></div>
            {o.kind === 'MS_CENTROID' && <button type="button" disabled={Boolean(busy)}
              onClick={() => void getDownload('/observations/' + partId(o.observation_id) + '/report', 'virtuallab-ms-report.json')}
              className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-800 disabled:opacity-50">Download verified report</button>}
          </div>)}</div>
          {observations.length === 0 && <p className="mt-3 text-sm text-slate-600">No observations returned.</p>}
          {moreObservations && <button disabled={Boolean(busy)} onClick={() => void loadMore('observations')} className="mt-3 text-sm font-semibold text-blue-700">Load more observations</button>}
        </div>
      </div>}
    </>}
    {notice && <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{notice}</p>}
    <p className="text-xs leading-6 text-slate-500">All research views require fresh server-side authorization. Download checksums verify exact bytes, not biological validity. No external instruments, training, campaign writes or desktop file synchronization are enabled here.</p>
  </section>;
}
