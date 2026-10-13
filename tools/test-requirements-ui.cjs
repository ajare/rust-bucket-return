// Diagnose reported Coolant Loop Rupture failure, and distinguish AND from OR in the UI.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}});return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=410129881'},document:{getElementById:el,addEventListener(){}}};
vm.createContext(ctx);vm.runInContext(source+`
render=()=>{};
globalThis.a={get G(){return G},newGame,CRISES,sys,setMode,computeTotals,resolveCrisis,renderCrisis};`,ctx);
const a=ctx.a;
function coolant(mode){
 a.newGame();a.G.phase=2;a.G.crisis=a.CRISES[2].find(c=>c.id==='coolant');a.G.deck=[];a.G.drawn=[];
 if(mode.includes('engineering')){a.G.drawn.push('fabricator');a.setMode('fabricator','r');}
 if(mode.includes('power')){a.G.drawn.push('reactor');a.setMode('reactor','n');}
 a.sys('thermal').state='damaged';return a.G.crisis;
}
// Real commitments at the reported seed: either partial match fails; a complete AND succeeds.
for(const mode of ['engineering','power','engineering power']){
 coolant(mode);const t={...a.computeTotals()};a.resolveCrisis();const injuries=a.G.crew.filter(c=>c.state==='injured').length;
 const damageUnits=a.G.systems.reduce((sum,s)=>sum+(s.state==='damaged'?1:s.state==='destroyed'?2:0),0);
 assert.equal(damageUnits,mode==='engineering power'?1:mode==='engineering'?3:2,'Partial AND adds one real damage hit; successful AND grants repair, with only committed Redline wear');
 const success=mode==='engineering power';assert.equal(injuries,0,'Coolant has no added Transit injury hits');
 if(success)assert.equal(a.sys('thermal').state,'op');else assert.notEqual(a.sys('thermal').state,'op','Failed response must not grant the cooling-system repair');
 assert(a.G.log.some(l=>l.msg.startsWith((success?'RESOLVED':'FAILED')+': COOLANT LOOP RUPTURE')));
 console.log('Coolant fixture:',mode,JSON.stringify(t),'injured',injuries);
}
// For EVERY OR card, fully meeting either arm avoids its failure injuries.
for(const [phase,pool] of Object.entries(a.CRISES))for(const card of pool.filter(c=>c.alt))for(const arm of [card.req,card.alt]){
 a.newGame();a.G.phase=Number(phase);a.G.crisis=card;a.G.deck=[];a.G.drawn=[];a.G.crewBonus={...arm};
 a.resolveCrisis();assert(a.G.log.some(l=>l.msg.startsWith('RESOLVED: '+card.title)),card.id+' arm '+JSON.stringify(arm));
 assert(a.G.crew.every(c=>c.state==='ok'),card.id+' must not apply failure injuries on success');
}
console.log('PASS: complete AND succeeds; either complete OR arm succeeds; partial coolant fails with system wear, not added injury hits');
if(process.argv.includes('--engine-only'))process.exit(0);
// UI must spell out AND, and must not make a green partial chip look like overall success.
coolant('engineering');a.renderCrisis();
assert(el('crisis').innerHTML.includes('— AND —'),'Coolant requirements must visibly say AND');
assert(el('crisis').innerHTML.includes('Requirements unmet — resolving fails'));
coolant('engineering power');a.renderCrisis();assert(el('crisis').innerHTML.includes('Requirements met — resolving succeeds'));
// OR's unmet alternative remains visible, but the overall readiness indicator must be success.
a.newGame();a.G.crisis=a.CRISES[1].find(c=>c.id==='fuelline');a.G.drawn=['fabricator'];a.setMode('fabricator','r');a.renderCrisis();
assert(el('crisis').innerHTML.includes('— OR —'));assert(el('crisis').innerHTML.includes('POWER 0/7'));
assert(el('crisis').innerHTML.includes('Requirements met — resolving succeeds'));
// Explicit AND within compound arms and OR between them.
a.G.crisis={title:'Compound OR fixture',cat:'TEST',flavor:'Test',req:{ENG:5,POW:3},alt:{SIG:4,NAV:3},fail:{},win:{}};
a.G.drawn=[];a.G.crewBonus={SIG:4,NAV:3};a.renderCrisis();
assert.equal((el('crisis').innerHTML.match(/— AND —/g)||[]).length,2);
assert(el('crisis').innerHTML.includes('— OR —'));assert(el('crisis').innerHTML.includes('Requirements met — resolving succeeds'));
a.G.crewBonus={SIG:4};a.renderCrisis();assert(el('crisis').innerHTML.includes('Requirements unmet — resolving fails'));
console.log('PASS: explicit AND/OR separators and overall readiness agree with resolution');
