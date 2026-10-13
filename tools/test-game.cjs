// Engine regressions required for trustworthy balance simulations.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const stub=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},disabled:false});
const elements=new Map();
const ctx={URLSearchParams,location:{search:'?seed=1'},document:{getElementById(id){if(!elements.has(id))elements.set(id,stub());return elements.get(id)},addEventListener(){}}};
vm.createContext(ctx);vm.runInContext(source+`
render=()=>{};
globalThis.a={get G(){return G},newGame(seed=1){SEED=seed;newGame()},injureCrew,sys,crewClick,repair,patch,half,consume,fxText,
 computeTotals,setMode,resolveCrisis,CRISES,REENTRY,FAILURE_BALANCE,BASE_FAILURES,capFailureTracks,applyEffects,
 cannibalise,cannibaliseGains,renderDrawn,renderTableau,cardTooltip,destroySys,destroyRandomSystems,damageRandomSystems,damageStep,crew};`,ctx);
const a=ctx.a;
a.newGame();a.injureCrew(50,'regression: excess injury hits');
assert(a.G.over&&!a.G.over.win,'Excess injury hits must terminate an all-dead ship');
assert(a.G.crew.every(c=>c.state==='dead'));
// Every destruction path ends a hulk, not only random system damage.
for(const destroy of ['destroySys','destroyRandomSystems','cannibalise','damageStep']){
 a.newGame();
 for(const s of a.G.systems.slice(0,-1))s.state='destroyed';
 const last=a.G.systems[a.G.systems.length-1];
 if(destroy==='destroySys')a.destroySys(last,'test');
 else if(destroy==='destroyRandomSystems')a.destroyRandomSystems(1);
 else if(destroy==='cannibalise')a.cannibalise(last.id);
 else{a.G.drawn=[];last.state='damaged';a.damageStep(last,'test')}
 assert(a.G.over&&!a.G.over.win,'Last system destroyed via '+destroy+' must end the run');
 assert.equal(a.G.over.title,'SHIP REDUCED TO A HULK');
}
a.newGame();a.destroySys(a.sys('cargo'),'test');assert(!a.G.over,'Surviving systems keep the run alive');
// Cargo Bay has no use modes: Sacrifice is not offered (005-M1).
a.newGame();a.G.drawn=['cargo'];
a.setMode('cargo','s');
assert.equal(a.sys('cargo').mode,null,'Cargo Bay must not accept a Sacrifice commitment');
a.renderDrawn();
assert.match(elements.get('drawn').innerHTML,/data-mode="s" disabled/,'The Sacrifice button is disabled on Cargo Bay');
// Armed Commander and Systems Engineer abilities can be stood down before targeting (005-M2).
a.newGame();
a.crewClick('cmdr');assert.equal(a.crew('cmdr').used,true);assert.equal(a.G.pendingCmdr,true);
a.crewClick('cmdr');assert.equal(a.crew('cmdr').used,false,'Cancelling the Commander refunds the ability');assert.equal(a.G.pendingCmdr,false);
a.crewClick('syseng');assert.equal(a.G.pendingSE,true);
a.crewClick('syseng');assert.equal(a.crew('syseng').used,false,'Cancelling the Systems Engineer refunds the ability');assert.equal(a.G.pendingSE,false);
// The totals bar mirrors the resolution surplus-cooling rule: cheapest OR arm (005-M3).
a.newGame();
a.G.crisis=a.CRISES[1].find(c=>c.id==='e-warmbus'); // CLG 2 OR NAV 3 (curated into Phase I)
a.G.drawn=['thermal'];a.setMode('thermal','n'); // CLG 3
a.renderDrawn();
assert.match(elements.get('totals').innerHTML,/COOLING −3 HEAT/,'All cooling is surplus when the cheapest arm needs none');
// Redlining a system the crisis already damaged credits both causes (005-M5).
a.newGame();
a.G.crisis={id:'m5',cat:'ELECTRICAL',title:'M5',flavor:'',req:{POW:99},fail:{damageSystem:'thermal'},win:{}};
a.G.drawn=['thermal'];a.setMode('thermal','r');
a.resolveCrisis();
assert.equal(a.sys('thermal').state,'destroyed');
assert(a.G.log.some(l=>l.msg==='Thermal Control is DESTROYED by redlining (already damaged by the crisis).'),'Redline credit must note the crisis damage');
a.newGame();a.G.flags.shelter=2;a.injureCrew(2,'shelter test');
assert.equal(a.G.flags.shelter,0);assert(a.G.crew.every(c=>c.state==='ok'));
a.G.crew.find(c=>c.id==='doc').state='injured';a.crewClick('doc');
assert.equal(a.G.crew.find(c=>c.id==='doc').used,false,'An injured Doctor must be unavailable');
a.newGame();a.sys('thermal').state='damaged';a.patch('thermal');
assert.equal(a.sys('thermal').state,'damaged');assert.equal(a.sys('thermal').patched,true);
a.G.components.Wiring=2;a.repair('thermal');
assert.equal(a.sys('thermal').state,'op');assert.equal(a.G.components.Wiring,0);
assert.equal(a.half({POW:3}).POW,1);
// Only operational systems can be cannibalised; temporary full-output bonuses do not qualify.
for(const support of ['none','patch','crew']){
 a.newGame();const s=a.sys('thermal');s.state='damaged';a.G.drawn=['thermal'];
 if(support==='patch')a.patch(s.id);
 if(support==='crew')s.seBoost=true;
 const before=JSON.stringify(a.G);a.cannibalise(s.id);
 assert.equal(JSON.stringify(a.G),before,'Blocked cannibalisation must not change parts, draws, assignments or state');
 a.renderDrawn();a.renderTableau();
 for(const panel of ['drawn','tableau'])assert.match(elements.get(panel).innerHTML,/data-act="cann" data-id="thermal" disabled/);
 assert(a.cardTooltip(s).includes('Unavailable until permanently repaired'));
 a.G.components.Wiring=2;a.repair(s.id);assert.equal(s.state,'op');
 a.renderDrawn();a.renderTableau();
 for(const panel of ['drawn','tableau'])assert.doesNotMatch(elements.get(panel).innerHTML,/data-act="cann" data-id="thermal" disabled/);
 const gains=Array.from(a.cannibaliseGains(s)),parts={...a.G.components};a.cannibalise(s.id);
 assert.equal(s.state,'destroyed');assert(!a.G.drawn.includes(s.id));
 for(const type of Object.keys(parts))assert.equal(a.G.components[type],parts[type]+gains.filter(t=>t===type).length);
 const wreckage=JSON.stringify(a.G);a.cannibalise(s.id);a.cannibalise('unknown');assert.equal(JSON.stringify(a.G),wreckage);
}
// Either arm must resolve without requiring the other arm.
for(const [id,mode] of [['service','r'],['thermal','n']]){
 a.newGame();const crisis=a.CRISES[1].find(c=>c.id==='e-smoke');
 a.G.crisis=crisis;a.G.drawn=[id];a.setMode(id,mode);
 const t=a.computeTotals();assert(t.ENG>=3||t.CLG>=3);
 const oxygen=a.G.oxygen,healthy=a.G.crew.filter(c=>c.state==='ok').length;
 a.resolveCrisis();assert.equal(a.G.oxygen,oxygen);
 assert(a.G.log.some(l=>l.msg.startsWith('RESOLVED: '+crisis.title)),'Each committed OR arm actually succeeds');
 assert.equal(a.G.crew.filter(c=>c.state==='ok').length,healthy,'Meeting one OR arm must not apply failure injuries');
}
a.newGame();a.G.drawn=['batteries'];a.G.flags.noRedline=true;a.setMode('batteries','r');
assert.equal(a.sys('batteries').mode,null,'SCRAM must prevent power redline');
const major=a.CRISES[1].find(c=>c.id==='gyro'),minor=a.CRISES[1].find(c=>c.id==='e-ephemeris');
assert.equal(major.fail.course,1);assert.equal(major.fail.injure,1,'Phase I major injuries must be softer');
assert.equal(a.CRISES[1].find(c=>c.id==='e-smoke').fail.injure,undefined,'Do not display zero injury effects');
assert.equal(a.CRISES[1].find(c=>c.id==='co2').fail.injure,2,'Preserve CO₂ Buildup failure injuries after adding an OR arm');
assert.equal(a.CRISES[3].find(c=>c.id==='gnc').fail.injure,1,'Return adds one hit on major failures');
assert.equal(a.CRISES[3].find(c=>c.id==='e-turbulence').fail.injure,undefined);
assert.equal(a.CRISES[2].find(c=>c.id==='illness').fail.injure,2,'Transit retains authored injuries without added hits');
assert.equal(a.REENTRY.fail.injure,2,'Final RE-ENTRY remains unchanged');
assert.equal(a.CRISES[2].find(c=>c.id==='puncture').fail.oxygen,-3,'Moved environment cards use destination track caps');
assert.equal(a.CRISES[2].find(c=>c.id==='scrubber').fail.oxygen,-3);
assert.equal(a.CRISES[3].find(c=>c.id==='gnc').fail.course,2);
assert.equal(a.BASE_FAILURES.puncture.oxygen,-2,'Retain original effects for historical controls');
for(const [phase,heat,oxygen,course] of [[1,2,2,1],[2,3,3,1],[3,3,3,2]]){
 const input={heat:9,oxygen:-9,course:9,injure:5,ongoing:{oxygen:-1,turns:2}};
 const capped=a.capFailureTracks(input,phase);
 assert.equal(capped.heat,heat);assert.equal(capped.oxygen,-oxygen);assert.equal(capped.course,course);
 assert.equal(capped.injure,5);assert.equal(capped.ongoing,input.ongoing);assert.equal(input.heat,9,'Do not mutate the uncapped source');
 a.newGame();a.applyEffects(a.capFailureTracks({heat:9,oxygen:-9,course:9},phase),'failure');
 assert.equal(a.G.heat,heat);assert.equal(a.G.oxygen,6-oxygen);assert.equal(a.G.course,course);
 const benefits=a.capFailureTracks({heat:-4,oxygen:4,course:-2},phase);
 assert.equal(benefits.heat,-4);assert.equal(benefits.oxygen,4);assert.equal(benefits.course,-2);
 for(const c of a.CRISES[phase]){
  assert((c.fail.heat||0)<=heat,c.id);assert((c.fail.oxygen||0)>=-oxygen,c.id);assert((c.fail.course||0)<=course,c.id);
 }
}
assert.equal(minor.fail.course,1);assert.equal(minor.fail.injure,undefined,'Moved OR cards use gentler Phase-I injury pressure');assert.equal(minor.win.course,-1);
assert(!a.CRISES[1].some(c=>c.id==='sensor-alarm'),'Sensor Fault Alarm must not appear in Phase I');
const sensorAlarm=a.CRISES[2].find(c=>c.id==='sensor-alarm');
assert(sensorAlarm,'Sensor Fault Alarm belongs to Phase II');
assert.equal(sensorAlarm.fail.injure,1,'Preserve Sensor Fault Alarm’s original hit without added Transit injuries');
assert.equal(sensorAlarm.fail.forecastHidden,2);assert.equal(sensorAlarm.req.DET,5);
assert.equal(sensorAlarm.alt.SIG,5);
for(const id of ['sensors','comms']){
 a.newGame();a.G.crisis=sensorAlarm;a.G.drawn=[id];a.setMode(id,'r');
 const totals=a.computeTotals();assert(totals.DET>=5||totals.SIG>=5);
 a.resolveCrisis();assert(a.G.crew.every(c=>c.state==='ok'),'Either Sensor Fault Alarm arm must avoid failure injuries');
 assert.equal(a.G.flags.forecastHidden,0,'Either arm must avoid the forecast penalty');
}
const co2=a.CRISES[1].find(c=>c.id==='co2');
assert.equal(co2.req.LFS,6);assert.equal(co2.alt.ENG,5);
assert.equal(co2.fail.oxygen,-2);assert.equal(co2.fail.ongoing.oxygen,-1);assert.equal(co2.fail.ongoing.turns,3);
for(const id of ['lifesupport','fabricator']){
 a.newGame();a.G.crisis=co2;a.G.drawn=[id];a.setMode(id,'r');
 const totals=a.computeTotals();assert(totals.LFS>=6||totals.ENG>=5);
 a.resolveCrisis();assert(a.G.crew.every(c=>c.state==='ok'),'Either CO₂ Buildup arm must avoid failure injuries');
 assert.equal(a.G.ongoing.length,0,'Either arm must avoid ongoing CO₂ penalties');
}
const fuelLine=a.CRISES[1].find(c=>c.id==='fuelline');
assert.equal(fuelLine.req.ENG,5);assert.equal(fuelLine.alt.POW,7);
assert.equal(fuelLine.fail.damageSystem,'fuelcells');assert.equal(fuelLine.fail.injure,1,'Keep the existing major failure pressure');
assert.equal(a.BASE_FAILURES.fuelline.injure,undefined,'Do not alter the original failure baseline');
for(const [id,mode] of [['fabricator','r'],['reactor','r']]){
 a.newGame();a.G.crisis=fuelLine;a.G.drawn=[id];a.setMode(id,mode);
 const t=a.computeTotals();assert(t.ENG>=5||t.POW>=7);
 a.resolveCrisis();assert.equal(a.sys('fuelcells').state,'op');assert(a.G.crew.every(c=>c.state==='ok'));
}
a.newGame();a.G.crisis=fuelLine;a.G.drawn=[];a.resolveCrisis();
assert.equal(a.sys('fuelcells').state,'damaged');assert.equal(a.G.crew.filter(c=>c.state==='injured').length,1);
// Playability compromise: preserve authored hits, soften crew pressure, add wear on major failures only.
const additions={1:{major:1,minor:0},2:{major:0,minor:0},3:{major:1,minor:0}};
for(const [phase,cards] of Object.entries(a.CRISES))for(const card of cards){
 const tier=card.failureTier||(card.alt?'minor':'major'),base=a.BASE_FAILURES[card.id];
 assert.equal(card.fail.injure||0,(base.injure||0)+additions[phase][tier],card.id+' exact authored + phase injury hits');
 assert.equal(card.fail.damageRandom||0,(base.damageRandom||0)+(tier==='major'?1:0),card.id+' exact authored + major wear');
 assert.equal(card.fail.damageSystem,base.damageSystem,card.id+' preserve named damage');
 assert.equal(card.fail.damageSystem2,base.damageSystem2,card.id+' preserve second named damage');
 assert.equal(card.fail.destroyRandom,base.destroyRandom,card.id+' preserve authored destruction');
}
assert.equal(fuelLine.fail.damageRandom,1,'Explicitly major OR Fuel Line Blockage also adds wear');
assert.equal(a.BASE_FAILURES.fuelline.damageRandom,undefined,'Balanced wear must not leak into baseline definitions');
assert.equal(a.REENTRY.fail.destroyRandom,2);assert.equal(a.REENTRY.fail.damageRandom,undefined,'No new wear on final Re-entry');
// Later air failures lose one extra Oxygen on their FIRST Consume only; rates/durations stay unchanged.
const airCards=Object.entries(a.CRISES).flatMap(([phase,cards])=>cards.filter(c=>c.fail.ongoing).map(c=>({phase:Number(phase),c})));
assert.deepEqual(airCards.filter(x=>x.phase>1).map(x=>x.c.id).sort(),['co2acc','scrubber']);
for(const {phase,c} of airCards){
 const base=a.BASE_FAILURES[c.id].ongoing;
 assert.equal(c.fail.ongoing.turns,base.turns);
 assert.equal(c.fail.ongoing.initialDrain||0,phase>1?1:0);assert.equal(base.initialDrain,undefined);
 assert.equal(c.fail.ongoing.oxygen,base.oxygen);assert.equal(c.fail.ongoing.text,base.text);
 assert(a.fxText(c.fail).includes('for '+c.fail.ongoing.turns+' turns'));
 if(phase>1){
  assert.equal(base.turns,3);assert.equal(c.fail.ongoing.turns,3);
  assert(a.fxText(c.fail).includes('extra −1 Oxygen on the first Consume'));
  a.newGame();a.applyEffects({ongoing:c.fail.ongoing});
  for(let i=0;i<3;i++){a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,6+c.fail.ongoing.oxygen-(i===0?1:0));}
  assert.equal(a.G.ongoing.length,0);a.G.oxygen=6;a.consume();assert.equal(a.G.oxygen,6);
  assert.equal(c.fail.ongoing.initialDrain,1,'Consume must not mutate crisis definitions');assert.equal(base.turns,3);
 }
}
const minorCount=Object.values(a.CRISES).flat().filter(c=>c.alt).length;
assert.equal(minorCount,38,'Retain existing OR variants plus Fuel Line Blockage');
console.log('PASS: death overshoot, shelter, injured crew, patch/repair, operational-only cannibalisation/UI, rounding, OR arms, SCRAM, phase injury totals, failure track caps and deck content');
