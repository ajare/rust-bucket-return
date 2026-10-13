// Asset-only macro fitness and DEBUG UI: no gameplay/world-state coupling.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();let click;
const el=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}})}return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(source+`
const renderUI=render;render=()=>{};
globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},handFitness,handFitnessBreakdown,FITNESS_CONFIG,SYSTEM_DEFS,MULTI_SYSTEMS,renderUI,renderFitness,drawFive,crew,sys,showModal};`,ctx);
const a=ctx.a,clone=x=>JSON.parse(JSON.stringify(x));
const dispatch=act=>click({target:{closest:()=>({dataset:{act}})}});
a.newGame();const opening=clone(a.G),f=a.handFitness(),snapshot=JSON.stringify(a.G);
assert(f>0&&f<1);assert.equal(JSON.stringify(a.G),snapshot,'Pure fitness must not mutate state');
assert.deepEqual(Object.keys(a.FITNESS_CONFIG.systems).sort(),Array.from(a.SYSTEM_DEFS,d=>d.id).sort());
assert.equal(Object.values(a.FITNESS_CONFIG.weights).reduce((s,n)=>s+n,0),1);
// Enforce the input boundary with forbidden getters, not merely a few coincidentally equal cases.
const assets={systems:opening.systems,crew:opening.crew,components:opening.components};
for(const key of ['drawn','deck','pools','crisis','difficulty','phase','turn','step','heat','oxygen','course','flags','over','ongoing','crewBonus','pendingCmdr','pendingSE','pendingSpecialist'])Object.defineProperty(assets,key,{get(){throw new Error('Fitness read forbidden '+key)}});
assert.equal(a.handFitness(assets),f);
const temporary=clone(opening);
for(const s of temporary.systems){s.mode='s';s.patched=true;s.seBoost=true;s.specialists=['computer'];s.fabricated='fabricator#99';s.damage={cause:'irrelevant log'};}
for(const c of temporary.crew){c.used=true;c.injury={cause:'irrelevant annotation'};c.death={cause:'irrelevant annotation'};}
assert.equal(a.handFitness(temporary),f,'Ignore temporary commitments/boosts and provenance');
// Fitness responds monotonically to asset health while resources are held fixed.
for(const system of opening.systems){
 const damaged=clone(opening);damaged.systems.find(s=>s.id===system.id).state='damaged';
 const destroyed=clone(opening);destroyed.systems.find(s=>s.id===system.id).state='destroyed';
 assert(a.handFitness(damaged)<f,system.id+' damage lowers fitness');assert(a.handFitness(destroyed)<a.handFitness(damaged));
}
for(const crew of opening.crew){
 const injured=clone(opening);injured.crew.find(c=>c.id===crew.id).state='injured';
 const dead=clone(opening);dead.crew.find(c=>c.id===crew.id).state='dead';
 assert(a.handFitness(injured)<f);assert(a.handFitness(dead)<a.handFitness(injured));
}
const noDoctor=clone(opening),noSpecialist=clone(opening);noDoctor.crew[2].state='dead';noSpecialist.crew[4].state='dead';
assert(a.handFitness(noDoctor)<a.handFitness(noSpecialist),'Doctor health is more valuable than one capability specialist');
const noLifeSupport=clone(opening),noCargo=clone(opening);noLifeSupport.systems.find(s=>s.id==='lifesupport').state='destroyed';noCargo.systems.find(s=>s.id==='cargo').state='destroyed';
assert(a.handFitness(noLifeSupport)<a.handFitness(noCargo),'Critical Life Support outranks passive Cargo');
// Replacement recovery, backup value, and saturation: never count wrecks or unbounded duplicate spam.
const backup=clone(opening),nav=backup.systems.find(s=>s.id==='navcomp');backup.systems.push({...clone(nav),id:'navcomp#2'});
assert(a.handFitness(backup)>f);const oneBackup=a.handFitness(backup);
for(let i=3;i<30;i++)backup.systems.push({...clone(nav),id:'navcomp#'+i});assert.equal(a.handFitness(backup),oneBackup);
const replacement=clone(opening),old=replacement.systems.find(s=>s.id==='navcomp');old.state='destroyed';replacement.systems.push({...clone(nav),id:'navcomp#2'});
assert.equal(a.handFitness(replacement),f,'A healthy replacement restores the original contribution');
// Typed spares saturate at four of each type; diversity matters and negative input gives no credit.
const none=clone(opening);none.components={Electronics:0,Wiring:0,'Power Cell':0};assert(a.handFitness(none)<f);
const full=clone(opening);full.components={Electronics:4,Wiring:4,'Power Cell':4};assert(a.handFitness(full)>f);
const overstock=clone(full);overstock.components={Electronics:100000,Wiring:100000,'Power Cell':100000};assert.equal(a.handFitness(overstock),a.handFitness(full));
const concentrated=clone(opening);concentrated.components={Electronics:6,Wiring:0,'Power Cell':0};assert(a.handFitness(concentrated)<f);
const negative=clone(none);negative.components.Wiring=-100;assert.equal(a.handFitness(negative),a.handFitness(none));
// Endpoints are based only on assets, not G.over or any victory/loss flag.
const ideal=clone(full);for(const type of a.MULTI_SYSTEMS){const s=ideal.systems.find(x=>x.def.id===type);ideal.systems.push({...clone(s),id:type+'#2'})}assert.equal(a.handFitness(ideal),1);
const allDead=clone(ideal);for(const c of allDead.crew)c.state='dead';assert.equal(a.handFitness(allDead),0);
const allDestroyed=clone(ideal);for(const s of allDestroyed.systems)s.state='destroyed';assert.equal(a.handFitness(allDestroyed),0);
assert.equal(a.handFitness({systems:[],crew:[],components:{}}),0);assert.equal(a.handFitness(null),0);
// Stress valid asset configurations and order invariance.
for(let i=0;i<256;i++){
 const s=clone(opening);for(let k=0;k<s.systems.length;k++)s.systems[k].state=['op','damaged','destroyed'][(i*(k+1)+k)%3];
 for(let k=0;k<s.crew.length;k++)s.crew[k].state=['ok','injured','dead'][(i+k)%3];
 s.components={Electronics:i%9,Wiring:i%13,'Power Cell':i%7};const value=a.handFitness(s);assert(Number.isFinite(value)&&value>=0&&value<=1);
 s.systems.reverse();s.crew.reverse();assert(Math.abs(a.handFitness(s)-value)<1e-12);
}
// DEBUG placement, initial hiding, live updates, tooltip breakdown, aria state and toggle noninterference.
assert.match(html,/data-act="restartgame"[^>]*>Restart Game<\/button>\s*<button id="debugBtn"/);
a.newGame();a.renderUI();assert.equal(el('fitnessDebug').hidden,true);assert.equal(el('debugBtn').ariaPressed,'false');
const beforeToggle=JSON.stringify(a.G);dispatch('debug');assert.equal(JSON.stringify(a.G),beforeToggle);
assert.equal(el('fitnessDebug').hidden,false);assert.equal(el('debugBtn').ariaPressed,'true');assert(el('debugBtn').classList.contains('on'));
assert.equal(el('fitnessDebug').textContent,'FITNESS '+f.toFixed(4));assert(el('fitnessDebug').title.includes('Systems (55%)'));assert(el('fitnessDebug').title.includes('not win probability'));
a.sys('lifesupport').state='damaged';a.renderUI();assert.equal(el('fitnessDebug').textContent,'FITNESS '+a.handFitness().toFixed(4));
a.showModal('Existing modal');dispatch('debug');assert.equal(el('modal').innerHTML,'Existing modal');assert.equal(el('fitnessDebug').hidden,true);
// UI preference persists across restart, but neither it nor evaluating fitness changes seeded game state/RNG.
dispatch('debug');a.newGame(12345);const seeded=JSON.stringify(a.G);a.handFitness();dispatch('debug');dispatch('debug');a.drawFive();const drawn=JSON.stringify(a.G);
a.newGame(12345);assert.equal(JSON.stringify(a.G),seeded);a.drawFive();assert.equal(JSON.stringify(a.G),drawn);
dispatch('restartgame');assert.equal(JSON.stringify(a.G),seeded);assert.equal(el('fitnessDebug').hidden,false);
console.log('PASS: bounded weighted asset fitness, critical roles/systems, backups/spares, strict world/draw/temporary independence, DEBUG toggle/update/aria, purity and seeded RNG');
