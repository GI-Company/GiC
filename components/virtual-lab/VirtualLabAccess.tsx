'use client';
import { useEffect, useState } from 'react';
import { checkoutAccessToken, AUTH_STORAGE_KEY } from '@/lib/checkout-intent';
import { getPreferences } from '@/lib/loosemouth-persistence';
import { setWorkspaceAnalytics } from '@/lib/workspace-privacy';
import { rememberLabSettings } from '@/lib/lab-sharing';
import { studioTierFromEntitlement, type StudioTier } from '@/lib/virtual-lab-studio';
import VirtualLabStudio from './VirtualLabStudio';

type AccountState = 'checking' | 'guest' | 'free' | 'allowed' | 'error';
export default function VirtualLabAccess({privateReaderEnabled=false}:{
  privateReaderEnabled?:boolean;
}) {
  const [token,setToken] = useState<string|null>(null);
  const [tier,setTier] = useState<StudioTier>('free');
  const [state,setState] = useState<AccountState>('checking');
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);

  useEffect(()=>{
    let active=true;
    try { rememberLabSettings(sessionStorage,window.location.hash); }
    catch { /* Direct shared links still work without session storage. */ }
    setWorkspaceAnalytics(null);
    async function check() {
      try {
        const accessToken = await checkoutAccessToken();
        if (!active) return;
        if (!accessToken) {
          setToken(null); setTier('free'); setState('guest');
          setWorkspaceAnalytics(true); return;
        }
        const response=await fetch('/api/virtual-lab',{
          method:'GET',headers:{Authorization:'Bearer '+accessToken},cache:'no-store',
        });
        if (!active) return;
        if (response.status===401) {
          setToken(null);setTier('free');setState('guest');
          setWorkspaceAnalytics(true);return;
        }
        if (response.status===403) {
          setToken(null);setTier('free');setState('free');
          setWorkspaceAnalytics(true);return;
        }
        if (!response.ok) throw new Error('Your paid VirtualLab access could not be verified. Refresh access to retry.');
        const data=await response.json() as {authorized?:boolean;tier?:string};
        if (data.authorized!==true) throw new Error('The lab subscription response was not authorized.');
        // Privacy is resolved independently of tier. Browser metadata is never
        // used for server-side authorization or research project membership.
        try {
          const stored=JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)||'null');
          const preferences=stored?.user?.id?await getPreferences(accessToken,stored.user.id):null;
          if (active) setWorkspaceAnalytics(preferences?.data_collection_enabled===true);
        } catch {
          if (active) setWorkspaceAnalytics(false);
        }
        if (active) {
          setToken(accessToken);setTier(studioTierFromEntitlement(data.tier));
          setError('');setState('allowed');
        }
      } catch(cause) {
        if(active) {
          setToken(null);setTier('free');setState('error');
          setError(cause instanceof Error?cause.message:'Subscription verification is temporarily unavailable.');
          setWorkspaceAnalytics(false);
        }
      }
    }
    void check();
    return ()=>{active=false;setWorkspaceAnalytics(null);};
  },[attempt]);

  if(state==='checking')return <div role="status" aria-busy="true" className="mx-auto max-w-6xl px-6 py-20 text-center text-sm text-slate-600">
    Checking your GIC session and available research tools…
  </div>;
  return <VirtualLabStudio tier={tier}
    accountState={state} accessToken={token}
    privateReaderEnabled={privateReaderEnabled} accessError={error}/>;
}
