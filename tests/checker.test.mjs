import test from 'node:test';
import assert from 'node:assert/strict';
import {endpointFrontier,canonical} from '../scripts/check.mjs';
const objectives=[{direction:'MIN'},{direction:'MAX'}];
test('partial data excludes dominated option without inventing throughput',()=>{
 const x=endpointFrontier([[{low:10,high:12},{low:100,high:110}],[{low:20,high:25},{low:70,high:80}],[{low:5,high:8},{low:0,high:null}]],objectives);
 assert.deepEqual(x.certain_frontier,[2]);assert.deepEqual(x.possible_frontier,[0,2]);
 assert.deepEqual(x.certainly_dominated,[{index:1,witness:0}]);assert.deepEqual(x.ambiguous_membership,[0]);
});
test('strict dominance preserves ties at touching endpoints',()=>{
 const x=endpointFrontier([[{low:0,high:1},{low:0,high:0}],[{low:1,high:2},{low:0,high:0}]],objectives);
 assert.deepEqual(x.certain_frontier,[0]);assert.deepEqual(x.possible_frontier,[0,1]);
 assert.deepEqual(x.certainly_dominated,[]);
});
test('wholly unknown data promotes no certain option',()=>{
 const x=endpointFrontier(Array.from({length:4},()=>Array.from({length:3},()=>({low:0,high:null}))),[{direction:'MIN'},{direction:'MAX'},{direction:'MIN'}]);
 assert.deepEqual(x.certain_frontier,[]);assert.deepEqual(x.possible_frontier,[0,1,2,3]);
});
test('canonical Unicode matches Python ASCII root format',()=>{
 assert.equal(canonical({z:'é',a:'💡'}),'{"a":"\\ud83d\\udca1","z":"\\u00e9"}');
});
