// Ten-capability/sixteen-system contract and relocated support mechanics.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {load,arms}=require('./capability-demand.cjs');
const data=load();
assert.deepEqual(Object.keys(data.CAPS).sort(),['POW','THR','CON','ENG','NAV','SIG','DET','LFS','CLG','PRO'].sort());
assert.equal(data.SYSTEM_DEFS.length,16);
assert(!data.SYSTEM_DEFS.some(d=>['maincomp','medbay'].includes(d.id)));
const requirements={
 reboot:[{SIG:5}], 'e-firmware':[{ENG:2},{SIG:2}], 'sensor-alarm':[{DET:5},{SIG:5}],
 fabjam:[{ENG:4,SIG:3}], 'precision-nav':[{NAV:6,DET:4}], gnc:[{SIG:5,NAV:4,CON:3}],
 illness:[{LFS:5}], zerog:[{LFS:4}], 'e-cold':[{LFS:2},{CLG:3}],
 'e-recycler':[{LFS:2},{DET:2}], 'e-adaptation':[{LFS:3},{NAV:3}],
 'e-sleep':[{LFS:3},{SIG:3}], fatigue:[{LFS:5,SIG:3}], lscontam:[{ENG:4,LFS:4}]
};
for(const cards of Object.values(data.CRISES))for(const c of cards){
 if(requirements[c.id])assert.deepEqual(arms(c),requirements[c.id],c.id);
 for(const arm of arms(c))for(const cap of Object.keys(arm))assert(cap in data.CAPS);
 for(const key of ['damageSystem','damageSystem2','repairSystem'])if(c.fail[key])assert(data.SYSTEM_DEFS.some(d=>d.id===c.fail[key]));
}
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(){}}};
vm.createContext(ctx);vm.runInContext(source+`;render=()=>{};globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},sys,crew,crewClick,setMode,computeTotals,consume,resolveCrisis,destroySys,fabricate,endGame,showHelp,FITNESS_CONFIG,MULTI_SYSTEMS};`,ctx);
const a=ctx.a;
a.newGame();assert.equal(a.G.systems.length,16);assert.equal(a.G.crew.length,6);
assert.deepEqual(Object.keys(a.FITNESS_CONFIG.systems).sort(),data.SYSTEM_DEFS.map(d=>d.id).sort());
assert(a.MULTI_SYSTEMS.every(id=>data.SYSTEM_DEFS.some(d=>d.id===id)));
a.G.drawn=['fabricator'];a.G.components={Electronics:20,Wiring:20,'Power Cell':20};
for(const id of ['maincomp','medbay']){
 const before=JSON.stringify({systems:a.G.systems,components:a.G.components});
 assert.equal(a.fabricate('fabricator',id),false);
 assert.equal(JSON.stringify({systems:a.G.systems,components:a.G.components}),before);
 assert(a.G.log[0].msg.includes('Unknown system blueprint'));
}
// Signal and Control secondary supply survives the deleted Main Computer.
a.G.drawn=['fabricator','batteries'];a.setMode('fabricator','n');a.setMode('batteries','n');
assert.equal(a.computeTotals().SIG,1);assert.equal(a.computeTotals().CON,1);
for(const mode of ['r','s']){a.setMode('fabricator',mode);assert.equal(a.computeTotals().SIG,mode==='r'?2:3)}
// Service output backs up LFS checks, but never substitutes for the ship's oxygen passive.
a.newGame();a.G.drawn=['service'];a.setMode('service','n');assert.equal(a.computeTotals().LFS,1);
a.setMode('service','r');assert.equal(a.computeTotals().LFS,2);
a.setMode('service','s');assert.equal(a.computeTotals().LFS||0,0);
a.destroySys(a.sys('lifesupport'));a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,4);
// Doctor still heals first, supports Life Support otherwise, and cannot heal herself.
a.newGame();a.crewClick('doc');assert.equal(a.computeTotals().LFS,2);assert.equal(a.computeTotals().MED,undefined);
a.newGame();a.crew('cmdr').state='injured';a.crewClick('doc');assert.equal(a.crew('cmdr').state,'ok');assert.equal(a.computeTotals().LFS||0,0);
a.newGame();a.crew('doc').state='injured';a.crewClick('doc');assert.equal(a.crew('doc').state,'injured');assert.equal(a.crew('doc').used,false);
// Life Support Sacrifice retains the removed Medical Bay's heal alongside its oxygen effect.
a.newGame();a.G.drawn=['lifesupport'];a.crew('cmdr').state='injured';a.G.oxygen=2;
a.G.crisis={title:'Support sacrifice',req:{LFS:8},win:{},fail:{}};a.setMode('lifesupport','s');a.resolveCrisis();
assert.equal(a.crew('cmdr').state,'ok');assert.equal(a.sys('lifesupport').state,'destroyed');
assert(a.G.log.some(l=>l.msg.includes('RESOLVED: Support sacrifice')));
// Mission Data lives in Cargo Bay only; losing unrelated electronics does not lose it.
a.newGame();a.destroySys(a.sys('comms'));a.destroySys(a.sys('navcomp'));assert.equal(a.G.flags.dataLost,false);
a.endGame(true);assert(a.G.over.lines.some(l=>l[0]==='Mission data recovered'));
a.newGame();a.destroySys(a.sys('cargo'));assert.equal(a.G.flags.dataLost,true);
a.G.drawn=['fabricator'];a.G.components.Wiring=4;assert(a.fabricate('fabricator','cargo'));a.endGame(true);
assert(a.G.over.lines.some(l=>l[0]==='Mission data LOST'));
a.newGame();a.showHelp();assert(el('modal').innerHTML.includes('ten capabilities and sixteen initial systems'));
assert(!/Main Computer|Medical Bay|twelve-capability/.test(el('modal').innerHTML));
console.log('PASS: 10 capabilities/16 systems, remapped checks, valid targets, secondary supply, Doctor, sacrifice healing, oxygen passive and Mission Data');
