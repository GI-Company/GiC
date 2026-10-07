import { Check, Cloud, Laptop, Network, Server, ShieldCheck, Smartphone } from 'lucide-react';

const stages=['CONFIGURED','DISCOVERED','REACHABLE','PROTOCOL_OK','AUTHENTICATED','MODEL_READY','STREAM_READY'];
const deployment=[
  [Smartphone,'On-device','Phones, laptops and edge devices can run capable local models where hardware permits.'],
  [Server,'On-premises','Workstations and GPU servers can provide larger private model runtimes to authorized devices on a home, lab or office network.'],
  [Network,'Private network','PLM can discover and route across authenticated nodes while keeping compute inside the operator-controlled trust boundary.'],
  [Cloud,'Private cloud','Customer-controlled cloud or VPC compute can extend capacity without making a third-party model API the default execution path.'],
  [Laptop,'Hybrid routing','A future PLM fabric can select local, on-premises or private-cloud compute according to capability, policy and availability.'],
];

export default function PLMNSection() {
  return <section id="plmn" className="border-b border-slate-200 bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
      <div><p className="text-sm font-semibold text-blue-700">PLMN · Access &amp; verification layer</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">A private AI compute fabric across devices, networks, and infrastructure.</h2><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">PLM is designed to extend beyond a model running on one machine. The direction is an operator-controlled fabric where models can execute on-device, on an in-house workstation or GPU server, across an authorized home, lab or office network, or in private cloud infrastructure when additional capacity is required.</p><div className="mt-8 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"/><p className="text-sm leading-6 text-slate-700">The architectural objective is simple: models, compute, network access and data remain under an explicit operator-controlled trust boundary rather than being implicitly delegated to a third-party model API.</p></div></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">{stages.map((stage,i)=><div key={stage} className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 [&+&]:mt-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{i+1}</span><span className="flex-1 font-mono text-xs font-semibold tracking-wide text-slate-700">{stage}</span><Check className="h-4 w-4 text-slate-400"/></div>)}</div>
    </div>
    <div className="mt-14 border-t border-slate-200 pt-10"><p className="text-sm font-semibold text-blue-700">Deployment direction</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-950">One private model layer, multiple places to compute.</h3><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{deployment.map(([Icon,title,text]:any)=><article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-blue-700"/><h4 className="mt-4 font-semibold text-slate-950">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div><p className="mt-8 text-xl font-semibold tracking-[-0.02em] text-slate-950">Your models. Your compute. Your network. Your data.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">This is the PLM roadmap and architectural direction; deployment capabilities vary by component and maturity.</p></div>
  </div></section>;
}
