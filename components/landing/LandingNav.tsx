'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X } from 'lucide-react';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <Image src="/images/global-intent-company-icon.png" alt="Global Intent Company" width={34} height={34} priority className="h-8.5 w-8.5 object-contain" />
          <span className="text-sm font-bold tracking-[0.08em]">GLOBAL INTENT COMPANY</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
          <div className="group relative" onMouseLeave={() => setProductsOpen(false)}>
            <button type="button" aria-haspopup="menu" aria-expanded={productsOpen} onClick={() => setProductsOpen((open) => !open)} onKeyDown={(event) => { if (event.key === 'Escape') setProductsOpen(false); }} className="flex items-center gap-1 py-6 hover:text-slate-950">Products <ChevronDown className="h-3.5 w-3.5" /></button>
            <div role="menu" className={`${productsOpen ? 'visible opacity-100' : 'invisible opacity-0'} absolute left-0 top-16 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100`}>
              <Link href="/intent" className="block rounded-lg px-3 py-2.5 hover:bg-slate-50"><strong className="block text-slate-900">INTENT</strong><span className="text-xs text-slate-500">Models &amp; LooseMouth</span></Link>
              <Link href="/virtual-lab" className="block rounded-lg px-3 py-2.5 hover:bg-slate-50"><strong className="block text-slate-900">Virtual Lab</strong><span className="text-xs text-slate-500">Scientific computing</span></Link>
              <a href="#plmn" className="block rounded-lg px-3 py-2.5 hover:bg-slate-50"><strong className="block text-slate-900">PLMN</strong><span className="text-xs text-slate-500">Private model node</span></a>
              <a href="#plmh" className="block rounded-lg px-3 py-2.5 hover:bg-slate-50"><strong className="block text-slate-900">PLMH</strong><span className="text-xs text-slate-500">Private model hub</span></a>
            </div>
          </div>
          <Link href="/research" className="hover:text-slate-950">Research</Link>
          <a href="#the-stack" className="hover:text-slate-950">Technology</a>
          <a href="#company" className="hover:text-slate-950">Company</a>
          <Link href="/systems" className="hover:text-slate-950">Systems</Link>
          <a href="#apparel" className="hover:text-slate-950">Shop</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/intent" className="hidden rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:inline-flex">Try LooseMouth</Link>
          <a href="#contact" className="hidden rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:inline-flex">Contact</a>
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden" aria-label="Toggle navigation">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            <Link href="/intent" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">INTENT / LooseMouth</Link>
            <Link href="/virtual-lab" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">Virtual Lab</Link>
            <Link href="/research" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">Research</Link>
            <a href="#the-stack" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">Technology</a>
            <a href="#company" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">Company</a>
            <a href="#apparel" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">Shop</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="mt-2 rounded-lg bg-slate-950 px-3 py-2.5 text-center font-semibold text-white">Contact</a>
          </div>
        </nav>
      )}
    </header>
  );
}
