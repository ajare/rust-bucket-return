// Success pays unused listed output, including partial OR alternatives, with pure previews and seeded random parts.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {load}=require('./capability-demand.cjs');
const root=path.join(__dirname,'..'),archive=path.join(root,'docs/simulations/surplus-before-engine.html.txt');
for(const level of ['easy','normal','hard']){
 const old=load(archive,level),now=load(undefined,level);let removed=0;
 for(const phase of [1,2,3])for(const c of now.CRISES[phase]){
  const prior=old.CRISES[phase].find(x=>x.id===c.id);assert(prior);
  if(prior.win.components>0)removed++;
  delete prior.win.components;assert.deepEqual(c,prior,c.id+' changes only fixed Component grants');
  assert(!('components' in c.win));
 }
 assert.equal(removed,10);
 const priorCargo=old.SYSTEM_DEFS.find(s=>s.id==='cargo');priorCargo.s=null;delete priorCargo.sfx; // Intentional (005-M1): Cargo Bay has no use modes.
 for(const key of ['CAPS','SYSTEM_DEFS','BASE_DECK','BASE_FAILURES','FAILURE_BALANCE','ROUTES','REENTRY'])assert.deepEqual(now[key],old[key],level+' preserves '+key);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(){}}};
vm.createContext(ctx);vm.runInContext(source+`;render=()=>{};globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},
 CRISES,REENTRY,sys,crew,crewClick,cardClick,setMode,patch,computeTotals,totalComponents,
 crisisSuccessComponents,awardSurplusComponents,resolveCrisis,renderCrisis,showHelp,routeDirect,routeSafe,
 useMission,cannibalise,cannibaliseGains,
 setRandom(values){let i=0;rng=()=>{if(i>=values.length)throw new Error('Unexpected reward RNG draw');return values[i++]};return ()=>i;}};`,ctx);
const a=ctx.a;
const count=(req,totals,alt)=>a.crisisSuccessComponents({req,...(alt?{alt}:{})},totals);
assert.equal(count({POW:5},{POW:5,CON:100}),0,'Exact match, unrelated outputs excluded');
assert.equal(count({POW:5},{POW:8}),3);
assert.equal(count({ENG:4,SIG:3},{ENG:6,SIG:4,CLG:99}),3,'Sum excess within a compound arm');
assert.equal(count({ENG:4,SIG:3},{ENG:99,SIG:2}),0,'No compensation across missing capabilities');
assert.equal(count({POW:3},{POW:2,DET:2},{DET:2}),2,'User example: partial alternative counts after success');
assert.equal(count({POW:3},{POW:3,DET:1},{DET:2}),1,'Symmetric partial alternative');
assert.equal(count({POW:3},{POW:2,DET:1},{DET:2}),0,'Neither arm complete: no reward');
assert.equal(count({POW:4},{POW:5,ENG:7},{ENG:3}),9,'Pay one satisfied arm, not both');
assert.equal(count({POW:10,ENG:10},{POW:100,ENG:0,SIG:5},{SIG:3}),102,'Incomplete compound alternative contributes all unused output');
assert.equal(count({ENG:5,POW:3},{ENG:0,POW:99,SIG:6,NAV:4},{SIG:4,NAV:3}),102);
assert.equal(count({POW:3,ENG:2},{POW:3,ENG:1,DET:2},{POW:2,DET:2}),2,'Shared Power counted once; unused Power and partial Engineering both count');
assert.equal(count({POW:5},{POW:6},{POW:3}),3,'Shared capabilities count only once');
assert.equal(count({},{POW:999}),0);assert.equal(a.crisisSuccessComponents(null,{}),0);
assert.equal(count({POW:1},{POW:101}),100,'No arbitrary surplus cap');
// Property check against an independent small exhaustive OR oracle.
for(let p=0;p<9;p++)for(let e=0;e<9;e++){
 const scores=[];if(p>=4)scores.push(p-4+e);if(e>=3&&p>=2)scores.push(e-3+p-2);
 assert.equal(count({POW:4},{POW:p,ENG:e,SIG:500},{ENG:3,POW:2}),scores.length?Math.max(...scores):0);
}
// Each token draws its own type, exactly once. No draws/state mutation for zero or failed rewards.
a.newGame();a.G.components={Electronics:0,Wiring:0,'Power Cell':0};
let draws=a.setRandom([0,.4,.8,0,.8]);assert.equal(a.awardSurplusComponents({req:{POW:3}},{POW:8}),5);
assert.equal(draws(),5);assert.deepEqual({...a.G.components},{Electronics:2,Wiring:1,'Power Cell':2});
const unchanged=JSON.stringify(a.G);draws=a.setRandom([]);
assert.equal(a.awardSurplusComponents({req:{POW:3}},{POW:3}),0);
assert.equal(a.awardSurplusComponents({req:{POW:3}},{POW:2}),0);
assert.equal(draws(),0);assert.equal(JSON.stringify(a.G),unchanged);
// Rendering predicts the same reward without granting it or advancing RNG.
a.newGame();a.G.drawn=[];a.G.crewBonus={POW:8,CON:99};
a.G.crisis={title:'Preview',cat:'TEST',flavor:'Test',req:{POW:5},win:{oxygen:1},fail:{}};
const beforePreview=JSON.stringify(a.G);draws=a.setRandom([]);
for(let i=0;i<30;i++)a.renderCrisis();assert.equal(draws(),0);assert.equal(JSON.stringify(a.G),beforePreview);
assert(el('crisis').innerHTML.includes('surplus reward: 3 random Components'));
assert(el('crisis').innerHTML.includes('+1 Oxygen'));assert(el('crisis').innerHTML.includes('including partial OR alternatives'));
a.G.crewBonus={POW:5};a.renderCrisis();assert(el('crisis').innerHTML.includes('surplus reward: no Components'));
a.G.crewBonus={POW:4};a.renderCrisis();assert(el('crisis').innerHTML.includes('resolving fails · no surplus reward'));
// User's OR example: pure preview predicts two; resolution draws two independently random types.
a.newGame();a.G.drawn=[];a.G.crisis={title:'Partial OR',cat:'TEST',flavor:'Test',req:{POW:3},alt:{DET:2},win:{},fail:{}};
a.G.crewBonus={POW:2,DET:2,CLG:100};const orBank=a.totalComponents(),orState=JSON.stringify(a.G);draws=a.setRandom([]);
for(let i=0;i<30;i++)a.renderCrisis();assert.equal(draws(),0);assert.equal(JSON.stringify(a.G),orState);
assert(el('crisis').innerHTML.includes('surplus reward: 2 random Components'));
// Terminal fixture prevents subsequent deck draws so this verifies exactly the reward RNG draws.
a.G.crisis.terminal=true;const types={...a.G.components};draws=a.setRandom([0,.8]);a.resolveCrisis();
assert.equal(draws(),2);assert.equal(a.totalComponents(),orBank+2);assert.equal(a.G.components.Electronics,types.Electronics+1);
assert.equal(a.G.components['Power Cell'],types['Power Cell']+1);assert.equal(a.G.components.Wiring,types.Wiring);
assert.equal(a.G.log.filter(l=>l.msg.startsWith('Surplus response:')).length,1);
// Former authored reward card: exact Redline output earns zero; Sacrifice's one excess earns one.
a.newGame();a.G.crisis=a.CRISES[1].find(c=>c.id==='battery-surge');a.G.drawn=['batteries'];
let bank=a.totalComponents();a.setMode('batteries','r');a.resolveCrisis();assert.equal(a.totalComponents(),bank);
a.newGame();a.G.crisis=a.CRISES[1].find(c=>c.id==='battery-surge');a.G.drawn=['batteries'];
bank=a.totalComponents();a.setMode('batteries','s');a.resolveCrisis();assert.equal(a.totalComponents(),bank+1);
assert.equal(a.sys('batteries').state,'destroyed');assert.equal(a.G.log.filter(l=>l.msg.startsWith('Surplus response:')).length,1);
// Compound authored card: outputs ENG 5/SIG 5 beat ENG 4/SIG 3 by three, not three plus old fixed two.
a.newGame();a.G.crisis=a.CRISES[2].find(c=>c.id==='fabjam');a.G.drawn=['fabricator','comms'];
a.setMode('fabricator','r');a.setMode('comms','n');bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank+3);
assert.equal(a.sys('fabricator').state,'damaged');
// Required crew output counts; secondary outputs unrelated to the arm do not.
a.newGame();a.G.crisis={title:'Crew support',req:{LFS:3},win:{},fail:{}};a.G.drawn=['lifesupport'];
a.setMode('lifesupport','n');a.crewClick('doc');assert.equal(a.computeTotals().LFS,5);
bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank+2);
let thrustSeed;for(let seed=0;seed<256;seed++){a.newGame(seed);if(a.crew('propulsion')){thrustSeed=seed;break}}assert.notEqual(thrustSeed,undefined);
a.newGame(thrustSeed);a.G.crisis={title:'Damaged specialist',req:{THR:1},win:{},fail:{}};a.G.drawn=['thrusters'];
a.sys('thrusters').state='damaged';a.setMode('thrusters','n');a.crewClick('propulsion');a.cardClick('thrusters');
assert.equal(a.computeTotals().THR,2);bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank+1);
a.newGame();a.G.crisis={title:'Patched output',req:{LFS:1},win:{},fail:{}};a.G.drawn=['lifesupport'];
a.sys('lifesupport').state='damaged';a.setMode('lifesupport','n');assert.equal(a.crisisSuccessComponents(a.G.crisis,a.computeTotals()),0);
a.patch('lifesupport');assert.equal(a.crisisSuccessComponents(a.G.crisis,a.computeTotals()),2);
// Failure grants nothing even with enormous excess in one incomplete arm.
a.newGame();a.G.crisis={title:'Failed compound',req:{ENG:4,SIG:3},win:{},fail:{}};
a.G.drawn=[];a.G.crewBonus={ENG:99,SIG:2};bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank);
// Other success effects remain independent of Component rewards.
a.newGame();a.G.crisis={title:'Other benefits',req:{POW:1},win:{oxygen:1,heal:1,heat:-1,course:-1,repairSystem:'thermal',clearOngoing:1},fail:{}};
a.G.drawn=[];a.G.crewBonus={POW:1};a.G.oxygen=3;a.G.heat=2;a.G.course=1;
a.G.ongoing=[{key:'test',oxygen:-1,turns:2}];a.crew('cmdr').state='injured';a.sys('thermal').state='damaged';
bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank);assert.equal(a.G.oxygen,4);assert.equal(a.G.heat,1);
assert.equal(a.G.course,0);assert.equal(a.G.ongoing.length,0);assert.equal(a.crew('cmdr').state,'ok');assert.equal(a.sys('thermal').state,'op');
// Sacrifice and cannibalisation still grant parts independently of an exact-match success.
a.newGame();a.G.crisis={title:'Service parts',req:{ENG:1},win:{},fail:{}};a.G.drawn=['service'];
a.setMode('service','s');bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank+3);
a.newGame();const gains=Array.from(a.cannibaliseGains(a.sys('fuelcells')));bank=a.totalComponents();a.cannibalise('fuelcells');assert.equal(a.totalComponents(),bank+gains.length);
let rahmanSeed;for(let seed=0;seed<256;seed++){a.newGame(seed);if(a.crew('spec').mission==='rahman'){rahmanSeed=seed;break}}assert.notEqual(rahmanSeed,undefined);
a.newGame(rahmanSeed);bank=a.totalComponents();assert(a.useMission('Electronics'));assert.equal(a.totalComponents(),bank+2);
// Direct burns earn surplus; exact/failed burns and Safe routes do not grant base parts.
for(const [output,reward] of [[10,2],[8,0],[7,0]]){
 a.newGame();a.G.step='route';a.G.phase=1;a.routeDirect();a.G.drawn=[];a.G.crewBonus={THR:output};
 bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank+reward);assert.equal(a.G.phase,2);
}
// A burn shows its consequences on the crisis card like any other response.
a.newGame();a.G.step='route';a.G.phase=1;a.routeDirect();a.renderCrisis();
assert(el('crisis').innerHTML.includes('✗ Failure: an engine system is damaged'),'Burn failure consequence is shown on the card');
assert(el('crisis').innerHTML.includes('✓ Success: 2 journey cards are removed'),'Burn success consequence is shown on the card');
a.newGame();a.G.step='route';a.G.phase=1;bank=a.totalComponents();a.routeSafe();assert.equal(a.totalComponents(),bank);
// Re-entry pays before scoring; a failed arm cannot reward its isolated huge Control output.
a.newGame();a.G.crisis=a.REENTRY;a.G.drawn=[];a.G.crewBonus={CON:7,NAV:7,PRO:5};bank=a.totalComponents();
a.resolveCrisis();assert(a.G.over.win);assert.equal(a.totalComponents(),bank+4);
assert.equal(a.G.over.lines.find(l=>l[0].startsWith('Unused components'))[2],bank+4);
const terminal=JSON.stringify(a.G);a.resolveCrisis();assert.equal(JSON.stringify(a.G),terminal,'Cannot resolve/reward a finished game twice');
a.newGame();a.G.crisis=a.REENTRY;a.G.drawn=[];a.G.crewBonus={CON:999};bank=a.totalComponents();a.resolveCrisis();assert.equal(a.totalComponents(),bank);
// Same seed and action sequence replay the new random payouts and subsequent draws exactly.
function replay(){a.newGame(4321);a.G.crisis=a.CRISES[2].find(c=>c.id==='fabjam');a.G.drawn=['fabricator','comms'];a.setMode('fabricator','r');a.setMode('comms','n');a.resolveCrisis();return JSON.stringify(a.G)}
assert.equal(replay(),replay());a.newGame();a.showHelp();assert(el('modal').innerHTML.includes('Success alone gives no Components'));
console.log('PASS: no fixed grants, unused listed output, compound/partial/shared OR checks, exact/failure zero, independent seeded types, pure live preview, crew/damage output, other income, routes and scored Re-entry');
