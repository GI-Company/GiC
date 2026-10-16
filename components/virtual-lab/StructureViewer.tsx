
'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
type CA={id:number; chain:string; p:THREE.Vector3};
function readCA(pdb:string):CA[]{
 const rows:CA[]=[];let selected:string|null=null;const ids=new Set<string>();
 for(const line of pdb.split(/\r?\n/)){
  if(!line.startsWith('ATOM  ')||line.slice(12,16).trim()!=='CA'||![' ','A'].includes(line[16]))continue;
  const chain=line.slice(21,22).trim()||'A';if(selected===null)selected=chain;if(chain!==selected)continue;
  const id=Number(line.slice(22,26)), key=chain+id+line.slice(26,27);
  const p=[Number(line.slice(30,38)),Number(line.slice(38,46)),Number(line.slice(46,54))];
  if(!Number.isInteger(id)||p.some(v=>!Number.isFinite(v))||ids.has(key))continue;
  ids.add(key);rows.push({id,chain,p:new THREE.Vector3(p[0],p[1],p[2])});
 }
 return rows;
}
export default function StructureViewer({accessToken}:{accessToken:string}){
 const mount=useRef<HTMLDivElement>(null);
 const [id,setId]=useState('1U19'),[raw,setRaw]=useState(''),[focus,setFocus]=useState(296),[status,setStatus]=useState('Loading reference coordinates…');
 useEffect(()=>{
  let cancelled=false;setRaw('');setStatus('Fetching experimental reference coordinates…');
  void fetch('/api/virtual-lab/structure?id='+id,{headers:{Authorization:'Bearer '+accessToken},cache:'no-store'})
   .then(async response=>{if(!response.ok)throw new Error((await response.json()).error||'Structure request failed.');return response.text();})
   .then(value=>{if(!cancelled){setRaw(value);setStatus('Reference coordinates loaded.');}})
   .catch(error=>{if(!cancelled)setStatus(error instanceof Error?error.message:'Structure retrieval failed.');});
  return ()=>{cancelled=true;};
 },[accessToken,id]);
 useEffect(()=>{
  if(!raw||!mount.current)return;
  const host=mount.current,ca=readCA(raw);
  if(!ca.length){setStatus('No alpha-carbon coordinates present.');return;}
  const scene=new THREE.Scene();scene.background=new THREE.Color('#09172b');
  const camera=new THREE.PerspectiveCamera(46,1,0.1,2000);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#ffffff','#1b4965',2));
  const light=new THREE.DirectionalLight('#ffffff',1.7);light.position.set(6,7,10);scene.add(light);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
  const bounds=new THREE.Box3().setFromPoints(ca.map(r=>r.p)),center=bounds.getCenter(new THREE.Vector3());
  const root=new THREE.Group();root.position.copy(center).multiplyScalar(-1);scene.add(root);
  const material=new THREE.MeshStandardMaterial({color:'#67d9f4',roughness:0.45}),sphere=new THREE.SphereGeometry(0.43,10,8);
  let segment:THREE.Vector3[]=[],previous:CA|null=null;
  const flush=()=>{if(segment.length>1){const curve=new THREE.CatmullRomCurve3(segment);root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(10,segment.length*3),0.3,7,false),material));}segment=[];};
  for(const r of ca){
   if(previous&&(r.id!==previous.id+1||r.p.distanceTo(previous.p)>6.5))flush();
   segment.push(r.p);const dot=new THREE.Mesh(sphere,material);dot.position.copy(r.p);root.add(dot);previous=r;
  }flush();
  const mark=ca.find(r=>r.id===focus);
  if(mark){const marker=new THREE.Mesh(new THREE.SphereGeometry(1.25,16,12),new THREE.MeshStandardMaterial({color:'#fbbf24',emissive:'#945216',emissiveIntensity:0.35}));marker.position.copy(mark.p);root.add(marker);}
  const extent=bounds.getSize(new THREE.Vector3()).length(),distance=Math.max(28,extent*1.15);
  camera.position.set(distance*.6,distance*.35,distance);controls.target.set(0,0,0);controls.update();
  const resize=()=>{const w=Math.max(host.clientWidth,240),h=Math.max(host.clientHeight,300);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let running=true,frame=0;
  const paint=()=>{if(!running)return;frame=requestAnimationFrame(paint);controls.update();renderer.render(scene,camera);};
  paint();setStatus('Experimental reference · '+ca.length+' resolved Cα coordinates'+(mark?' · selected residue present':' · selected residue unresolved'));
  return ()=>{running=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();if(obj.material!==material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>m.dispose());}}});sphere.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
 },[raw,focus]);
 return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">PDB reference structure viewer</h3><p className="mt-1 text-xs text-slate-600">Real Cα coordinates, not a generated cartoon model.</p></div><label className="text-sm font-semibold">Structure <select className="rounded-md border border-slate-300 p-2" value={id} onChange={e=>setId(e.target.value)}><option value="1U19">Rhodopsin 1U19</option><option value="1F88">Rhodopsin 1F88</option></select></label></header>
  <div role="group" aria-label="Focus residue" className="my-3 flex flex-wrap gap-2">{[23,113,187,296].map(r=><button type="button" key={r} onClick={()=>setFocus(r)} className={'rounded-lg border px-3 py-2 text-xs '+(r===focus?'border-blue-600 bg-blue-600 text-white':'border-slate-300')}>Residue {r}</button>)}</div>
  <div ref={mount} className="h-[340px] w-full overflow-hidden rounded-xl bg-slate-950 sm:h-[480px]" role="img" aria-label={'Interactive 3D alpha-carbon structure for PDB '+id}/>
  <p role="status" className="mt-3 text-xs text-slate-600">{status}</p>
  <p className="mt-2 text-xs leading-5 text-amber-900">These are bovine rhodopsin reference structures. This viewer does not model the human P23H mutation, molecular docking, rescue efficacy or clinical outcomes. Missing residues are never fabricated.</p>
  <a className="mt-2 inline-block text-xs font-semibold text-blue-700 underline" rel="noopener noreferrer" target="_blank" href={'https://www.rcsb.org/structure/'+id}>Open source structure at RCSB</a>
 </section>;
}
