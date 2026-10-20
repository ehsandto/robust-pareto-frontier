import fs from 'node:fs';
import crypto from 'node:crypto';
import dns from 'node:dns';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
dns.setDefaultResultOrder('ipv4first');
export const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')):
 Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>canonical(k)+':'+canonical(x[k])).join(',')+'}';
export const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export const digest=x=>sha(canonical(x));
export async function rpc(method,params){
 if(!['eth_chainId','eth_getTransactionByHash','gen_getContractCode','eth_getTransactionCount','sim_getTransactionsForAddress'].includes(method))throw Error('Read-only RPC methods only');
 for(let attempt=0;attempt<3;attempt++)try{
  const r=await fetch('https://studio.genlayer.com/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('HTTP failure');const p=await r.json();if(p.error||p.result==null)throw Error('RPC failure');return p.result;
 }catch{if(attempt===2)throw Error('Read-only RPC unavailable');await new Promise(r=>setTimeout(r,4000*(attempt+1)));}
}
export const client=createClient({chain:studionet});
export const read=(address,functionName,args)=>client.readContract({address,functionName,args});
export async function receipt(hash,expected='SUCCESS',message){
 let tx=await rpc('eth_getTransactionByHash',[hash]);
 const indexed=t=>t.status==='FINALIZED'&&t.result_name&&t.consensus_data?.leader_receipt?.some(x=>x.mode==='leader'&&x.execution_result);
 for(let i=0;!indexed(tx)&&i<30;i++){await new Promise(r=>setTimeout(r,4000));tx=await rpc('eth_getTransactionByHash',[hash]);}
 const leader=tx.consensus_data?.leader_receipt?.find(x=>x.mode==='leader');
 const raw=leader?.genvm_result?.stderr||leader?.result;
 const decoded=typeof raw!=='string'?'':(/^[A-Za-z0-9+/]*={0,2}$/.test(raw)&&raw.length%4===0?Buffer.from(raw,'base64').toString('utf8'):raw);
 const result={hash,address:tx.to_address??tx.to,status:tx.status,execution:leader?.execution_result,consensus:tx.result_name,
  ...(message?{expected_error_matched:decoded.includes(message)}:{})};
 if(tx.status!=='FINALIZED'||leader?.execution_result!==expected||tx.result_name!=='MAJORITY_AGREE'||(message&&!decoded.includes(message)))throw Error('Receipt unverified');
 return result;
}
export async function source(address){
 const norm=x=>x.replace(/\r\n/g,'\n').trimEnd()+'\n';
 const actual=norm(Buffer.from(await rpc('gen_getContractCode',[address]),'base64').toString('utf8'));
 if(actual!==norm(fs.readFileSync('contracts/RobustParetoFrontier.py','utf8')))throw Error('Source mismatch');
 return {address,source_match:true,sha256:sha(actual)};
}
// Independent oracle: enumerate endpoint completions and intersect/union the
// actual point frontiers, rather than using best/worst interval comparisons.
export function endpointFrontier(boxes,objectives){
 const n=boxes.length,m=objectives.length,big=1+Math.max(1,...boxes.flat().flatMap(x=>[x.low,x.high??0]));
 const domains=boxes.flat().map(x=>[...new Set([x.low,x.high??big])]);
 const point=Array(n*m).fill(0),certain=new Set(Array.from({length:n},(_,i)=>i)),possible=new Set();
 const certainBy=Array.from({length:n},()=>Array(n).fill(true));
 function visit(k){
  if(k<point.length){for(const value of domains[k]){point[k]=value;visit(k+1);}return;}
  const dominated=Array(n).fill(false);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j){
   let noWorse=true,strict=false;
   for(let d=0;d<m;d++){
    const a=point[j*m+d],b=point[i*m+d],delta=objectives[d].direction==='MIN'?a-b:b-a;
    if(delta>0)noWorse=false;if(delta<0)strict=true;
   }
   const beats=noWorse&&strict;certainBy[i][j]&&=beats;if(beats)dominated[i]=true;
  }
  for(let i=0;i<n;i++)if(dominated[i])certain.delete(i);else possible.add(i);
 }
 visit(0);
 const certain_frontier=[...certain].sort((a,b)=>a-b),possible_frontier=[...possible].sort((a,b)=>a-b),certainly_dominated=[];
 for(let i=0;i<n;i++)if(!possible.has(i)){
  const witness=certainBy[i].findIndex((v,j)=>v&&j!==i);if(witness<0)throw Error('Missing certain-dominance witness');
  certainly_dominated.push({index:i,witness});
 }
 return {certain_frontier,possible_frontier,certainly_dominated,ambiguous_membership:possible_frontier.filter(i=>!certain.has(i)),
  membership_determined:canonical(certain_frontier)===canonical(possible_frontier),published_measurements_only:true,
  assumption:'independent_nonnegative_interval_completions'};
}
function rangesFromReport(report,objectives){
 const empty=objectives.map(obj=>({low:0,high:null,known:false,matched_rows:[],reason:'MISSING',unit:obj.unit}));
 if(report.document_status!=='READY'){
  if(canonical(report.matrix)!==canonical(objectives.map(()=>[])))throw Error('Failed source mapping');
  return empty;
 }
 const doc=JSON.parse(report.source.body),measurements=doc.measurements;
 if(doc.schema!=='measurement-ranges-v1'||!Array.isArray(measurements)||measurements.length<1||measurements.length>4||report.matrix.length!==objectives.length)throw Error('Document schema');
 for(const r of measurements)if(!Number.isInteger(r.low)||!Number.isInteger(r.high)||r.low<0||r.high<r.low||r.high>1e9)throw Error('Measurement range');
 return objectives.map((obj,i)=>{
  const labels=report.matrix[i];if(labels.length!==measurements.length)throw Error('Matrix coverage');
  labels.forEach((label,j)=>{if(!['MATCH','NO_MATCH','UNKNOWN'].includes(label)||(measurements[j].unit!==obj.unit&&label!=='NO_MATCH'))throw Error('Label/unit mismatch');});
  const matched_rows=labels.flatMap((x,j)=>x==='MATCH'?[j]:[]),known=matched_rows.length>0&&!labels.includes('UNKNOWN');
  return {low:known?Math.min(...matched_rows.map(j=>measurements[j].low)):0,high:known?Math.max(...matched_rows.map(j=>measurements[j].high)):null,
   known,matched_rows,reason:known?'REPORTED_HULL':labels.includes('UNKNOWN')?'AMBIGUOUS':'MISSING',unit:obj.unit};
 });
}
export async function state(address,key){
 const panel=await read(address,'get_panel',[key]),result=await read(address,'get_result',[key]),spec=panel.spec,n=spec.sources.length;
 if(digest(spec)!==panel.input_root||spec.contract!==address||spec.policy!=='robust-pareto-frontier-v1'||
  digest({contract:address,creator:spec.creator,nonce:spec.nonce})!==key||panel.seen_mask!==(1<<n)-1||result.panel!==key||result.input_root!==panel.input_root)throw Error('Panel binding/barrier');
 const observations=[],ranges=[],failed=[];
 for(let i=0;i<n;i++){
  const row=await read(address,'get_observation',[key,i]),{root,...body}=row,report=row.report,s=report.source,expected=spec.sources[i];
  if(digest(body)!==root||canonical(report.binding)!==canonical({panel:key,index:i,contract:address,input_root:panel.input_root,policy:spec.policy})||s.url!==expected.url)throw Error('Observation root/binding');
  if(['OK','HASH_MISMATCH'].includes(s.status)){
   if(s.http!==200||sha(s.body)!==s.hash||Buffer.byteLength(s.body)<1||Buffer.byteLength(s.body)>6000||s.status!==(s.hash===expected.sha256?'OK':'HASH_MISMATCH'))throw Error('Full response hash');
  }else if(!['UNAVAILABLE','HTTP_ERROR','SIZE_ERROR','ENCODING_ERROR'].includes(s.status)||s.body||s.hash)throw Error('Source failure');
  if((s.status!=='OK'&&report.document_status!=='ACQUISITION_FAILED')||row.document_status!==report.document_status)throw Error('Source/document status');
  const intervals=rangesFromReport(report,spec.objectives);
  if(canonical(intervals)!==canonical(row.ranges))throw Error('Source-derived interval hull');
  ranges.push(intervals);observations.push({index:i,root,source_status:s.status,document_status:row.document_status,matrix:report.matrix,ranges:intervals});
  if(row.document_status!=='READY')failed.push(i);
 }
 const expected=failed.length?{status:'HELD',failed_sources:failed,certain_frontier:[],possible_frontier:[]}:{status:'ANALYZED',...endpointFrontier(ranges,spec.objectives)};
 const {root,...body}=result;
 if(digest(body)!==root||canonical(result.output)!==canonical(expected)||canonical(result.observation_roots)!==canonical(observations.map(x=>x.root)))throw Error('Result envelope/root');
 if(!failed.length){
  if(canonical(await read(address,'certain_frontier',[key,panel.input_root]))!==canonical({input_root:panel.input_root,root,indexes:expected.certain_frontier}))throw Error('Consumer mismatch');
 }else{
  let denied=false;try{await read(address,'certain_frontier',[key,panel.input_root]);}catch(e){denied=e.code===-32000&&e.details==='execution failed';}
  if(!denied)throw Error('HELD consumer not denied');
 }
 return {panel:key,input_root:panel.input_root,root,verified:true,observations,output:expected};
}
if(process.argv[1]?.endsWith('check.mjs'))try{
 const [mode,value,extra]=process.argv.slice(2);
 const result=mode==='source'?await source(value):mode==='state'?await state(value,extra):
  ['success','error'].includes(mode)?await receipt(value,mode==='error'?'ERROR':'SUCCESS',extra):null;
 if(!result)throw Error('Unknown mode');console.log(JSON.stringify(result));
}catch{console.error('Sanitized verification failure; inspect recorded hash before retrying');process.exitCode=1;}
