import { ArrowUpRight, Building2, Github, Linkedin, MapPin, UserRound, WalletCards } from 'lucide-react';

export default function CompanyFounderSection() {
  return (
    <section id="company" className="border-b border-slate-200 bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-blue-700">Company</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Founder-led AI research translated into working systems.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Global Intent Company is a founder-led, pre-incorporation AI research and development startup. Current work centers on privately deployable AI systems, custom language models, the INTENT model family, private inference infrastructure, and Virtual Lab for AI-assisted scientific and computational experimentation.
            </p>
            <p className="mt-5 text-base leading-7 text-slate-600">
              AI is core to the company&apos;s products and research: Global Intent Company develops and trains custom model architectures, operates inference infrastructure, and builds the software that connects models to private and scientific workflows rather than relying exclusively on third-party AI APIs.
            </p>
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">Company status</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Pre-incorporation · Bootstrapped and founder-funded · $0 external funding raised · No institutional or lead investor.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><UserRound className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">Founder</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Cory Tortorici leads architecture, implementation, experimentation, and research direction.</p>
              <a href="https://www.linkedin.com/in/cory-tortorici-1843b636a" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"><Linkedin className="h-4 w-4" /> LinkedIn <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><WalletCards className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">Funding</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Bootstrapped and founder-funded. Total external capital raised to date: $0. There is currently no lead VC or institutional investor.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Building2 className="h-5 w-5" /></span>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">Business status &amp; location</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Global Intent Company is currently pre-incorporation, so there is no incorporation date yet. Business correspondence address: 178 Jackson Circle, Cleveland, Georgia 30528, United States.</p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500"><MapPin className="h-3.5 w-3.5" /> Cleveland, Georgia</p>
            </article>
            <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:col-span-2">
              <div className="flex items-center justify-between"><Github className="h-5 w-5" /><ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
              <h3 className="mt-8 text-lg font-semibold">Inspect the source organization</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Public repositories provide source-level provenance for selected research, systems, models, and software.</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
