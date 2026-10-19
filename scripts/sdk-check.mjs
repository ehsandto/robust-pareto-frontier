import assert from 'node:assert/strict';
import {abi} from 'genlayer-js';
const {calldata}=abi;
for(const [method,args] of [
 ['open_panel',['demo','Four workers with a 65536-byte request payload.','MIN|ms|95th percentile request latency\nMAX|ops_s|Completed requests per second','owner/repo/'+'a'.repeat(40)+'/a.json|'+'b'.repeat(64)+'\nowner/repo/'+'a'.repeat(40)+'/b.json|'+'c'.repeat(64)]],
 ['observe',['a'.repeat(64),2,'b'.repeat(64)]],['finalize',['a'.repeat(64),'b'.repeat(64)]],
 ['get_panel',['a'.repeat(64)]],['get_observation',['a'.repeat(64),0]],['get_result',['a'.repeat(64)]],['certain_frontier',['a'.repeat(64),'b'.repeat(64)]]]){
 const bytes=calldata.encode(calldata.makeCalldataObject(method,args,{}));assert.deepEqual(calldata.encode(calldata.decode(bytes)),bytes);
}
console.log('7 SDK calldata roundtrips passed');
