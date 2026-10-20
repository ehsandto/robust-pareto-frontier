import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,receipt,source,state,read,canonical} from './check.mjs';
try{
 const file=process.argv[2];if(!file)throw Error('Supply deployment journal');
 const p=JSON.parse(fs.readFileSync(file,'utf8'));assert(p.final_readback_verified);
 assert.equal(await rpc('eth_chainId',[]),'0xf22f');assert.equal(canonical(await source(p.address)),canonical(p.source));
 for(const entry of p.transactions){
  assert(entry.hash&&entry.verified&&!entry.broadcast_unknown);
  const actual=await receipt(entry.hash,entry.expected,entry.expected_message);
  for(const key of ['hash','address','status','execution','consensus'])assert.equal(actual[key],entry[key]);
  await new Promise(r=>setTimeout(r,2200));
 }
 for(const prior of Object.values(p.panels))assert.equal(canonical(await state(p.address,prior.panel)),canonical(prior));
 assert.equal(p.panels.main.output.status,'ANALYZED');assert.deepEqual(p.panels.main.output.certain_frontier,[2]);
 assert.deepEqual(p.panels.main.output.possible_frontier,[0,2]);assert.equal(p.panels.bad.output.status,'HELD');
 assert(p.panels.main.observations.every(x=>x.source_status==='OK'&&x.document_status==='READY'));
 assert.equal(p.panels.bad.observations[0].source_status,'HASH_MISMATCH');
 assert.equal(p.panels.bad.observations[0].document_status,'ACQUISITION_FAILED');
 assert(p.panels.bad.observations[0].matrix.every(row=>row.length===0));
 let denied=false;try{await read(p.address,'certain_frontier',[p.panels.main.panel,'f'.repeat(64)]);}
 catch(e){denied=e.code===-32000&&e.details==='execution failed';}assert(denied);
 console.log(JSON.stringify({verified:true,address:p.address,transactions:p.transactions.length,panels:2,source_match:true}));
}catch{console.error('Read-only verification failed; no transaction signed or sent');process.exitCode=1;}
