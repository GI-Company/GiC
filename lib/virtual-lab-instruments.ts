
export type Reading = { time:number; value:number; channel:string; unit:string; index:number };
export type InstrumentImport = { format:'CSV'|'JSONL'; readings:Reading[]; rejected:number; channels:string[]; units:string[]; epistemic_state:'UNKNOWN' };
const keys=['value','reading','intensity','signal','voltage','measurement'];
function numeric(row:Record<string,unknown>, names:string[]):number|null {
 for(const key of names){const v=row[key];if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v==='string'&&v.trim()&&Number.isFinite(Number(v)))return Number(v);}
 return null;
}
function parseCSVLine(line:string):string[]{
 const out:string[]=[];let field='',quote=false;
 for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quote&&line[i+1]==='"'){field+='"';i++;}else quote=!quote;}else if(c===','&&!quote){out.push(field.trim());field='';}else field+=c;}
 if(quote)throw new Error('Unterminated quoted CSV field.');out.push(field.trim());return out;
}
export function parseInstrumentText(text:string,filename:string):InstrumentImport{
 if(!text.trim()||text.length>2000000)throw new Error('Select a nonempty data file no larger than 2 MB.');
 if(!/\.(csv|jsonl)$/i.test(filename))throw new Error('Supported formats: CSV or JSONL.');
 const csv=/\.csv$/i.test(filename),lines=text.split(/\r?\n/).filter(Boolean);
 if(lines.length>12001)throw new Error('Maximum 12,000 rows per import.');
 const header=csv?parseCSVLine(lines[0]).map(x=>x.toLowerCase()):[];
 const readings:Reading[]=[];let rejected=0;
 for(let i=csv?1:0;i<lines.length;i++){
  try{
   let data:unknown;
   if(csv){const cols=parseCSVLine(lines[i]);if(cols.length!==header.length){rejected++;continue;}data=Object.fromEntries(header.map((key,j)=>[key,cols[j]]));}
   else data=JSON.parse(lines[i]);
   if(!data||typeof data!=='object'||Array.isArray(data)){rejected++;continue;}
   const row=data as Record<string,unknown>,value=numeric(row,keys);
   if(value===null){rejected++;continue;}
   const time=numeric(row,['time','elapsed_seconds','elapsed','timestamp_seconds','t'])??readings.length;
   readings.push({time,value,index:readings.length,channel:String(row.channel??row.sensor??'default').slice(0,70),unit:String(row.unit??row.units??'unspecified').slice(0,30)});
  }catch{rejected++;}
 }
 if(!readings.length)throw new Error('No valid numeric readings. Include a value or intensity field.');
 return {format:csv?'CSV':'JSONL',readings,rejected,channels:Array.from(new Set(readings.map(r=>r.channel))),units:Array.from(new Set(readings.map(r=>r.unit))),epistemic_state:'UNKNOWN'};
}
export function instrumentStatistics(rows:Reading[]){
 if(!rows.length)throw new Error('No readings.');
 let sum=0,min=Infinity,max=-Infinity;for(const r of rows){sum+=r.value;min=Math.min(min,r.value);max=Math.max(max,r.value);}
 const mean=sum/rows.length;
 return {count:rows.length,min,max,mean,standard_deviation:Math.sqrt(rows.reduce((a,r)=>a+(r.value-mean)**2,0)/rows.length)};
}
