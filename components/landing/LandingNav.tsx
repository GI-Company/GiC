'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X } from 'lucide-react';

const productLinks = [
  { label: 'INTENT / LooseMouth', href: '/intent', details: 'Chat and models' },
  { label: 'Model research', href: '/models', details: 'INTENT architecture' },
  { label: 'BitVision', href: '/bitvision', details: 'Learning systems and Cell' },
  { label: 'Virtual Lab', href: '/virtual-lab', details: 'Scientific computing' },
  { label: 'Private infrastructure', href: '/infrastructure', details: 'PLMH and PLMN' },
];

const primaryLinks = [
  { label: 'Research', href: '/research' },
  { label: 'Technology', href: '/technology' },
  { label: 'Company', href: '/company' },
  { label: 'Systems', href: '/systems' },
  { label: 'Plans', href: '/pricing' },
  { label: 'Shop', href: '/shop' },
];

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const closeMenus = () => { setMobileMenuOpen(false); setProductsOpen(false); };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={closeMenus} className="flex min-w-0 items-center gap-2.5 text-slate-950">
          <Image src="/images/global-intent-company-icon.png" alt="Global Intent Company" width={34} height={34} priority className="h-[34px] w-[34px] shrink-0 object-contain" />
          <span className="truncate text-xs font-bold tracking-[0.08em] sm:text-sm">GLOBAL INTENT COMPANY</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-4 text-sm font-medium text-slate-600 xl:flex">
          <div className="group relative" onMouseLeave={() => setProductsOpen(false)}>
            <button type="button" aria-haspopup="true" aria-expanded={productsOpen} onClick={() => setProductsOpen((open) => !open)} onKeyDown={(event) => { if (event.key === 'Escape') setProductsOpen(false); }} className="flex min-h-11 items-center gap-1 hover:text-slate-950">
              Products <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className={`absolute left-0 top-full w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition ${productsOpen ? 'visible opacity-100' : 'invisible opacity-0'} group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100`}>
              {productLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeMenus} className="block rounded-lg px-3 py-2.5 hover:bg-slate-50">
                  <strong className="block text-slate-900">{item.label}</strong><span className="text-xs text-slate-500">{item.details}</span>
                </Link>
              ))}
            </div>
          </div>
          {primaryLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="whitespace-nowrap hover:text-slate-950">{item.label}</Link>)}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/intent" onClick={closeMenus} className="hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 2xl:inline-flex">Try LooseMouth</Link>
          <Link href="/pricing" onClick={closeMenus} className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Get started</Link>
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="gic-mobile-nav" aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 xl:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="gic-mobile-nav" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg xl:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-blue-700">Products</p>
            {productLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-lg px-3 py-2.5 hover:bg-slate-50">{item.label}</Link>)}
            <div className="my-2 border-t border-slate-200" />
            {primaryLinks.map((item) => <Link key={item.href} href={item.href} onClick={closeMenus} className="rounded-lg px-3 py-2.5 hover:bg-slate-50">{item.label}</Link>)}
            <Link href="/pricing" onClick={closeMenus} className="mt-2 rounded-lg bg-blue-600 px-3 py-2.5 text-center font-semibold text-white">Get started — free or paid</Link><Link href="/contact" onClick={closeMenus} className="rounded-lg px-3 py-2.5 text-center hover:bg-slate-50">Contact</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
