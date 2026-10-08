import Link from 'next/link';
import { ArrowRight, Github, Mail } from 'lucide-react';

const links = [
  { label: 'Research', href: '/research' },
  { label: 'Technology', href: '/technology' },
  { label: 'Infrastructure', href: '/infrastructure' },
  { label: 'INTENT models', href: '/models' },
  { label: 'BitVision', href: '/bitvision' },
  { label: 'Virtual Lab', href: '/virtual-lab' },
  { label: 'Systems', href: '/systems' },
  { label: 'Company', href: '/company' },
  { label: 'Plans', href: '/pricing' },
  { label: 'Shop', href: '/shop' },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 py-12 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-9 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Link href="/" className="font-semibold tracking-wide text-white">GLOBAL INTENT COMPANY</Link>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-400">Private AI. Owned infrastructure. Verifiable systems. Research and engineering designed around direct control over models, compute, and data.</p>
            <Link href="/contact" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              Contact GIC <ArrowRight size={16} />
            </Link>
          </div>
          <nav aria-label="Website directory" className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {links.map((item) => <Link key={item.href} href={item.href} className="hover:text-white">{item.label}</Link>)}
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400">
          <p>Independent AI and systems engineering</p>
          <div className="flex flex-wrap gap-5">
            <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white"><Github size={14} /> GitHub</a>
            <a href="mailto:cory.tortorici@globalintentcompany.space" className="inline-flex items-center gap-1.5 hover:text-white"><Mail size={14} /> Direct email</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
