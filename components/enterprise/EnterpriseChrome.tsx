import Image from 'next/image';
import Link from 'next/link';
import { Github, Mail } from 'lucide-react';

export function EnterpriseHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <Image src="/images/global-intent-company-icon.png" alt="Global Intent Company" width={34} height={34} className="h-8.5 w-8.5 object-contain" />
          <span className="text-sm font-bold tracking-[0.08em]">GLOBAL INTENT COMPANY</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/intent" className="hover:text-slate-950">INTENT</Link>
          <Link href="/virtual-lab" className="hover:text-slate-950">Virtual Lab</Link>
          <Link href="/research" className="hover:text-slate-950">Research</Link>
          <Link href="/systems" className="hover:text-slate-950">Systems</Link>
          <Link href="/software" className="hover:text-slate-950">Software</Link>
        </nav>
        <a href="mailto:cory.tortorici@globalintentcompany.space" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Contact
        </a>
      </div>
    </header>
  );
}

export function EnterpriseFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-white">Global Intent Company</p>
          <p className="mt-1">Private AI infrastructure, model research, and scientific computing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a href="mailto:cory.tortorici@globalintentcompany.space" className="inline-flex items-center gap-2 hover:text-white">
            <Mail className="h-4 w-4" /> Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
