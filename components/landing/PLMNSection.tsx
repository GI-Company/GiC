import { Check, ShieldCheck } from 'lucide-react';

const stages=['CONFIGURED','DISCOVERED','REACHABLE','PROTOCOL_OK','AUTHENTICATED','MODEL_READY','STREAM_READY'];

export default function PLMNSection() {
  return <section id="plmn" className="border-b border-slate-200 bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div><p className="text-sm font-semibold text-blue-700">PLMN · Access &amp; verification layer</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">A listening port does not mean a model is ready.</h2><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">PLMN models readiness as a lifecycle. A node progresses from configuration through discovery, protocol compatibility, authentication, model readiness, and finally stream readiness.</p><div className="mt-8 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"/><p className="text-sm leading-6 text-slate-700">Health checks, capability discovery, and inference are designed to use the same transport abstraction so diagnostics describe the path that actually serves inference.</p></div></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">{stages.map((stage,i)=><div key={stage} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 [&+&]:mt-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{i+1}</span><span className="flex-1 font-mono text-xs font-semibold tracking-wide text-slate-700">{stage}</span><Check className="h-4 w-4 text-slate-400"/></div>)}</div>
    </div>
  </div></section>;
}
