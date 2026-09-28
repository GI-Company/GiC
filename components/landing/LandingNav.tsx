'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, X, Shield, Terminal, BookOpen, Layers } from 'lucide-react';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
        scrolled
          ? 'bg-[#07090e]/90 backdrop-blur-md border-b border-[#181f2c]'
          : 'bg-[#07090e]/60 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4-6 Nav Links) — Zone 3 (1-2 Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-100 hover:text-white transition-colors group shrink-0"
        >
          <div className="w-7 h-7 rounded-md bg-[#0f1420] border border-[#232b3e] flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/80 transition-colors">
            <span className="font-mono font-bold text-xs tracking-tight text-emerald-400">GI</span>
          </div>
          <span className="font-mono font-semibold tracking-tight text-sm text-slate-100 group-hover:text-white">
            GLOBAL INTENT COMPANY
          </span>
        </Link>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono text-slate-400">
          <a href="#the-stack" className="hover:text-slate-100 transition-colors">
            Technology
          </a>
          <a href="#intent-models" className="hover:text-slate-100 transition-colors">
            Intent Models
          </a>
          <a href="#plmh" className="hover:text-slate-100 transition-colors">
            PLMH Hub
          </a>
          <a href="#plmn" className="hover:text-slate-100 transition-colors">
            PLMN Node
          </a>
          <Link href="/research" className="hover:text-emerald-400 text-slate-300 transition-colors flex items-center gap-1">
            <span>Research Lab</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
          </Link>
          <a href="#principles" className="hover:text-slate-100 transition-colors">
            Principles
          </a>
          <a href="#company" className="hover:text-slate-100 transition-colors">
            About
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/research"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-md hover:bg-emerald-900/50 hover:border-emerald-700 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Enter Research</span>
          </Link>

          <a
            href="#contact"
            className="px-3.5 py-1.5 text-xs font-mono font-medium text-slate-900 bg-slate-100 rounded-md hover:bg-white hover:shadow transition-colors whitespace-nowrap"
          >
            Contact
          </a>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0d14] border-b border-[#1c2433] px-4 py-4 space-y-3 font-mono text-xs">
          <a
            href="#the-stack"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            Technology &amp; The Stack
          </a>
          <a
            href="#intent-models"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            Intent Model Family
          </a>
          <a
            href="#plmh"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            PLMH — Execution Layer
          </a>
          <a
            href="#plmn"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            PLMN — Node Verification
          </a>
          <Link
            href="/research"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-emerald-400 font-medium"
          >
            Research Lab &amp; Spatial Explorer →
          </Link>
          <Link
            href="/virtual-lab"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-cyan-400 font-medium"
          >
            Virtual Lab / Vestigium (.vlab) →
          </Link>
          <Link
            href="/research/log"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            Chronological Research Log →
          </Link>
          <a
            href="#principles"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            Core Principles
          </a>
          <a
            href="#company"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-300 hover:text-white"
          >
            Company &amp; Founder
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 font-semibold"
          >
            Contact Global Intent Company
          </a>
        </div>
      )}
    </header>
  );
}
