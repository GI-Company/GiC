import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export type ArtifactKind = 'report' | 'applet';
export type AppletFile = { path: string; content: string };
export type LooseMouthArtifact = {
  id: string; user_id: string; conversation_id: string | null; kind: ArtifactKind;
  title: string; prompt: string; content: Record<string, unknown>; version: number;
  created_at: string; updated_at: string;
};

function headers(token: string, extra: Record<string,string> = {}) {
  return { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, ...extra };
}
async function checked<T>(response: Response): Promise<T> {
  if (!response.ok) { const body = await response.text(); throw new Error(body || `Artifact request failed (${response.status}).`); }
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
  return await response.json() as T;
}
export async function listArtifacts(token: string, userId: string) {
  const url = new URL('/rest/v1/loosemouth_artifacts', SUPABASE_URL);
  url.searchParams.set('select','id,user_id,conversation_id,kind,title,prompt,content,version,created_at,updated_at');
  url.searchParams.set('user_id',`eq.${userId}`); url.searchParams.set('order','updated_at.desc'); url.searchParams.set('limit','50');
  return checked<LooseMouthArtifact[]>(await fetch(url,{headers:headers(token),cache:'no-store'}));
}
export async function createArtifact(token:string,userId:string,value:{conversation_id?:string|null;kind:ArtifactKind;title:string;prompt:string;content:Record<string,unknown>}) {
  const url=new URL('/rest/v1/loosemouth_artifacts',SUPABASE_URL);
  const rows=await checked<LooseMouthArtifact[]>(await fetch(url,{method:'POST',headers:headers(token,{'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({user_id:userId,...value})}));
  return rows[0];
}
export async function updateArtifact(token:string,userId:string,id:string,value:{title?:string;prompt?:string;content?:Record<string,unknown>;version?:number}) {
  const url=new URL('/rest/v1/loosemouth_artifacts',SUPABASE_URL); url.searchParams.set('id',`eq.${id}`); url.searchParams.set('user_id',`eq.${userId}`);
  const rows=await checked<LooseMouthArtifact[]>(await fetch(url,{method:'PATCH',headers:headers(token,{'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({...value,updated_at:new Date().toISOString()})}));
  return rows[0];
}
export async function deleteArtifact(token:string,userId:string,id:string) {
  const url=new URL('/rest/v1/loosemouth_artifacts',SUPABASE_URL); url.searchParams.set('id',`eq.${id}`); url.searchParams.set('user_id',`eq.${userId}`);
  await checked<void>(await fetch(url,{method:'DELETE',headers:headers(token,{Prefer:'return=minimal'})}));
}
