'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BrandLoader from '@/components/BrandLoader';
import { ArrowUp, ArrowRight, Mail, CheckCircle2, AlertCircle, Send, Code2, ExternalLink } from 'lucide-react';

export default function LandingFooterCTA() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: subject || 'Technical Inquiry from Landing Page',
          message,
          website_hp: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to transmit message.');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while sending your message.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  return (
    <footer id="contact" className="bg-[#05070a] border-t border-[#161d2b] pt-20 pb-12 text-slate-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Decision Banner */}
        <div className="p-8 sm:p-12 rounded-xl bg-gradient-to-b from-[#0b0f17] to-[#080b11] border border-[#1e2738] shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
              The Sovereign AI Frontier
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-white tracking-tight leading-tight">
              Own the model. Own the infrastructure. Own the boundary.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed pt-2">
              Explore our verified research engine, examine native C Transformer engines, or initiate a direct technical inquiry regarding private model deployment.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4 font-mono text-xs">
              <a
                href="#the-stack"
                className="px-5 py-2.5 rounded-md bg-white text-slate-950 font-semibold hover:bg-slate-200 transition-colors shadow-sm"
              >
                Explore Technology
              </a>
              <Link
                href="/research"
                className="px-5 py-2.5 rounded-md bg-[#121927] hover:bg-[#1a2337] text-emerald-400 border border-emerald-900/60 hover:border-emerald-700 transition-colors flex items-center gap-2"
              >
                <span>Read the Research</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Direct Technical Inquiry Form */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
              Direct Transmission
            </span>
            <h3 className="text-2xl font-bold font-sans text-white">
              Contact Global Intent Company
            </h3>
            <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
              Have questions regarding our research papers, private model hosting runtimes, or sovereign AI architecture? Transmit a secure inquiry directly to our engineering desk.
            </p>

            <div className="space-y-2 pt-4 border-t border-[#182130] text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <a href="mailto:cory.tortorici@globalintentcompany.space" className="text-slate-300 hover:text-white underline">cory.tortorici@globalintentcompany.space</a>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <a
                  href="https://github.com/GI-Company"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white underline flex items-center gap-1"
                >
                  <span>github.com/GI-Company</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 p-6 rounded-lg bg-[#0a0d15] border border-[#1c2436]">
            {status === 'success' ? (
              <div className="p-6 rounded-md bg-emerald-950/40 border border-emerald-800/80 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white font-sans">Inquiry Transmitted Successfully</h4>
                <p className="text-xs text-slate-300 font-sans">
                  Your inquiry has been safely routed to Global Intent Company engineering. We will follow up via your email address.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="px-4 py-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold transition-colors mt-2"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field (hidden for spam prevention) */}
                <input
                  type="text"
                  name="website_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-[11px] block font-semibold">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Alex Vance"
                      className="w-full px-3 py-2 rounded bg-[#0f1420] border border-[#212c3e] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 text-[11px] block font-semibold">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@domain.org"
                      className="w-full px-3 py-2 rounded bg-[#0f1420] border border-[#212c3e] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 text-[11px] block font-semibold">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Inquiry regarding PLMH runtime integration"
                    className="w-full px-3 py-2 rounded bg-[#0f1420] border border-[#212c3e] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 text-[11px] block font-semibold">
                    Technical Inquiry / Message <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your architecture requirements, questions on TinyCoherent/BNLM, or private deployment needs..."
                    className="w-full px-3 py-2 rounded bg-[#0f1420] border border-[#212c3e] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-colors shadow"
                >
                  {status === 'submitting' ? (
                    <>
                      <BrandLoader label="Sending…" size={24} />
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Technical Transmission</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Global Footer Links & Copyright */}
        <div className="mt-20 pt-8 border-t border-[#161d2b] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-1.5">
              <Image src="/images/global-intent-company-logo.png" alt="Global Intent Company" width={1774} height={887} sizes="(max-width: 640px) 160px, 200px" className="h-auto w-40 sm:w-48" />
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Cory Tortorici</span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link href="/research" className="hover:text-white transition-colors">
              Research Lab
            </Link>
            <Link href="/systems" className="hover:text-white transition-colors">
              Systems
            </Link>
            <Link href="/virtual-lab" className="hover:text-white transition-colors">
              Virtual Lab
            </Link>
            <Link href="/research/log" className="hover:text-white transition-colors">
              Research Log
            </Link>
            <a
              href="https://github.com/GI-Company"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>

          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Global Intent Company. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
