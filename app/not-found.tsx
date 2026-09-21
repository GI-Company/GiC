import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full p-6 rounded-2xl bg-[#0b0e14] border border-[#1b212d] text-center space-y-4">
        <div className="text-emerald-400 text-3xl font-bold">404</div>
        <h1 className="text-lg font-bold text-white">Spatial Coordinate Not Found</h1>
        <p className="text-xs text-slate-400">
          The requested research project or domain does not exist in the Global Intent neural mesh.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 text-emerald-300 text-xs font-bold transition-all"
          >
            Return to Root Intent
          </Link>
        </div>
      </div>
    </div>
  );
}
