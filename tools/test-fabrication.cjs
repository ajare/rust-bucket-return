// Fabrication and duplicate-instance regressions against the actual inline engine.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();let click;
const element=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}})}return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:element,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(source+`
const renderUI=render;render=()=>{};
globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},sys,systemsOfType,systemOfType,
 SYSTEM_DEFS,MULTI_SYSTEMS,FABRICATION_COST,fabricate,fabricationReason,drawFive,setMode,computeTotals,computeHeat,
 destroySys,damageStep,damageEngine,damageRandomSystems,repair,patch,cannibalise,consume,addHeat,applyEffects,resolveCrisis,endGame,
 renderUI,showFabrication,closeModal};`,ctx);
const a=ctx.a;
function ready(){a.newGame();a.G.drawn=['fabricator'];a.G.components={Electronics:12,Wiring:12,'Power Cell':12};}
const snapshot=()=>JSON.parse(JSON.stringify(a.G));
assert.equal(a.FABRICATION_COST,4);assert.equal(a.MULTI_SYSTEMS.length,11);
// Every blueprint costs precisely four of its own component, with healthy independent state.
for(const def of a.SYSTEM_DEFS){
 ready();if(!a.MULTI_SYSTEMS.includes(def.id))a.destroySys(a.sys(def.id));
 a.G.components[def.comp]=4;const before={...a.G.components},oldDeck=a.G.deck.map(c=>c.id);
 const created=a.fabricate('fabricator',def.id);assert(created,def.id);
 assert.equal(a.G.components[def.comp],0);
 for(const type of Object.keys(before))if(type!==def.comp)assert.equal(a.G.components[type],before[type]);
 assert.equal(created.state,'op');assert.equal(created.mode,null);assert.equal(created.patched,false);
 assert.equal(created.seBoost,false);assert.equal(created.def.id,def.id);assert.notEqual(created.id,def.id);
 assert.equal(a.sys(created.id),created);assert.equal(a.G.systems.length,17);
 assert(!a.G.drawn.includes(created.id),'Never insert a fabricated card in the current hand');
 a.setMode(created.id,'n');assert.equal(created.mode,null,'A newly built card cannot be committed before a future draw');
 assert.deepEqual(Array.from(a.G.deck,c=>c.id),Array.from(oldDeck),'Do not add system cards to the crisis deck');
 assert.equal(a.sys('fabricator').mode,'b');assert.equal(a.computeTotals().ENG||0,0);assert.equal(a.computeHeat(),0);
 const count=a.G.systems.length,parts={...a.G.components};
 assert.equal(a.fabricate('fabricator','batteries'),false,'A builder can only build once per crisis');
 assert.equal(a.G.systems.length,count);assert.deepEqual({...a.G.components},parts);
 a.setMode('fabricator','n');assert.equal(a.sys('fabricator').mode,'b','Cannot undo fabrication to gain extra output');
}
// Guard failures spend no parts and add no system, even with abundant wrong-type components.
ready();a.G.components.Electronics=3;a.G.components.Wiring=100;
let before=snapshot();assert.equal(a.fabricate('fabricator','sensors'),false);
assert.equal(a.G.systems.length,before.systems.length);assert.deepEqual({...a.G.components},before.components);
assert.equal(a.sys('fabricator').mode,null);
assert.equal(a.fabricate('fabricator','unknown'),false);assert.equal(a.fabricate('sensors','sensors'),false);
ready();a.G.drawn=['sensors'];assert.equal(a.fabricate('fabricator','sensors'),false);
ready();a.sys('fabricator').state='damaged';a.patch('fabricator');
assert.equal(a.fabricate('fabricator','sensors'),false,'Patching a damaged builder is insufficient');
a.repair('fabricator');assert(a.fabricate('fabricator','sensors'));
for(const mode of ['n','r','s']){ready();a.setMode('fabricator',mode);assert.equal(a.fabricate('fabricator','sensors'),false);}
ready();a.destroySys(a.sys('fabricator'));assert.equal(a.fabricate('fabricator','sensors'),false);
ready();a.G.step='route';assert.equal(a.fabricate('fabricator','sensors'),false);
ready();a.G.over={win:false};assert.equal(a.fabricate('fabricator','sensors'),false);
// Single-live-copy limits include damaged systems; wreckage never revives and IDs never recycle.
for(const type of a.SYSTEM_DEFS.filter(d=>!a.MULTI_SYSTEMS.includes(d.id)).map(d=>d.id)){
 ready();assert.equal(a.fabricate('fabricator',type),false);
 a.sys(type).state='damaged';assert.equal(a.fabricate('fabricator',type),false);
 a.destroySys(a.sys(type));const second=a.fabricate('fabricator',type);assert(second);assert.equal(a.sys(type).state,'destroyed');
 a.drawFive();a.G.drawn=['fabricator'];assert.equal(a.fabricate('fabricator',type),false);
 a.destroySys(second);const third=a.fabricate('fabricator',type);assert(third);assert.notEqual(third.id,second.id);
}
// New cards draw normally. Two copies in one hand sum outputs without sharing damage or modes.
ready();const sensor=a.fabricate('fabricator','sensors');
for(const s of a.G.systems)if(!['fabricator','sensors',sensor.id].includes(s.id))a.destroySys(s);
a.drawFive();assert(a.G.drawn.includes(sensor.id));assert(a.G.drawn.includes('sensors'));assert.equal(a.G.drawn.length,3);
a.setMode('sensors','n');a.setMode(sensor.id,'r');assert.equal(a.computeTotals().DET,9);
a.G.crisis={title:'Instance test',req:{DET:9},win:{},fail:{}};a.resolveCrisis();
assert.equal(a.sys('sensors').state,'op');assert.equal(sensor.state,'damaged');
a.G.drawn=['sensors',sensor.id];a.G.components.Electronics=4;
a.patch(sensor.id);assert.equal(a.sys('sensors').patched,false);assert.equal(sensor.patched,true);
a.repair(sensor.id);assert.equal(sensor.state,'op');assert.equal(a.G.components.Electronics,1);
a.setMode('sensors','n');a.setMode(sensor.id,'s');assert.equal(a.computeTotals().DET,11);
a.G.crisis={title:'Sacrifice one copy',req:{DET:11},win:{},fail:{}};a.resolveCrisis();
assert.equal(sensor.state,'destroyed');assert.equal(a.sys('sensors').state,'op');assert(!a.G.drawn.includes(sensor.id));
ready();const salvage=a.fabricate('fabricator','sensors');a.cannibalise(salvage.id);
assert.equal(salvage.state,'destroyed');assert.equal(a.sys('sensors').state,'op');
ready();const survivor=a.fabricate('fabricator','sensors');a.G.drawn=['sensors',survivor.id];
a.destroySys(a.sys('sensors'));assert.deepEqual(Array.from(a.G.drawn),[survivor.id],'Destroy only the selected instance, not another copy in the hand');
// Backup Fabricators cannot fabricate until drawn, and independently consume their own use.
ready();const backup=a.fabricate('fabricator','fabricator');assert.equal(a.fabricate(backup.id,'sensors'),false);
a.drawFive();a.G.drawn=['fabricator',backup.id];assert(a.fabricate('fabricator','sensors'));
assert(a.fabricate(backup.id,'thermal'));assert.equal(a.computeTotals().ENG||0,0);
// Passive Life Support uses the best surviving copy, never adds duplicate oxygen bonuses.
ready();const support=a.fabricate('fabricator','lifesupport');
a.G.oxygen=3;a.consume();assert.equal(a.G.oxygen,3,'Operational backups do not restore oxygen each turn');
a.destroySys(a.sys('lifesupport'));a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,6);
support.state='damaged';a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,5);
a.destroySys(support);a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,4);
ready();const vulnerable=a.fabricate('fabricator','sensors');
for(const s of a.G.systems)if(s.id!==vulnerable.id)a.destroySys(s);
a.damageRandomSystems(1);assert.equal(vulnerable.state,'damaged','New cards can take ship damage before being drawn');
// Named failures and repairs find replacements instead of striking the original wreckage.
ready();a.destroySys(a.sys('lifesupport'));const replacement=a.fabricate('fabricator','lifesupport');
a.applyEffects({damageSystem:'lifesupport'});assert.equal(replacement.state,'damaged');
a.applyEffects({repairSystem:'lifesupport'});assert.equal(replacement.state,'op');
assert.equal(a.sys('lifesupport').state,'destroyed');
// SCRAM lockout and damage include constructed power systems; burn damage includes new thrusters.
ready();const aux=a.fabricate('fabricator','aux');a.G.drawn=[aux.id];a.G.flags.noRedline=true;
a.setMode(aux.id,'r');assert.equal(aux.mode,null);
a.G.flags.noRedline=false;a.setMode(aux.id,'r');assert.equal(a.computeTotals().POW,4);assert.equal(a.computeHeat(),2);
for(const s of a.G.systems)if(['reactor','aux','batteries','fuelcells'].includes(s.def.id)&&s.id!==aux.id)a.destroySys(s);
a.G.heat=4;a.addHeat(1);assert.equal(aux.state,'damaged');assert.equal(a.G.flags.noRedline,true);
ready();const thruster=a.fabricate('fabricator','thrusters');a.destroySys(a.sys('engine'));a.destroySys(a.sys('thrusters'));
a.damageEngine();assert.equal(thruster.state,'damaged');
// A new engine can recover the ship, but reconstructed storage cannot resurrect mission data.
ready();a.destroySys(a.sys('cargo'));a.fabricate('fabricator','cargo');assert.equal(a.G.flags.dataLost,true);
a.drawFive();a.G.drawn=['fabricator'];a.destroySys(a.sys('engine'));a.destroySys(a.sys('thrusters'));a.fabricate('fabricator','engine');
a.endGame(true);assert.equal(a.G.over.win,true);
assert(a.G.over.lines.some(l=>l[0]==='Spacecraft recovered'));assert(a.G.over.lines.some(l=>l[0]==='Mission data LOST'));
// UI exposes costs, availability, limits and exact instance IDs; delegated Build works.
ready();a.renderUI();a.showFabrication('fabricator');
assert(element('modal').innerHTML.includes('4× Electronics'));assert(element('modal').innerHTML.includes('One surviving copy only'));
click({target:{closest:()=>({dataset:{act:'fabricate',id:'fabricator',type:'sensors'}})}});
const built=a.systemsOfType('sensors')[1];assert(built);a.renderUI();
assert(!element('modalOverlay').classList.contains('show'));
assert(element('tableau').innerHTML.includes('data-id="'+built.id+'"'));assert(element('tableau').innerHTML.includes('Sensors #2'));
assert(element('drawn').innerHTML.includes('Fabricated this crisis'));assert(!element('drawn').innerHTML.includes('data-id="'+built.id+'"'));
const initialIds=a.SYSTEM_DEFS.map(d=>d.id);
click({target:{closest:()=>({dataset:{act:'restartgame'}})}});assert.equal(a.G.systems.length,16);
assert.deepEqual(Array.from(a.G.systems,s=>s.id),Array.from(initialIds));
console.log('PASS: all fabrication costs/guards, copy limits, independent draw/commitment/damage, passive redundancy, targeting, scoring and UI');
