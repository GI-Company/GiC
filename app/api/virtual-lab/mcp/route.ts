/**
 * Experimental anonymous, read-only MCP endpoint for public reference simulations.
 * No user data, files, instruments, INTENT model or paying account is reachable here.
 *
 * Transport: 2025-11-25 Streamable HTTP JSON responses. The launch gate is off
 * until separately tested with MCP Inspector and a ChatGPT custom plugin.
 */
import { NextRequest, NextResponse } from 'next/server';
import { LAB_LIMITATIONS, LAB_SOURCE, LAB_VERSION, evidenceBundle } from '@/lib/virtual-lab-demo';
import { readPublicMcpBody } from '@/lib/virtual-lab-mcp-body';
import { PUBLIC_PRESETS as presets, PUBLIC_REPORT_SCHEMA, publicReferenceReport,
  verifyPublicReport, type PublicPreset as Preset } from '@/lib/virtual-lab-public-reference';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const VERSION='2025-11-25';
const HEADERS={'Cache-Control':'no-store, no-transform','Vary':'Origin'};
const tools=[
  {name:'describe_free_virtual_lab',title:'Describe VirtualLab Free',description:'Describe the free public numerical simulation and its scientific limits. No login or private project data.',
    annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},
    inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'run_public_reference',title:'Run public reference simulation',description:'Run one of three fixed, deterministic, uncalibrated gene-expression examples; returns numerical summaries and a software checksum. Results are SIMULATED, not measured.',
    annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
    inputSchema:{type:'object',properties:{preset:{type:'string',enum:['stimulus','mrna_decay','protein_decay']}},required:['preset'],additionalProperties:false}},
  {name:'verify_public_reference',title:'Compare canonical preset digest',description:'Compare a supplied digest with the recomputed canonical preset digest. Does not receive or verify the displayed report or supplied numerical results. Use verify_public_report for complete returned report content. Does not validate measurements.',
    annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
    inputSchema:{type:'object',properties:{preset:{type:'string',enum:['stimulus','mrna_decay','protein_decay']},sha256:{type:'string',pattern:'^[a-fA-F0-9]{64}$'}},required:['preset','sha256'],additionalProperties:false}},
  {name:'verify_public_report',title:'Verify supplied public report',description:'Verify the entire artifact returned by run_public_reference, including numerical results and Markdown report. Send that complete JSON object as artifact. Checks its reportSha256 and compares with the recomputed fixed reference. No digital signature or scientific validation.',
    annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false},
    inputSchema:{type:'object',properties:{preset:{type:'string',enum:['stimulus','mrna_decay','protein_decay']},artifact:PUBLIC_REPORT_SCHEMA},required:['preset','artifact'],additionalProperties:false}},
];
const info={
  product:'VirtualLab Free',publicOnly:true,model:LAB_VERSION,source:LAB_SOURCE,
  state:{inputs:'MODEL_ASSUMPTION',outputs:'SIMULATED',scientificValidation:'NOT ESTABLISHED'},
  methods:['Run a fixed RK4 gene-expression reference simulation','Return deterministic summary and report','Compare a canonical preset digest','Verify supplied complete public report content'],
  verification:{canonicalPreset:'verify_public_reference does not inspect supplied report content',completeReport:'verify_public_report checks supplied artifact content and reportSha256 against the fixed reference',digitallySigned:false},
  presets:Object.keys(presets),limitations:LAB_LIMITATIONS,
  website:'https://www.globalintentcompany.space/virtual-lab/free',
  notes:'No private lab experiments or imported BSA datasets are exposed. No instrument access, AI requests, training or arbitrary code.',
};
const json=(obj:unknown,status=200)=>NextResponse.json(obj,{status,headers:HEADERS});
const response=(id:unknown,result:unknown)=>json({jsonrpc:'2.0',id,result});
const rpcError=(id:unknown,code:number,message:string,status=200)=>json({jsonrpc:'2.0',id,error:{code,message}},status);
const toolResult=(payload:unknown)=>({content:[{type:'text',text:JSON.stringify(payload)}],isError:false});
function allowedOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return true;
 return [req.nextUrl.origin,'https://chatgpt.com','https://chat.openai.com'].includes(origin);
}
function isObject(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function presetFrom(value:unknown):Preset|null{
 return typeof value==='string'&&Object.prototype.hasOwnProperty.call(presets,value)?value as Preset:null;
}
function validArgs(args:unknown,fields:string[]):args is Record<string,unknown>{
 return isObject(args)&&Object.keys(args).every(x=>fields.includes(x));
}
export async function GET(){
 return new NextResponse(null,{status:405,headers:{...HEADERS,Allow:'POST'}});
}
export async function POST(req:NextRequest){
 if(!allowedOrigin(req))return json({error:'Origin not allowed'},403);
 if(process.env.VLAB_PUBLIC_MCP_ENABLED!=='true')return json({error:'Public MCP integration not yet enabled'},503);
 if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return json({error:'Expected application/json'},415);
 const accept=req.headers.get('accept')||'';
 if(!accept.includes('application/json')||!accept.includes('text/event-stream'))return json({error:'MCP client must accept JSON and SSE'},406);
 const protocol=req.headers.get('mcp-protocol-version');
 if(protocol&&protocol!==VERSION)return rpcError(null,-32600,'Unsupported MCP protocol version',400);
 const body=await readPublicMcpBody(req);if(!body.ok)return json({error:body.error},body.status);
 let msg:unknown;
 try{msg=JSON.parse(body.text)}catch{return rpcError(null,-32700,'Invalid JSON',400);}
 if(!isObject(msg)||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return rpcError(null,-32600,'Invalid JSON-RPC request',400);
 if(!Object.prototype.hasOwnProperty.call(msg,'id')){
   // A client notification never initiates tool execution.
   if(msg.method==='notifications/initialized')return new NextResponse(null,{status:202,headers:HEADERS});
   return new NextResponse(null,{status:202,headers:HEADERS});
 }
 const id=msg.id;
 if(typeof id!=='number'&&typeof id!=='string'&&id!==null)return rpcError(null,-32600,'Invalid request id',400);
 if(msg.method==='initialize'){
   return response(id,{protocolVersion:VERSION,capabilities:{tools:{listChanged:false}},serverInfo:{name:'global-intent-virtuallab-free',version:'0.1.2'},instructions:'Only fixed public simulated reference data; not actual laboratory measurements. Preset digest comparison does not verify report content. Use verify_public_report with the complete returned artifact to check that content.'});
 }
 if(msg.method==='ping')return response(id,{});
 if(msg.method==='tools/list')return response(id,{tools});
 if(msg.method==='tools/call'){
   if(!isObject(msg.params)||typeof msg.params.name!=='string')return rpcError(id,-32602,'Invalid tool call parameters');
   const name=msg.params.name,args=msg.params.arguments;
   if(name==='describe_free_virtual_lab'){
     if(args!==undefined&&!validArgs(args,[]))return rpcError(id,-32602,'Unexpected tool arguments');
     return response(id,toolResult(info));
   }
   if(name!=='run_public_reference'&&name!=='verify_public_reference'&&name!=='verify_public_report')return rpcError(id,-32601,'Unknown tool');
   const fields=name==='run_public_reference'?['preset']:name==='verify_public_reference'?['preset','sha256']:['preset','artifact'];
   if(!validArgs(args,fields))return rpcError(id,-32602,'Invalid tool arguments');
   const preset=presetFrom(args.preset);if(!preset)return rpcError(id,-32602,'Unknown public preset');
   if(name==='verify_public_report'){
     const verified=await verifyPublicReport(preset,args.artifact);
     return verified?response(id,toolResult(verified)):rpcError(id,-32602,'Invalid public report artifact');
   }
   if(name==='verify_public_reference'&&(typeof args.sha256!=='string'||!/^[a-f0-9]{64}$/i.test(args.sha256)))return rpcError(id,-32602,'Invalid digest');
   if(name==='verify_public_reference'){
     const bundle=await evidenceBundle(presets[preset]);
     return response(id,toolResult({
     preset,sha256:bundle.sha256,matches:bundle.sha256.toLowerCase()===(args.sha256 as string).toLowerCase(),
     verified:'CANONICAL PRESET DIGEST ONLY',reportVerified:false,signed:false,
     limitation:'No report content was supplied. A matching preset digest does not verify displayed text or numerical results.',
     scientificValidation:'NOT ESTABLISHED'
     }));
   }
   return response(id,toolResult(await publicReferenceReport(preset)));
 }
 return rpcError(id,-32601,'Unknown MCP method');
}
