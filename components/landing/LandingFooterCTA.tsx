import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Github, Mail } from 'lucide-react';

export default function LandingFooterCTA() {
 return <footer id="contact" className="bg-slate-950 text-slate-300">
   <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
     <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.3fr_0.7fr]">
       <div><p className="text-sm font-semibold text-blue-300">Global Intent Company</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Build AI infrastructure around ownership, verification, and control.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Explore the research, test LooseMouth, inspect the source organization, or contact GIC about the technology.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/research" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950">Explore research <ArrowRight className="h-4 w-4"/></Link><a href="mailto:cory.tortorici@globalintentcompany.space" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"><Mail className="h-4 w-4"/>Contact</a></div></div>
       <div className="grid grid-cols-2 gap-8 text-sm"><div><p className="font-semibold text-white">Technology</p><div className="mt-4 grid gap-3"><Link href="/intent">INTENT</Link><a href="#plmh">PLMH</a><a href="#plmn">PLMN</a><Link href="/virtual-lab">Virtual Lab</Link></div></div><div><p className="font-semibold text-white">Company</p><div className="mt-4 grid gap-3"><Link href="/research">Research</Link><Link href="/systems">Systems</Link><a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2"><Github className="h-4 w-4"/>GitHub</a></div></div></div>
     </div>
     <div className="flex flex-col gap-5 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Image src="/images/global-intent-company-icon.png" alt="" width={28} height={28} className="h-7 w-7 object-contain"/><span>© {new Date().getFullYear()} Global Intent Company</span></div><span>Independent AI &amp; systems engineering</span></div>
   </div>
 </footer>;
}
