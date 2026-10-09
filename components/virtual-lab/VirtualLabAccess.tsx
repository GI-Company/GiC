'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { checkoutAccessToken } from '@/lib/checkout-intent';
import { getPreferences } from '@/lib/loosemouth-persistence';
import { AUTH_STORAGE_KEY } from '@/lib/checkout-intent';
import { setWorkspaceAnalytics } from '@/lib/workspace-privacy';
import VirtualLabWorkbench from './VirtualLabWorkbench';
export default function VirtualLabAccess() {
  const [token,setToken]=useState<string|null>(null),[state,setState]=useState<'checking'|'guest'|'free'|'allowed'|'error'>('checking'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    setWorkspaceAnalytics(null);
    async function check(){
      try{
        const accessToken=await checkoutAccessToken();
        if(!active)return;
        if(!accessToken){setState('guest');setWorkspaceAnalytics(true);return;}
        const response=await fetch('/api/virtual-lab',{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store'});
        if(!active)return;
        if(response.status===401){setState('guest');setWorkspaceAnalytics(true);return;}
        if(response.status===403){setState('free');setWorkspaceAnalytics(true);return;}
        if(!response.ok)throw new Error('Subscription access could not be checked. Try again shortly.');
        const data=await response.json();
        if(data.authorized!==true)throw new Error('Access could not be verified.');
        // Resolve the same paid privacy preference as the general workspace.
        try{const saved=JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)||'null');const preferences=saved?.user?.id?await getPreferences(accessToken,saved.user.id):null;if(active)setWorkspaceAnalytics(preferences?.data_collection_enabled!==false);}catch{if(active)setWorkspaceAnalytics(false);}
        if(active){setToken(accessToken);setState('allowed');}
      }catch(cause){if(active){setState('error');setError(cause instanceof Error?cause.message:'Lab access unavailable.');}}
    }
    void check();return()=>{active=false;setWorkspaceAnalytics(null);};
  },[attempt]);
  if(state==='allowed'&&token)return <VirtualLabWorkbench accessToken={token}/>;
  return <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center" data-ph-mask="true">
    <LockKeyhole className="mx-auto text-blue-600" size={32}/><h2 className="mt-4 text-2xl font-semibold">{state==='checking'?'Checking subscription access…':'Virtual Lab is a paid experience'}</h2>
    <p className="mt-3 text-sm leading-7 text-slate-600">{state==='checking'?'Verifying your account before opening the lab.':state==='error'?error:'An active Paid or Enhanced plan unlocks the online reference experiment, comparison workbench and evidence exports. Free and guest access stays in LooseMouth.'}</p>
    {state!=='checking'&&<div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/intent?signin=1&return_to=virtual-lab-demo" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Sign in to your account</Link><Link href="/pricing#plans" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold">Compare plans</Link><button type="button" onClick={()=>{setState('checking');setAttempt(n=>n+1);}} className="px-3 py-3 text-sm font-semibold text-blue-700">Check access again</button></div>}
  </section>;
}
