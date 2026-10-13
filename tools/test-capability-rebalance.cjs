// Demand/supply contract plus preservation checks against the archived previous rules.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {load,stats,arms,markdown}=require('./capability-demand.cjs');
const root=path.join(__dirname,'..'),archive=path.join(root,'docs/simulations/capability-rebalance-before-engine.html.txt');
const old=load(archive),now=load(),oldStats=Object.fromEntries(stats(old).map(s=>[s.cap,s])),current=Object.fromEntries(stats(now).map(s=>[s.cap,s]));
const expected={POW:12,ENG:16,SIG:20,DET:18,CLG:16,NAV:13,THR:7,CON:10,LFS:14,PRO:8};
for(const [cap,n] of Object.entries(expected))assert.equal(current[cap].mentions,n,cap+' ordinary crisis mentions');
for(const cap of ['POW','ENG']){
 assert(current[cap].mentions<oldStats[cap].mentions,cap+' demand remains below the original dominant mix');
 assert(current[cap].unavoidable<oldStats[cap].unavoidable,cap+' strict demand also falls');
 assert(current[cap].normal<oldStats[cap].normal,cap+' excess Normal production reduced');
}
for(const cap of ['SIG','DET','CLG','NAV']){
 assert(current[cap].mentions>oldStats[cap].mentions*2,cap+' demand more than doubles');
 assert(current[cap].unavoidable>oldStats[cap].unavoidable,cap+' not just optional OR substitutions');
 assert(current[cap].phase[1]>=3,cap+' gets recurring checks in the long transit pool');
 assert.equal(current[cap].producers,3,cap+' has two backup systems');assert.equal(current[cap].normal,5);
}
for(const difficulty of ['easy','normal','hard']){
 const previous=load(archive,difficulty),live=load(undefined,difficulty);
 assert.deepEqual(live.BASE_DECK,previous.BASE_DECK);assert.deepEqual(live.ROUTES,previous.ROUTES);assert.deepEqual(live.REENTRY,previous.REENTRY);
 assert.deepEqual(live.FAILURE_BALANCE,previous.FAILURE_BALANCE);
 previous.BASE_FAILURES.reboot.damageSystem='comms';
 assert.deepEqual(live.BASE_FAILURES,previous.BASE_FAILURES);
 for(const phase of [1,2,3]){
  assert.equal(live.CRISES[phase].length,previous.CRISES[phase].length);
  for(const c of live.CRISES[phase]){
   const prior=previous.CRISES[phase].find(p=>p.id===c.id);assert(prior,'Keep card placement and identity');
   if(c.id==='reboot')prior.fail.damageSystem='comms';
   delete prior.win.components; // Fixed success grants were replaced by surplus rewards.
   for(const key of ['title','cat','win','fail','failureTier'])assert.deepEqual(c[key],prior[key],difficulty+' '+c.id+' '+key);
   assert.equal(Boolean(c.alt),Boolean(prior.alt),c.id+' keeps its OR/strict tier');
   for(const arm of arms(c)){
    assert(Object.keys(arm).length>0);
    for(const [cap,n] of Object.entries(arm)){assert(cap in live.CAPS);assert(Number.isInteger(n)&&n>0);assert(current[cap].producers>0);}
   }
  }
 }
}
assert.deepEqual(now.SYSTEM_DEFS.map(s=>s.id),old.SYSTEM_DEFS.filter(s=>!['maincomp','medbay'].includes(s.id)).map(s=>s.id),'Only the two selected systems are removed; ordering stays intact');
for(const def of now.SYSTEM_DEFS){
 const prior=old.SYSTEM_DEFS.find(s=>s.id===def.id);
 if(def.id==='lifesupport')prior.sfx.heal=1;
 if(def.id==='cargo'){prior.s=null;delete prior.sfx} // Intentional (005-M1): Cargo Bay has no use modes.
 for(const key of ['comp','sfx','yield3','passive','nh','rh','sh'])assert.deepEqual(def[key],prior[key],def.id+' '+key);
 for(const mode of ['n','r','s'])for(const [cap,n] of Object.entries(def[mode]||{})){assert(cap in now.CAPS);assert(Number.isInteger(n)&&n>0);}
}
// Promoted-capability backups remain present in every relevant use mode.
const backup={aux:'CLG',engine:'NAV',thrusters:'NAV',navcomp:'DET',fabricator:'SIG',comms:'DET',sensors:'SIG'};
for(const [id,cap] of Object.entries(backup)){
 const s=now.SYSTEM_DEFS.find(s=>s.id===id);assert.deepEqual(['n','r','s'].map(mode=>s[mode][cap]),[1,2,3]);
}
assert.deepEqual(now.SYSTEM_DEFS.find(s=>s.id==='service').s,{ENG:1});
assert.deepEqual(now.CRISES[2].find(c=>c.id==='e-hotspot').alt,{CLG:3,NAV:2});
assert.deepEqual(now.CRISES[2].find(c=>c.id==='e-loadshed').alt,{SIG:3,NAV:2});
// Real assignment/halving on every new backup, including floor(1/2)=0 plus the healthy +2.
const vm=require('node:vm');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:()=>({innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}}),addEventListener(){}}};
vm.createContext(ctx);vm.runInContext(source+`render=()=>{};globalThis.a={get G(){return G},newGame(seed){SEED=seed;newGame()},sys,setMode,crewClick,cardClick,computeTotals};`,ctx);
const a=ctx.a,seeds=new Map();
for(let seed=0;seed<256;seed++){a.newGame(seed);for(const c of a.G.crew.filter(c=>c.cap))if(!seeds.has(c.cap))seeds.set(c.cap,seed);}
for(const [id,cap] of Object.entries({...backup,service:'CLG'}))for(const mode of ['n','r','s']){
 const def=now.SYSTEM_DEFS.find(s=>s.id===id);if(!def[mode]?.[cap])continue;
 for(const damaged of [false,...(mode==='n'?[true]:[])]){
  a.newGame(seeds.get(cap));a.G.drawn=[id];const s=a.sys(id),c=a.G.crew.find(c=>c.cap===cap);
  if(damaged)s.state='damaged';a.setMode(id,mode);const before={...a.computeTotals()};
  a.crewClick(c.id);a.cardClick(id);assert(c.used);assert.equal(a.computeTotals()[cap],(before[cap]||0)+2);
  for(const [other,value] of Object.entries(before))if(other!==cap)assert.equal(a.computeTotals()[other],value);
  a.setMode(id,mode);assert.equal(a.computeTotals()[cap]||0,0,'Uncommitting removes secondary output/bonus');
 }
}
// Service Sacrifice produces Engineering, not Cooling; it cannot consume a Cooling specialist.
a.newGame(seeds.get('CLG'));a.G.drawn=['service'];a.setMode('service','s');
const thermalCrew=a.G.crew.find(c=>c.cap==='CLG');a.crewClick(thermalCrew.id);a.cardClick('service');assert.equal(thermalCrew.used,false);
assert.equal(fs.readFileSync(path.join(root,'docs/capability-demand.md'),'utf8'),markdown(now,old),'Generated catalogue stays in sync');
console.log('PASS: redistributed demand, three promoted-capability producers each, failure effects preserved except relocated reboot damage, valid outputs and synchronized catalogue');
