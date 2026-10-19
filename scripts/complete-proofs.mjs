import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {receipt,source,state,read,digest,sha} from './check.mjs';
const file='PROOFS.json',signer='0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42';
let proofs;
if(fs.existsSync(file))proofs=JSON.parse(fs.readFileSync(file,'utf8'));
else{
 const commit=process.argv[2];if(!/^[0-9a-f]{40}$/.test(commit??''))throw Error('Supply the full published fixture commit');
 proofs={network:'studionet',chain_id:61999,signer,fixture_commit:commit,transactions:[],panels:{}};
}
const save=()=>fs.writeFileSync(file,JSON.stringify(proofs,null,2)+'\n');
function broadcast(args,onHash){
 return new Promise((resolve,reject)=>{
  const proc=spawn(process.execPath,['--dns-result-order=ipv4first','scripts/run-cli.cjs',...args],{windowsHide:true,
   env:{...process.env,PARETO_TEST_ACCOUNT:process.env.PARETO_TEST_ACCOUNT||'studio-proof-deployer'},stdio:['ignore','pipe','pipe']});
  let carry='';proc.stderr.resume();proc.stdout.on('data',chunk=>{carry+=chunk.toString();const lines=carry.split(/\r?\n/);carry=lines.pop();
   for(const line of lines)if(/^BROADCAST_HASH 0x[0-9a-fA-F]{64}$/.test(line))onHash(line.split(' ')[1]);});
  proc.on('error',()=>reject(Error('CLI launch failed')));proc.on('close',resolve);
 });
}
async function transaction(step,args,expected='SUCCESS',message){
 let entry=proofs.transactions.find(x=>x.step===step);
 if(!entry){entry={step,verified:false,broadcast_unknown:true};proofs.transactions.push(entry);save();
  await broadcast(args,hash=>{entry.hash=hash;delete entry.broadcast_unknown;save();console.log(step+' '+hash);});
 }
 if(!entry.hash)throw Error('Unknown broadcast outcome; inspect signer history');
 Object.assign(entry,await receipt(entry.hash,expected,message),{verified:true});save();
 console.log(JSON.stringify({step,status:entry.status,execution:entry.execution,consensus:entry.consensus}));return entry;
}
const context='Four workers with a 65536-byte request payload.';
const objectives='MIN|ms|95th percentile end-to-end request latency\nMAX|ops_s|Completed requests per second';
function sources(names,bad=false){
 return names.map((name,i)=>{const path='examples/'+name+'.json';
  return 'ehsandto/robust-pareto-frontier/'+proofs.fixture_commit+'/'+path+'|'+(bad&&i===0?'f'.repeat(64):sha(fs.readFileSync(path)));
 }).join('\n');
}
async function open(name,names,bad=false){
 await transaction('open-'+name,['write',proofs.address,'open_panel','--args',name,context,objectives,sources(names,bad)]);
 const key=digest({contract:proofs.address,creator:proofs.signer,nonce:name}),panel=await read(proofs.address,'get_panel',[key]);
 if(digest(panel.spec)!==panel.input_root)throw Error('Input root mismatch');return {key,root:panel.input_root};
}
try{
 const deployed=await transaction('deploy',['deploy','--contract','contracts/RobustParetoFrontier.py']);
 proofs.address=deployed.address;proofs.source=await source(proofs.address);save();
 const main=await open('scope-panel-v1',['a','b','c']);
 await transaction('early-finalize',['write',proofs.address,'finalize','--args',main.key,main.root],'ERROR','Observation barrier incomplete');
 await transaction('observe-c-first',['write',proofs.address,'observe','--args',main.key,'2',main.root]);
 await transaction('replay-c',['write',proofs.address,'observe','--args',main.key,'2',main.root],'ERROR','Source already observed');
 await transaction('observe-a-second',['write',proofs.address,'observe','--args',main.key,'0',main.root]);
 await transaction('observe-b-third',['write',proofs.address,'observe','--args',main.key,'1',main.root]);
 await transaction('finalize-frontier',['write',proofs.address,'finalize','--args',main.key,main.root]);
 proofs.panels.main=await state(proofs.address,main.key);save();console.log(JSON.stringify({scenario:'scope-panel',...proofs.panels.main}));
 const bad=await open('bad-commitment-v1',['a','b'],true);
 await transaction('observe-bad-a',['write',proofs.address,'observe','--args',bad.key,'0',bad.root]);
 await transaction('observe-good-b',['write',proofs.address,'observe','--args',bad.key,'1',bad.root]);
 await transaction('finalize-held',['write',proofs.address,'finalize','--args',bad.key,bad.root]);
 proofs.panels.bad=await state(proofs.address,bad.key);save();
 await transaction('wrong-input-root',['write',proofs.address,'finalize','--args',main.key,'f'.repeat(64)],'ERROR','Input root mismatch');
 for(const [name,prior] of Object.entries(proofs.panels)){
  const current=await state(proofs.address,prior.panel);if(current.root!==prior.root)throw Error('Negative test altered result');
  proofs.panels[name]=current;
 }
 let denied=false;try{await read(proofs.address,'certain_frontier',[main.key,'f'.repeat(64)]);}catch(e){denied=e.code===-32000&&e.details==='execution failed';}
 if(!denied)throw Error('Wrong-root consumer denial unverified');
 proofs.wrong_root_consumer_denied=true;proofs.source=await source(proofs.address);proofs.final_readback_verified=true;save();
 console.log(JSON.stringify({complete:true,address:proofs.address,source_match:true,panels:Object.fromEntries(Object.entries(proofs.panels).map(([k,v])=>[k,v.output]))}));
}catch{console.error('Sanitized proof workflow stopped; inspect recorded hashes and state before any retry');process.exitCode=1;}
