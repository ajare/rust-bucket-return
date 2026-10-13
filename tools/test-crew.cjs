// Seeded roster and capability-specialist regressions against the inline engine.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();let click;
const element=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}})}return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:element,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(source+`
const renderUI=render;render=()=>{};
globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},CAPS,CREW_DEFS,SYSTEM_SPECIALISTS,SYSTEM_DEFS,
 sys,crew,crewClick,cardClick,reqClick,setMode,drawFive,computeTotals,systemOutput,resolveCrisis,injureCrew,
 fabricate,cannibaliseGains,renderUI};`,ctx);
const a=ctx.a,seedByCap=new Map(),seeds=[];
assert.equal(a.CREW_DEFS.length,4);assert.equal(a.SYSTEM_SPECIALISTS.length,10);
assert.deepEqual(Array.from(a.SYSTEM_SPECIALISTS,c=>c.cap).sort(),Object.keys(a.CAPS).sort());
// Only six crew are aboard; the unselected templates are neither extra health nor extra score.
for(let seed=0;seed<256;seed++){
 a.newGame(seed);assert.equal(a.G.crew.length,6);
 assert.deepEqual(Array.from(a.G.crew.slice(0,4),c=>c.id),['cmdr','syseng','doc','spec']);
 const specialists=a.G.crew.filter(c=>c.cap);assert.equal(specialists.length,2);
 assert.notEqual(specialists[0].id,specialists[1].id);assert.notEqual(specialists[0].cap,specialists[1].cap);
 assert(a.G.crew.every(c=>c.state==='ok'&&!c.used));
 for(const c of specialists)if(!seedByCap.has(c.cap))seedByCap.set(c.cap,seed);
 seeds.push({seed,caps:specialists.map(c=>c.cap)});
}
assert.equal(seedByCap.size,10,'All capability specialists are reachable');
assert(a.SYSTEM_SPECIALISTS.every(c=>c.state===undefined&&c.used===undefined),'Never mutate crew pool templates');
function fixture(cap,mode='n'){
 a.newGame(seedByCap.get(cap));const c=a.G.crew.find(c=>c.cap===cap);
 // Exercise the primary producer, not whichever new backup comes first in the catalogue.
 const def=Array.from(a.SYSTEM_DEFS).filter(d=>(d[mode]?.[cap]||0)>0).sort((x,y)=>y[mode][cap]-x[mode][cap])[0];a.G.drawn=[def.id];
 if(mode)a.setMode(def.id,mode);return {c,s:a.sys(def.id)};
}
function assign(c,s){a.crewClick(c.id);a.cardClick(s.id);}
// +2 is targeted, not free-standing, for all ten capabilities and all three output modes.
for(const cap of Object.keys(a.CAPS))for(const mode of ['n','r','s']){
 const {c,s}=fixture(cap,mode),before={...a.computeTotals()};
 a.crewClick(c.id);assert.equal(c.used,false);assert.deepEqual({...a.computeTotals()},before);
 a.cardClick(s.id);assert.equal(c.used,true);assert.equal(a.G.pendingSpecialist,null);
 assert.equal(a.computeTotals()[cap],before[cap]+2);assert.equal(a.G.crewBonus[cap]||0,0);
 for(const other of Object.keys(before))if(other!==cap)assert.equal(a.computeTotals()[other],before[other]);
 assert.deepEqual(Array.from(s.specialists),[c.id]);
 a.crewClick(c.id);a.cardClick(s.id);assert.equal(a.computeTotals()[cap],before[cap]+2,'No repeated uses');
 a.setMode(s.id,mode);assert.equal(a.computeTotals()[cap]||0,0,'No output from an uncommitted system');
 assert.equal(c.used,true,'Cancelling the system does not refund crew use');
}
// Invalid targets do not consume the specialist; selection can be cancelled and retried.
let {c,s}=fixture('DET');a.setMode(s.id,'n');a.crewClick(c.id);a.cardClick(s.id);
assert.equal(c.used,false);assert.equal(a.G.pendingSpecialist,c.id);
a.crewClick(c.id);assert.equal(a.G.pendingSpecialist,null);
a.G.drawn=['sensors','thermal'];a.setMode('thermal','n');a.crewClick(c.id);a.cardClick('thermal');assert.equal(c.used,false);
a.G.drawn=['thermal'];a.cardClick('sensors');assert.equal(c.used,false);
a.G.drawn=['sensors'];a.setMode('sensors','n');a.cardClick('sensors');assert.equal(c.used,true);
// Damage halves only system output, not the healthy specialist's +2. Systems Engineer can stack.
({c,s}=fixture('LFS'));s.state='damaged';assign(c,s);assert.equal(a.computeTotals().LFS,3);
a.crewClick('syseng');a.cardClick(s.id);assert.equal(a.computeTotals().LFS,5);
// Two different specialists can boost the same multi-capability system, respecting mode output.
const pair=seeds.find(row=>row.caps.includes('CON')&&row.caps.includes('THR'));assert(pair);
a.newGame(pair.seed);a.G.drawn=['thrusters'];s=a.sys('thrusters');a.setMode(s.id,'n');
assign(a.crew('pilot'),s);assign(a.G.crew.find(c=>c.cap==='THR'),s);
assert.equal(a.computeTotals().CON,4);assert.equal(a.computeTotals().THR,3);
a.setMode(s.id,'r');assert.equal(a.computeTotals().CON,6);assert.equal(a.computeTotals().THR||0,0);
assert(a.G.crew.filter(c=>c.cap).every(c=>c.used));
// A damaged one-point output may become zero, but a matching specialist still adds two.
a.newGame(pair.seed);a.G.drawn=['thrusters'];s=a.sys('thrusters');s.state='damaged';a.setMode(s.id,'n');
assign(a.G.crew.find(c=>c.cap==='THR'),s);assert.equal(a.computeTotals().THR,2);
// Doctor stacks with the Life Support specialist; healing takes priority over free output.
({c,s}=fixture('LFS'));assign(c,s);a.crewClick('doc');assert.equal(a.computeTotals().LFS,7);
({c,s}=fixture('LFS'));a.crew('cmdr').state='injured';a.crewClick('doc');
assert.equal(a.crew('cmdr').state,'ok');assert.equal(a.computeTotals().LFS,3);
// Boosted cooling/navigation participates in ordinary surplus rules.
({c,s}=fixture('CLG'));assign(c,s);a.G.heat=4;
a.G.crisis={title:'Cooling bonus',req:{CLG:3},fail:{},win:{}};a.resolveCrisis();assert.equal(a.G.heat,2);
({c,s}=fixture('NAV'));assign(c,s);a.G.course=2;
a.G.crisis={title:'Navigation bonus',req:{NAV:2},fail:{},win:{}};a.resolveCrisis();assert.equal(a.G.course,1);
// Injury/death blocks specialist use and does not cause the run's roster to be redrawn.
for(const state of ['injured','dead']){
 ({c,s}=fixture('NAV'));c.state=state;a.crewClick(c.id);a.cardClick(s.id);
 assert.equal(c.used,false);assert.equal(a.G.pendingSpecialist,null);assert.equal(a.computeTotals().NAV,3);
 const roster=Array.from(a.G.crew,x=>x.id);a.drawFive();
 assert.deepEqual(Array.from(a.G.crew,x=>x.id),roster);assert.equal(c.state,state);
}
({c,s}=fixture('NAV'));assign(c,s);a.drawFive();assert.equal(c.used,false);assert.equal(s.specialists.length,0);
assert.equal(a.G.pendingSpecialist,null);
// Absent Engineer/Pilot calls are safe. Engineer's passive only applies when aboard and healthy.
a.newGame(seeds.find(row=>!row.caps.includes('ENG')&&!row.caps.includes('CON')).seed);
a.crewClick('eng');a.crewClick('pilot');assert.equal(a.cannibaliseGains(a.sys('aux')).length,3);
({c,s}=fixture('ENG'));assign(c,s);assert.equal(a.cannibaliseGains(a.sys('aux')).length,4,'Engineer passive survives spending the active ability');
a.crew('eng').state='injured';assert.equal(a.cannibaliseGains(a.sys('aux')).length,3);
// Fabrication is not an Engineering-output mode and cannot receive the Engineer's +2.
a.newGame(seedByCap.get('ENG'));a.G.drawn=['fabricator'];a.G.components.Wiring=8;
a.crewClick('eng');const created=a.fabricate('fabricator','service');assert(created);
a.cardClick('fabricator');a.cardClick(created.id);assert.equal(a.crew('eng').used,false);
assert.equal(a.computeTotals().ENG||0,0);
// Target an independently constructed copy, not its blueprint's original instance.
a.drawFive();a.G.drawn=['service',created.id];a.setMode(created.id,'n');assign(a.crew('eng'),created);
assert.equal(a.computeTotals().ENG,created.def.n.ENG+2);assert.equal(a.sys('service').specialists.length,0);
// Boosts do not prevent Redline damage or Sacrifice destruction.
for(const mode of ['r','s']){
 ({c,s}=fixture('DET',mode));assign(c,s);a.G.crisis={title:'Specialist mode consequences',req:{DET:a.computeTotals().DET},fail:{},win:{}};
 a.resolveCrisis();assert.equal(s.state,mode==='r'?'damaged':'destroyed');
}
// Seeded restart reproduces the entire opening, including specialists; UI targets actual cards.
a.newGame(12345);const opening=JSON.stringify(a.G);a.G.crew[4].state='dead';a.drawFive();
click({target:{closest:()=>({dataset:{act:'restartgame'}})}});assert.equal(JSON.stringify(a.G),opening);
({c,s}=fixture('CLG'));a.renderUI();assert.equal((element('crew').innerHTML.match(/class="crewmember/g)||[]).length,6);
click({target:{closest:()=>({dataset:{act:'crew',id:c.id}})}});a.renderUI();
assert(element('drawn').innerHTML.includes('searmed'));assert(element('hint').textContent.includes('COOLING'));
click({target:{closest:()=>({dataset:{act:'card',id:s.id}})}});a.renderUI();
assert(element('drawn').innerHTML.includes('COOLING 5'));assert.equal(c.used,true);
a.injureCrew(50,'crew roster regression');assert(a.G.over&&!a.G.over.win);assert(a.G.crew.every(c=>c.state==='dead'));
console.log('PASS: seeded 4+2 roster, all 10 targeted specialists, mode/health guards, damage/duplicate stacking, salvage passive, restart and UI');
