'use client';

import React from 'react';
import { RepositoryArtifact } from '@/lib/research-data';
import { ExternalLink, CheckCircle2, Clock, ShieldCheck, Code2, Globe } from 'lucide-react';

interface SourceArtifactCardProps {
  repository: RepositoryArtifact;
  className?: string;
  featured?: boolean;
}

export default function SourceArtifactCard({
  repository,
  className = '',
  featured = false,
}: SourceArtifactCardProps) {
  const relationshipLabels: Record<string, { label: string; badgeClass: string }> = {
    'primary-source': {
      label: 'Primary Source Code',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70',
    },
    implementation: {
      label: 'System Implementation',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-700/70',
    },
    prototype: {
      label: 'Prototype Artifact',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/70',
    },
    supporting: {
      label: 'Supporting Repository',
      badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/70',
    },
  };

  const rel = relationshipLabels[repository.relationship] || {
    label: repository.relationship,
    badgeClass: 'bg-slate-900 text-slate-300 border-slate-700',
  };

  const isPending = repository.verificationStatus === 'pending_inspection';

  return (
    <div
      className={`rounded-xl border transition-all font-mono ${
        featured
          ? 'bg-[#0f141f] border-[#222c3e] p-5 shadow-lg'
          : 'bg-[#0b0e14] border-[#1a212d] p-4 hover:border-[#273247]'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* GitHub Icon SVG */}
          <svg
            className="w-4 h-4 text-white shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span className="text-[11px] font-bold text-slate-300">GitHub Repository</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] uppercase px-2 py-0.5 rounded border font-semibold ${rel.badgeClass}`}>
            {rel.label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#131923] text-slate-400 border border-[#202736]">
            {repository.visibility === 'private' ? 'Private' : 'Public'}
          </span>
        </div>
      </div>

      {/* Repo Name */}
      <div className="space-y-1 mb-3">
        <div className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="text-slate-500">{repository.owner} /</span>
          <span className="text-emerald-400 font-mono">{repository.name}</span>
        </div>
        {repository.description && (
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {repository.description}
          </p>
        )}
      </div>

      {/* Verification State Banner */}
      <div className="flex items-center justify-between text-[11px] pt-3 border-t border-[#18202c] gap-3">
        <div className="flex items-center gap-1.5 text-slate-500">
          {isPending ? (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400/90 text-[10px]">Classification Pending Inspection</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[10px]">Canonical GI-Company Source</span>
            </>
          )}
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-2">
          {repository.homepageUrl && (
            <a
              href={repository.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-700/60 hover:border-blue-500 transition-colors text-xs font-semibold group"
              aria-label={`Open live deployment for ${repository.name} (opens in new tab)`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>LIVE DEMO</span>
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )}
          <a
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:border-emerald-500 transition-colors text-xs font-semibold group"
            aria-label={`View source code for ${repository.owner}/${repository.name} on GitHub (opens in new tab)`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>VIEW SOURCE</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
