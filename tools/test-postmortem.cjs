const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();let click;
function el(id){if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}})}return elements.get(id)}
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:el,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(source+`
const renderUI=render;render=()=>{};
globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},postMortem,postMortemHtml,renderUI,
 damageStep,destroySys,cannibalise,repair,patch,fabricate,injureCrew,healCrew,crewClick,consume,log,
 endGame,gameOver,showGameOverModal,resolveCrisis,sys,crew,setMode,deathDescription,DEATH_DESCRIPTIONS,CRISES,REENTRY,drawFive};`,ctx);
const a=ctx.a;
// Every authored crisis has a distinct mechanism, persisted on death without using gameplay RNG.
const cards=Object.values(a.CRISES).flat().concat(a.REENTRY);
assert.deepEqual(Object.keys(a.DEATH_DESCRIPTIONS).sort(),Array.from(cards,c=>c.id).sort());
assert.equal(new Set(Object.values(a.DEATH_DESCRIPTIONS)).size,cards.length);
for(const crisis of cards){
 a.newGame();a.G.crisis=crisis;a.injureCrew(6,'crisis consequence');a.injureCrew(1,'crisis consequence');
 const dead=a.G.crew.find(c=>c.state==='dead');assert(dead.death.description.startsWith(a.DEATH_DESCRIPTIONS[crisis.id]));
 assert(dead.death.description.includes('earlier, unhealed injuries'));
 a.showGameOverModal(); // No modal until the run actually ends.
}
a.newGame(13579);a.G.crisis=a.CRISES[3].find(c=>c.id==='radstorm');a.injureCrew(6,'crisis consequence');
const unchanged=JSON.stringify(a.G);for(let i=0;i<20;i++)a.deathDescription(a.G.crew[i%6],'crisis consequence');assert.equal(JSON.stringify(a.G),unchanged);
a.injureCrew(1,'crisis consequence');a.drawFive();const narrated=JSON.stringify(a.G);
a.newGame(13579);a.G.crisis=a.CRISES[3].find(c=>c.id==='radstorm');a.injureCrew(6,'crisis consequence');a.injureCrew(1,'crisis consequence');a.drawFive();
assert.equal(JSON.stringify(a.G),narrated,'Narrative generation must not advance random choices');
// Final damage valuations, independent fabricated copies, component totals and read-only reporting.
a.newGame();a.damageStep(a.sys('thermal'),'coolant rupture');a.patch('thermal');a.damageStep(a.sys('sensors'),'radiation storm');
a.cannibalise('cargo');a.destroySys(a.sys('reactor'),'reactor explosion');
a.G.drawn=['fabricator'];a.G.components.Electronics=8;const child=a.fabricate('fabricator','sensors');assert(child);
a.destroySys(child,'meteor impact');a.G.components.Electronics=1;a.G.components.Wiring=2;a.G.components['Power Cell']=9;
const before=JSON.stringify(a.G),p=a.postMortem();assert.equal(JSON.stringify(a.G),before);
assert.equal(p.systems.length,17);assert.equal(p.repairs.Wiring,2);assert.equal(p.repairs.Electronics,2);
assert.equal(p.replacements.Wiring,4);assert.equal(p.replacements.Electronics,4);assert.equal(p.replacements['Power Cell'],4);
assert.deepEqual({...p.gross},{Electronics:6,Wiring:6,'Power Cell':4});
assert.deepEqual({...p.deficit},{Electronics:5,Wiring:4,'Power Cell':0});
assert.equal(p.systems.find(s=>s.id===child.id).incident.cause,'meteor impact');
assert.equal(p.systems.find(s=>s.id==='cargo').incident.cause,'cannibalised for components');
const parts=JSON.stringify(a.G.components);a.endGame(true);assert(a.G.over.win);const score=a.G.over.score;
a.renderUI();assert.equal(el('reportBtn').disabled,false);assert(el('modal').innerHTML.includes('POST-MORTEM — MISSION SURVIVED'));
assert(el('modal').innerHTML.includes('Sensors #2'));assert(el('modal').innerHTML.includes('Gross damage bill'));
assert(el('modal').innerHTML.includes('FINAL SCORE'));assert(el('modal').innerHTML.includes('No components or score are deducted'));
for(const c of a.G.crew)assert(el('modal').innerHTML.includes(c.name));
assert.equal(JSON.stringify(a.G.components),parts);assert.equal(a.G.over.score,score);
// Provenance is not reconstructed from the rolling log, and keeps the previous injury plus fatal hit.
a.newGame();a.G.turn=4;a.G.phase=2;a.G.crisis={title:'CREW ILLNESS'};a.injureCrew(6,'crisis consequence');
a.G.turn=11;a.G.phase=3;a.G.crisis={title:'MICROMETEOR CASCADE'};a.injureCrew(6,'crisis consequence');
assert(a.G.over&&!a.G.over.win);
for(const c of a.G.crew){assert.equal(c.death.turn,11);assert.equal(c.death.phase,3);assert.equal(c.death.crisis,'MICROMETEOR CASCADE');assert.equal(c.death.priorInjury.crisis,'CREW ILLNESS');assert.equal(c.death.priorInjury.turn,4)}
for(let i=0;i<100;i++)a.log('Later diagnostic '+i);assert.equal(a.G.log.length,80);assert(!a.G.log.some(l=>l.msg.includes('is dead')));
a.showGameOverModal();const report=el('modal').innerHTML;
assert(report.includes('POST-MORTEM — MISSION LOST'));assert.equal((report.match(/Fatal hit:/g)||[]).length,6);
assert(report.includes('MICROMETEOR CASCADE'));assert(report.includes('CREW ILLNESS'));assert(report.includes('turn 11, Phase III'));
assert(!report.includes('FINAL SCORE'));
// Suffocation is labelled Consume, not falsely blamed on a pending crisis (e.g. re-entry).
a.newGame();a.injureCrew(6,'earlier wound');a.G.oxygen=0;a.G.crisis={title:'RE-ENTRY'};
for(let i=0;i<6;i++)a.consume();
for(const c of a.G.crew){assert.equal(c.death.cause,'suffocation');assert.equal(c.death.crisis,null);assert(c.death.description.includes('hypoxic respiratory failure'));assert(!c.death.description.includes('re-entry'))}
a.newGame();a.G.ongoing=[{key:'co2',text:'CO₂ buildup: −1 O₂ per turn',oxygen:-1,turns:3}];a.destroySys(a.sys('lifesupport'));
assert(a.deathDescription(a.crew('cmdr'),'suffocation').includes('combined CO₂ poisoning'));
assert(a.deathDescription(a.crew('cmdr'),'suffocation').includes('Every Life Support unit had been destroyed'));
// Restore a suffocation-only finished run for the existing UI checks.
a.newGame();a.injureCrew(6,'earlier wound');a.G.oxygen=0;for(let i=0;i<6;i++)a.consume();
a.showGameOverModal();assert(el('modal').innerHTML.includes('Suffocation — Oxygen depleted during Consume'));
// Healing removes stale injury provenance; repaired systems have no outstanding damage valuation.
a.newGame();a.injureCrew(6,'old wound');a.healCrew(6);assert(a.G.crew.every(c=>c.injury===null));
a.injureCrew(6,'new wound');a.injureCrew(1,'fatal impact');
const casualty=a.G.crew.find(c=>c.state==='dead');assert.equal(casualty.death.priorInjury.cause,'new wound');
a.newGame();a.damageStep(a.sys('thermal'),'old damage');a.G.components.Wiring=2;a.repair('thermal');
assert.equal(a.sys('thermal').damage,null);assert.equal(a.postMortem().gross.Wiring,0);
// Fatal trajectory effects can continue injuring crew/damaging systems: show the FINAL cascade state.
a.newGame();a.G.crisis={title:'FINAL CASCADE',cat:'TEST',flavor:'Test',req:{NAV:999},win:{},fail:{course:3,injure:12,damageSystem:'thermal'}};
// Use the actual renderer here, so an early gameOver modal is replaced after all consequences settle.
vm.runInContext('render=renderUI',ctx);a.resolveCrisis();
assert.equal(a.G.crew.filter(c=>c.state==='dead').length,6);assert.equal(a.sys('thermal').state,'damaged');
assert.equal((el('modal').innerHTML.match(/Fatal hit:/g)||[]).length,6);assert(el('modal').innerHTML.includes('1 damaged'));
// Alive on a failed trajectory is not falsely reported dead or safely recovered on Earth.
a.newGame();a.gameOver(false,'CONTACT LOST','Missed Earth');
assert(el('modal').innerHTML.includes('alive at last contact'));assert(!el('modal').innerHTML.includes('Fatal hit:'));
// The header can reopen the report after reviewing wreckage; restart removes all incident history.
click({target:{closest:()=>({dataset:{act:'closemodal'}})}});assert(!el('modalOverlay').classList.contains('show'));
click({target:{closest:()=>({dataset:{act:'postmortem'}})}});assert(el('modalOverlay').classList.contains('show'));
click({target:{closest:()=>({dataset:{act:'restartgame'}})}});assert(!a.G.over);assert.equal(el('reportBtn').disabled,true);
assert(a.G.crew.every(c=>!c.death&&!c.injury));assert(a.G.systems.every(s=>!s.damage&&!s.destruction));
// Success with casualties also gets the same death report, not only loss screens.
a.newGame();a.injureCrew(6,'radiation');a.injureCrew(1,'decompression');a.endGame(false);
assert(a.G.over.win);assert(el('modal').innerHTML.includes('POST-MORTEM — MISSION SURVIVED'));
assert(el('modal').innerHTML.includes('Fatal hit: decompression'));assert(el('modal').innerHTML.includes('FINAL SCORE'));
assert(el('modal').innerHTML.includes('Cause of death: Died from decompression'));
assert(el('modal').innerHTML.includes('fictional reconstructions'));
console.log('PASS: victory/defeat post-mortems, ship/component bills, independent instances, persistent casualty causes, suffocation, healing/repair, fatal cascades, reopen/restart');
