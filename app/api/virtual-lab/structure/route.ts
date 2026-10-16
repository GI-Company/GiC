import { NextRequest, NextResponse } from 'next/server';
import { user, entitlement } from '@/lib/workbench-access';

export const runtime = 'nodejs';
const ALLOWED = new Set(['1U19','1F88']);

// The public RCSB structure is a bovine rhodopsin reference, NOT a solved
// human P23H mutant. Keeping the accession allowlisted prevents SSRF.
export async function GET(req:NextRequest) {
  const me=await user(req);
  if (!me?.id) return NextResponse.json({error:'Sign in to access structure coordinates.'},{status:401});
  const tier=await entitlement(me.id);
  if (!tier) return NextResponse.json({error:'Subscription access unavailable.'},{status:503});
  if (tier==='free') return NextResponse.json({error:'Paid or Enhanced access required.'},{status:403});
  const pdb=(req.nextUrl.searchParams.get('id')||'1U19').toUpperCase();
  if (!ALLOWED.has(pdb)) return NextResponse.json({error:'Unsupported curated structure ID.'},{status:400});
  try {
    const result=await fetch('https://files.rcsb.org/download/'+pdb+'.pdb',{
      next:{revalidate:86400},
      signal:AbortSignal.timeout(12000),
      headers:{Accept:'text/plain'},
    });
    if (!result.ok) throw new Error('Structure service is unavailable.');
    const source=await result.text();
    if (source.length>4000000 || !source.includes('\nATOM  ')) throw new Error('Structure data failed validation.');
    return new NextResponse(source,{
      headers:{
        'Content-Type':'text/plain; charset=utf-8',
        'Cache-Control':'private, max-age=0, no-store',
        'X-Source-Accession':pdb,
      },
    });
  } catch {
    return NextResponse.json({error:'Could not retrieve the reference coordinates from RCSB PDB.'},{status:502});
  }
}