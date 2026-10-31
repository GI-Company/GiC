'use client';
import { useState } from 'react';
import { checkoutAccessToken } from '@/lib/checkout-intent';
import Link from 'next/link';

export default function BetaFeedbackForm({version}:{version:string}) {
  const [category,setCategory]=useState('bug'),[details,setDetails]=useState(''),[sending,setSending]=useState(false),[status,setStatus]=useState('');
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setStatus('');setSending(true);
    try {
      const token=await checkoutAccessToken();
      if(!token)throw new Error('Sign in to your GIC account before submitting feedback.');
      const response=await fetch('/api/virtual-lab/feedback',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({release_version:version,category,details})});
      const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Unable to submit feedback.');
      setDetails('');setStatus('Feedback received. Thank you for helping test VirtualLab.');
    } catch(error){setStatus(error instanceof Error?error.message:'Feedback unavailable.');}
    finally{setSending(false);}
  }
  return <form onSubmit={e=>void submit(e)} className="rounded-2xl border border-slate-200 bg-white p-6" data-ph-mask="true">
    <h2 className="text-xl font-semibold">Desktop beta feedback</h2>
    <p className="mt-2 text-sm text-slate-600">Tell us what worked, what failed or what would make the research workstation more useful. Do not include private datasets, patient information, API keys or credentials.</p>
    <label className="mt-5 block text-sm font-medium">Feedback category<select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-3">{['bug','installation','usability','feature'].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</select></label>
    <label className="mt-4 block text-sm font-medium">What happened?<textarea required minLength={15} maxLength={3000} value={details} onChange={e=>setDetails(e.target.value)} className="mt-2 min-h-36 w-full rounded-lg border border-slate-300 p-3" placeholder="Include reproducible steps, the expected behavior and the actual behavior."/></label>
    <p className="mt-2 text-xs text-slate-500">Release: {version}. Feedback is linked to your signed-in GIC account. <Link href="/intent?signin=1" className="underline">Sign in</Link></p>
    <button type="submit" disabled={sending||details.trim().length<15} className="mt-5 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">{sending?'Submitting…':'Submit feedback'}</button>
    {status&&<p role="status" className="mt-4 text-sm text-slate-700">{status}</p>}
  </form>;
}
