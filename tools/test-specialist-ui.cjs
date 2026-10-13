// Delegated specialist clicks: uncommitted/mode-first targeting and health guards.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
let click;const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(script+`;globalThis.a={get G(){return G},newGame(seed){SEED=seed;newGame()},CRISES,sys,crew,computeTotals,render};`,ctx);
const a=ctx.a;
const dispatch=(act,id,mode)=>click({target:{closest:()=>({dataset:{act,id,mode}})}});
let seed;for(let s=0;s<256;s++){a.newGame(s);if(a.crew('commsOfficer')){seed=s;break}}assert.notEqual(seed,undefined);
function fixture(){
 a.newGame(seed);a.G.crisis=a.CRISES[1].find(c=>c.id==='e-firmware');a.G.drawn=['comms'];
 assert.equal(a.crew('commsOfficer').state,'ok');a.render();
}
fixture();dispatch('crew','commsOfficer');
assert.match(el('drawn').innerHTML,/class="card[^"]*searmed/,'Show a matching uncommitted card as a candidate');
assert(el('hint').textContent.includes("choose a matching system's output mode"));
dispatch('card','comms');
assert.equal(a.crew('commsOfficer').used,false);assert.equal(a.computeTotals().SIG||0,0);
dispatch('mode','comms','n');assert.equal(a.computeTotals().SIG,5);
assert.equal(a.crew('commsOfficer').used,true);assert.equal(a.G.pendingSpecialist,null);
assert.deepEqual(Array.from(a.sys('comms').specialists),['commsOfficer']);
fixture();dispatch('mode','comms','n');dispatch('crew','commsOfficer');dispatch('card','comms');assert.equal(a.computeTotals().SIG,5);
dispatch('mode','comms','r');assert.equal(a.computeTotals().SIG,8);
dispatch('mode','comms','r');assert.equal(a.computeTotals().SIG||0,0);assert.equal(a.crew('commsOfficer').used,true);
dispatch('mode','comms','n');assert.equal(a.computeTotals().SIG,5);
fixture();a.sys('comms').state='damaged';dispatch('crew','commsOfficer');dispatch('mode','comms','r');assert.equal(a.crew('commsOfficer').used,false);
dispatch('mode','comms','n');assert.equal(a.computeTotals().SIG,3);assert.equal(a.sys('comms').state,'damaged');
for(const state of ['injured','used']){
 fixture();if(state==='used')a.crew('commsOfficer').used=true;else a.crew('commsOfficer').state=state;
 dispatch('crew','commsOfficer');dispatch('mode','comms','n');assert.equal(a.computeTotals().SIG,3);
}
fixture();a.G.drawn=['reactor'];dispatch('crew','commsOfficer');dispatch('mode','reactor','n');assert.equal(a.crew('commsOfficer').used,false);assert.equal(a.G.pendingSpecialist,'commsOfficer');
dispatch('mode','comms','n');assert.equal(a.sys('comms').mode,null);assert.equal(a.crew('commsOfficer').used,false);
console.log('PASS: Communications specialist UI, both selection orders, damaged output, health/target guards, cancellation and no duplicate bonuses');
