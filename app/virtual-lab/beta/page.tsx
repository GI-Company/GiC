import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/landing/MarketingShell';
import BetaFeedbackForm from '@/components/virtual-lab/BetaFeedbackForm';

export const metadata:Metadata={title:'VirtualLab Desktop Beta',description:'Download verified VirtualLab macOS beta releases and submit development feedback.',alternates:{canonical:'/virtual-lab/beta'}};
export const dynamic='force-dynamic';
function release(){
  const raw=process.env.VLAB_BETA_DMG_URL||'';
  const sha=process.env.VLAB_BETA_DMG_SHA256||'';
  const version=process.env.VLAB_BETA_VERSION||'Unpublished';
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:' || url.hostname!=='github.com' || !url.pathname.startsWith('/GI-Company/virtual-lab/releases/download/') || !/^[a-f0-9]{64}$/i.test(sha))return null;
    return {url:url.toString(),sha,version};
  }catch{return null;}
}
export default function BetaPage(){
  const artifact=release();
  return <MarketingShell><section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/virtual-lab" className="text-sm font-semibold text-blue-700">← Back to VirtualLab</Link>
    <h1 className="mt-5 text-4xl font-semibold tracking-tight">VirtualLab Desktop Beta</h1>
    <p className="mt-4 max-w-3xl leading-7 text-slate-600">Download the experimental macOS desktop build when an independently tested release is published. The web environment and desktop application share a scientific direction, but feature parity is not yet established.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold">macOS beta installer</h2>
        {artifact?<><p className="mt-2 text-sm text-slate-600">Version {artifact.version} · Apple Silicon package</p><a href={artifact.url} className="mt-5 inline-flex rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white" rel="noopener noreferrer">Download desktop DMG</a><p className="mt-5 break-all font-mono text-xs text-slate-600">SHA-256: {artifact.sha}</p><p className="mt-3 text-sm text-slate-600">After downloading, check the file hash with: <code>shasum -a 256 VirtualLab*.dmg</code>. Ad-hoc signing does not provide Apple notarization.</p></>:<><p className="mt-3 text-sm leading-7 text-slate-600">The installer isn't published yet. Download will be enabled only after a real release URL, version and SHA-256 are configured.</p><span className="mt-5 inline-block rounded-lg bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Download pending verification</span></>}
        <p className="mt-6 text-sm text-slate-600">Beta software is not for clinical diagnosis, instrument control or production laboratory decisions. Keep backups of research projects.</p>
      </article>
      <BetaFeedbackForm version={artifact?.version||'unpublished'}/>
    </div>
  </section></MarketingShell>;
}
