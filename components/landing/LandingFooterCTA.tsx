'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Github, Mail, Send } from 'lucide-react';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export default function LandingFooterCTA() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === 'sending') return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitState('sending');
    setStatusMessage('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') || ''),
          email: String(data.get('email') || ''),
          subject: String(data.get('subject') || ''),
          message: String(data.get('message') || ''),
          website_hp: String(data.get('website_hp') || ''),
        }),
      });

      const payload = await response.json() as {
        success?: boolean;
        delivered?: boolean;
        status?: 'queued' | 'sent';
        error?: string;
      };
      if (!response.ok || !payload.success || (payload.status !== 'queued' && payload.status !== 'sent')) throw new Error(payload.error || 'Unable to confirm delivery. Please use the direct email link.');

      setSubmitState('sent');
      setStatusMessage(payload.delivered
        ? 'Your inquiry has been emailed successfully.'
        : 'Your inquiry was received and saved. Email delivery is pending; you can also use the direct email link.');
      form.reset();
    } catch (error) {
      setSubmitState('error');
      setStatusMessage(error instanceof Error ? error.message : 'Unable to send your inquiry.');
    }
  }

  return (
    <footer id="contact" className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-14 border-b border-white/10 pb-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-blue-300">Global Intent Company</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Start with the work, then start a conversation.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
              Research collaboration, private AI infrastructure, Virtual Lab, INTENT, technical evaluation, and early-stage company conversations are all welcome.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/research" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Explore research <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:cory.tortorici@globalintentcompany.space" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
                <Mail className="h-4 w-4" /> Email directly
              </a>
            </div>

            <div className="mt-10 border-l border-blue-300/30 pl-5 text-sm leading-7 text-slate-400">
              <p>Direct inbox</p>
              <a href="mailto:cory.tortorici@globalintentcompany.space" className="break-all text-slate-200 hover:text-white">
                cory.tortorici@globalintentcompany.space
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Direct inquiry</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Send a message without leaving the site.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Replies go directly to the email address you provide.
              </p>
            </div>

            <form onSubmit={submitInquiry} className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Name</span>
                <input
                  name="name"
                  type="text"
                  maxLength={100}
                  autoComplete="name"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/70 focus:bg-white/[0.06]"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/70 focus:bg-white/[0.06]"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Subject</span>
                <input
                  name="subject"
                  type="text"
                  maxLength={200}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/70 focus:bg-white/[0.06]"
                  placeholder="What would you like to discuss?"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Message</span>
                <textarea
                  name="message"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={5}
                  className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-300/70 focus:bg-white/[0.06]"
                  placeholder="Tell me what you're working on, evaluating, or interested in."
                />
              </label>

              <input
                type="text"
                name="website_hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
              />

              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={submitState === 'sending'}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {submitState === 'sending' ? 'Sending…' : 'Send inquiry'}
                </button>

                {statusMessage && (
                  <p
                    role={submitState === 'error' ? 'alert' : 'status'}
                    className={`text-sm ${submitState === 'error' ? 'text-amber-200' : 'text-emerald-200'}`}
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="grid gap-8 border-b border-white/10 py-10 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="font-semibold text-white">Models</p>
            <div className="mt-4 grid gap-3">
              <Link href="/intent">INTENT</Link>
              <Link href="/intent">LooseMouth</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Infrastructure</p>
            <div className="mt-4 grid gap-3">
              <a href="#plmh">PLMH</a>
              <a href="#plmn">PLMN</a>
              <Link href="/systems">Systems</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Research</p>
            <div className="mt-4 grid gap-3">
              <Link href="/research">Research index</Link>
              <Link href="/research/log">Research chronology</Link>
              <Link href="/virtual-lab">Virtual Lab</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Company</p>
            <div className="mt-4 grid gap-3">
              <a href="#company">Company overview</a>
              <a href="#vision">Company vision</a>
              <a href="#plans">Plans & pricing</a>
              <a href="#fund-research">Fund the research</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Source</p>
            <div className="mt-4 grid gap-3">
              <a href="https://github.com/GI-Company" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                <Github className="h-4 w-4" /> GitHub
              </a>
              <Link href="/explorer">Technical Explorer</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/global-intent-company-icon.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <span>© {new Date().getFullYear()} Global Intent Company</span>
          </div>
          <span>Independent AI &amp; systems engineering</span>
        </div>
      </div>
    </footer>
  );
}
