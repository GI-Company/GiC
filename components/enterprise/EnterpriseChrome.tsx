import Image from 'next/image';
import Link from 'next/link';
import { Github, Mail, Menu } from 'lucide-react';

const navigation = [
  { label: 'Technology', href: '/technology' },
  { label: 'Models', href: '/models' },
  { label: 'Research', href: '/research' },
  { label: 'Systems', href: '/systems' },
  { label: 'Virtual Lab', href: '/virtual-lab' },
  { label: 'Company', href: '/company' },
  { label: 'Plans', href: '/pricing' },
  { label: 'Shop', href: '/shop' },
];

export function EnterpriseHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-950">
          <Image src="/images/global-intent-company-icon.png" alt="Global Intent Company" width={34} height={34} className="h-[34px] w-[34px] shrink-0 object-contain" />
          <span className="truncate text-xs font-bold tracking-[0.08em] sm:text-sm">GLOBAL INTENT COMPANY</span>
        </Link>
        <nav aria-label="Main site" className="hidden items-center gap-4 text-xs font-medium text-slate-600 xl:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-slate-950">{item.label}</Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/contact" className="hidden rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:inline-flex">
            Contact
          </Link>
          <details className="group relative xl:hidden">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Menu size={17} /> Menu
            </summary>
            <nav aria-label="Mobile site navigation" className="absolute right-0 top-full z-50 mt-2 grid max-h-[calc(100dvh-86px)] w-56 gap-1 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 text-sm font-medium shadow-xl">
              <Link href="/intent" className="rounded-lg px-3 py-2 hover:bg-slate-50">LooseMouth</Link>
              <Link href="/bitvision" className="rounded-lg px-3 py-2 hover:bg-slate-50">BitVision</Link>
              <Link href="/infrastructure" className="rounded-lg px-3 py-2 hover:bg-slate-50">Private infrastructure</Link>
              {navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 hover:bg-slate-50">{item.label}</Link>)}
              <Link href="/contact" className="rounded-lg bg-slate-950 px-3 py-2 text-white">Contact</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function EnterpriseFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Link href="/" className="font-semibold text-white">Global Intent Company</Link>
          <p className="mt-1 max-w-xl leading-6">Private AI infrastructure, model research, and scientific computing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/technology" className="hover:text-white">Technology</Link>
          <Link href="/company" className="hover:text-white">Company</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Github size={15} /> GitHub</a>
          <a href="mailto:cory.tortorici@globalintentcompany.space" className="inline-flex items-center gap-2 hover:text-white"><Mail size={15} /> Email</a>
        </div>
      </div>
    </footer>
  );
}
