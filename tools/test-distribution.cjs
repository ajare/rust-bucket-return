// Smoother system coverage without inflating the fleet's per-capability output budget.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),os=require('node:os'),assert=require('node:assert/strict');
const {load}=require('./capability-demand.cjs'),{supply,run,beforeFile}=require('./distribution-study.cjs');
const root=path.join(__dirname,'..'),before=load(beforeFile),now=load(),bSupply=supply(before),aSupply=supply(now);
assert.equal(now.SYSTEM_DEFS.length,16);assert.equal(Object.keys(now.CAPS).length,10);
assert.deepEqual(before.CAPS,now.CAPS);
for(const cap of Object.keys(now.CAPS)){
 assert(aSupply[cap].n.sources.length>=2,cap+' has two Normal sources');
 for(const mode of ['n','r','s'])assert.equal(aSupply[cap][mode].total,bSupply[cap][mode].total,cap+' '+mode+' total is conserved');
}
assert.deepEqual(aSupply.PRO.n.sources,[{id:'shielding',output:2},{id:'habitat',output:1}]);
assert.deepEqual(aSupply.PRO.r.sources,[{id:'shielding',output:4},{id:'habitat',output:2}]);
assert.deepEqual(aSupply.PRO.s.sources,[{id:'shielding',output:6},{id:'habitat',output:2}]);
assert.deepEqual(aSupply.CON.n.sources,[{id:'batteries',output:1},{id:'thrusters',output:2}]);
assert.deepEqual(aSupply.CON.r.sources,[{id:'batteries',output:1},{id:'thrusters',output:4}]);
assert.deepEqual(aSupply.CON.s.sources,[{id:'thrusters',output:6}],'Keep full emergency Control for compound return checks');
assert.deepEqual(aSupply.ENG.s.sources,[{id:'fabricator',output:4},{id:'service',output:1}]);
const changed=new Set(['batteries','thrusters','navcomp','fabricator','shielding','habitat','service','cargo']);
for(const d of now.SYSTEM_DEFS){
 const old=before.SYSTEM_DEFS.find(x=>x.id===d.id);assert(old);
 if(d.id==='cargo'){old.s=null;delete old.sfx} // Intentional (005-M1): Cargo Bay has no use modes.
 for(const key of ['comp','nh','rh','sh','sfx','passive','yield3'])assert.deepEqual(d[key],old[key],d.id+' preserves '+key);
 if(!changed.has(d.id))assert.deepEqual(d,old);
}
for(const level of ['easy','normal','hard']){
 const b=load(beforeFile,level),a=load(undefined,level);
 for(const cards of Object.values(b.CRISES))for(const c of cards)delete c.win.components;
 for(const key of ['CRISES','BASE_DECK','BASE_FAILURES','FAILURE_BALANCE','ROUTES','REENTRY'])assert.deepEqual(a[key],b[key],level+' unchanged '+key+' except fixed success grants');
}
function engine(html){
 const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
 const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(source+`;render=()=>{};globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},sys,crew,crewClick,cardClick,setMode,computeTotals,resolveCrisis,injureCrew,renderDrawn,cardTooltip,FITNESS_CONFIG,MULTI_SYSTEMS};`,ctx);
 return {a:ctx.a,el};
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),{a,el}=engine(html),prior=engine(fs.readFileSync(beforeFile,'utf8')).a;
assert.deepEqual(JSON.parse(JSON.stringify(a.FITNESS_CONFIG)),JSON.parse(JSON.stringify(prior.FITNESS_CONFIG)));
assert.deepEqual(Array.from(a.MULTI_SYSTEMS),Array.from(prior.MULTI_SYSTEMS));
const seeds=new Map();
function opening(g){
 const state=JSON.parse(JSON.stringify({crew:g.crew,drawn:g.drawn,deck:g.deck,pools:g.pools,crisis:g.crisis,components:g.components,heat:g.heat,oxygen:g.oxygen,course:g.course,flags:g.flags}));
 delete state.flags.reentrySuccess;delete state.flags.routeTarget; // Removed dead flags (005-M6).
 for(const c of [state.crisis,...state.deck,...Object.values(state.pools).flat()])if(c?.win)delete c.win.components;
 return state;
}
for(let seed=0;seed<128;seed++){
 a.newGame(seed);prior.newGame(seed);assert.deepEqual(opening(a.G),opening(prior.G),'Same opening randomness');
 for(const c of a.G.crew.filter(c=>c.cap))if(!seeds.has(c.cap))seeds.set(c.cap,seed);
}
for(const [id,cap,modes] of [['batteries','CON',['n','r']],['habitat','PRO',['n','r','s']],['service','ENG',['s']]])for(const mode of modes){
 for(const damaged of [false,...(mode==='n'?[true]:[])]){
  a.newGame(seeds.get(cap));a.G.drawn=[id];const s=a.sys(id),c=a.G.crew.find(c=>c.cap===cap);
  if(damaged)s.state='damaged';a.setMode(id,mode);const base={...a.computeTotals()};
  a.crewClick(c.id);a.cardClick(id);assert(c.used);assert.equal(a.computeTotals()[cap],(base[cap]||0)+2);
  for(const [other,n] of Object.entries(base))if(other!==cap)assert.equal(a.computeTotals()[other],n);
  a.setMode(id,mode);assert.equal(a.computeTotals()[cap]||0,0);assert(c.used,'Uncommit does not refund specialist');
 }
}
// Removed Control targets and non-producing modes cannot consume Pilot; power SCRAM still applies.
a.newGame(seeds.get('CON'));a.G.drawn=['navcomp','batteries'];a.setMode('navcomp','n');
a.crewClick('pilot');a.cardClick('navcomp');assert.equal(a.crew('pilot').used,false);
a.setMode('batteries','s');a.cardClick('batteries');assert.equal(a.crew('pilot').used,false);
a.newGame(seeds.get('CON'));a.G.drawn=['batteries'];a.G.flags.noRedline=true;a.crewClick('pilot');a.setMode('batteries','r');
assert.equal(a.sys('batteries').mode,null);assert.equal(a.crew('pilot').used,false);
// Habitat's active modes use ordinary mode guards and preserve its Sacrifice injury protection.
a.newGame();a.G.drawn=['habitat'];a.renderDrawn();
for(const mode of ['n','r'])assert(!el('drawn').innerHTML.includes('data-id="habitat" data-mode="'+mode+'" disabled'));
assert(a.cardTooltip(a.sys('habitat')).includes('PROTECTION 1'));
a.G.crisis={title:'Habitat redline',req:{PRO:2},win:{},fail:{}};a.setMode('habitat','r');a.resolveCrisis();
assert.equal(a.sys('habitat').state,'damaged');assert.equal(a.G.flags.shelter,0);
a.G.drawn=['habitat'];a.setMode('habitat','r');assert.equal(a.sys('habitat').mode,null);
a.newGame();a.G.drawn=['habitat'];a.G.crisis={title:'Habitat sacrifice',req:{PRO:2},win:{},fail:{}};
a.setMode('habitat','s');a.resolveCrisis();assert.equal(a.sys('habitat').state,'destroyed');assert.equal(a.G.flags.shelter,2);
a.injureCrew(2,'shelter regression');assert.equal(a.G.flags.shelter,0);assert(a.G.crew.every(c=>c.state==='ok'));
// Service Sacrifice produces Engineering AND the unchanged three-component yield.
a.newGame();a.G.drawn=['service'];const parts=Object.values(a.G.components).reduce((n,v)=>n+v,0);
a.G.crisis={title:'Service sacrifice',req:{ENG:1},win:{},fail:{}};a.setMode('service','s');
assert.equal(a.computeTotals().ENG,1);assert.equal(a.computeTotals().CLG||0,0);assert.equal(a.computeTotals().LFS||0,0);
a.resolveCrisis();assert.equal(a.sys('service').state,'destroyed');assert.equal(Object.values(a.G.components).reduce((n,v)=>n+v,0),parts+3);
// Headless comparison uses the exact archived baseline and leaves gameplay bytes untouched.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'distribution-test-'));
try{
 const report=run({games:5,outDir:temp});assert(report.baselineValidated);
 assert.deepEqual(fs.readFileSync(path.join(root,'index.html'),'utf8'),html);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS: conserved fleet budgets, two Normal sources, targeted backups, unchanged openings/rules, active Habitat, Sacrifice effects and matched-seed study');
