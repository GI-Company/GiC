import { NextRequest,NextResponse } from 'next/server';
import { user } from '@/lib/workbench-access';
import { vlabEntitlement,isActiveVirtualLab } from '@/lib/virtual-lab-billing';
export const runtime='nodejs';
export async function GET(req:NextRequest){
  const me=await user(req);
  if(!me?.id)return NextResponse.json({authenticated:false,active:false},{status:401,headers:{'Cache-Control':'no-store'}});
  try{
    const row=await vlabEntitlement(me.id);
    return NextResponse.json({authenticated:true,active:isActiveVirtualLab(row),tier:row?.tier||'inactive',status:row?.subscription_status||null,trialEnd:row?.trial_end||null},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Subscription status unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
