const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const sandbox=()=>({URLSearchParams,location:{search:'?seed=17'},document:{getElementById:()=>({innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}}),addEventListener(){}}});
// Compare against authored cards before placement or balance additions: redistribution must not rewrite them.
const before=sandbox();vm.createContext(before);vm.runInContext(script.slice(0,script.indexOf('const CRISIS_PHASE_MOVES='))+';globalThis.original=JSON.parse(JSON.stringify(Object.values(CRISES).flat()));',before);
const ctx=sandbox();vm.createContext(ctx);vm.runInContext(script+`
render=()=>{};
globalThis.a={get G(){return G},CRISES,BASE_FAILURES,FAILURE_BALANCE,BASE_DECK,REENTRY,CRISIS_PHASE_MOVES,
 newGame(seed=17){SEED=seed;newGame()},buildDeck,routeSafe,routeDirect,resolveCrisis,setMode,sys};`,ctx);
const a=ctx.a,cards=Object.values(a.CRISES).flat(),ids=Array.from(cards,c=>c.id);
assert.equal(ids.length,72);assert.equal(new Set(ids).size,72);
assert.deepEqual(ids.slice().sort(),Array.from(before.original,c=>c.id).sort());
for(const original of before.original){
 const c=cards.find(x=>x.id===original.id);
 for(const key of ['req','alt','win','title','flavor','cat','failureTier'])assert.equal(JSON.stringify(c[key]),JSON.stringify(original[key]),original.id+' '+key);
 assert.equal(JSON.stringify(a.BASE_FAILURES[c.id]),JSON.stringify(original.fail));
}
const expected={1:{total:36,or:33,and:0,only:3},2:{total:18,or:3,and:9,only:6},3:{total:18,or:2,and:12,only:4}};
const loads=[];
for(const [phase,pool] of Object.entries(a.CRISES)){
 const or=pool.filter(c=>c.alt).length,and=pool.filter(c=>!c.alt&&Object.keys(c.req).length>1).length,only=pool.length-or-and;
 assert.deepEqual({total:pool.length,or,and,only},expected[phase]);
 const load=c=>Math.min(...[c.req,...(c.alt?[c.alt]:[])].map(r=>Object.values(r).reduce((s,n)=>s+n,0)));
 loads.push(pool.reduce((sum,c)=>sum+load(c),0)/pool.length);
 assert(pool.length>=a.BASE_DECK[phase]+2,'All safe-route deck sizes remain available');
 for(const c of pool){
  const base=a.BASE_FAILURES[c.id],tier=c.failureTier||(c.alt?'minor':'major');
  assert.equal(c.fail.injure||0,(base.injure||0)+a.FAILURE_BALANCE.injuriesByPhase[phase][tier],c.id+' destination injury tier');
  const caps=a.FAILURE_BALANCE.trackCapsByPhase[phase];assert((c.fail.heat||0)<=caps.heat);assert((c.fail.oxygen||0)>=-caps.oxygen);assert((c.fail.course||0)<=caps.course);
 }
}
assert(loads[0]<loads[1]&&loads[1]<loads[2],'Cheapest-arm requirement load should increase by phase');
assert(a.CRISES[1].filter(c=>c.alt).length/a.CRISES[1].length>=0.8);
for(const phase of [2,3])assert(a.CRISES[phase].filter(c=>!c.alt).length/a.CRISES[phase].length>=0.8);
for(const [phase,moved]of Object.entries(a.CRISIS_PHASE_MOVES))for(const id of moved)assert(a.CRISES[phase].some(c=>c.id===id));
for(const id of ['heatshield','vector-trim','interface','chute','gnc','e-trimburn','e-turbulence'])assert(a.CRISES[3].some(c=>c.id===id),'Keep late-return scenario '+id);
assert(a.CRISES[2].some(c=>c.id==='sensor-alarm'),'Preserve requested Sensor Fault Alarm placement');
assert.equal(a.REENTRY.fail.injure,2);assert.equal(a.REENTRY.req.NAV,5);
// Actual decks honour the compromise and unchanged safe/successful/failed route rules.
assert.deepEqual(JSON.parse(JSON.stringify(a.BASE_DECK)),{1:5,2:16,3:4});
assert.deepEqual(JSON.parse(JSON.stringify(a.FAILURE_BALANCE.injuriesByPhase)),{1:{major:1,minor:0},2:{major:0,minor:0},3:{major:1,minor:0}});
assert.equal(a.FAILURE_BALANCE.extraMajorDamage,1);
a.newGame();assert.equal(a.G.deck.length+1,5);
for(const target of [2,3]){
 a.newGame();a.G.phase=target-1;a.routeSafe();assert.equal(a.G.phase,target);
 assert.equal(a.G.deck.length+1,a.BASE_DECK[target]+2,'Safe route adds two actual unique crises');
 for(const success of [true,false]){
  a.newGame();a.G.phase=target-1;a.routeDirect();assert(a.G.crisis.route);
  a.G.drawn=[];a.G.crewBonus=success?{...a.G.crisis.req}:{};a.resolveCrisis();
  assert.equal(a.G.phase,target);assert.equal(a.G.deck.length+1,a.BASE_DECK[target]-(success?2:1));
  assert.equal(a.G.systems.filter(s=>s.state==='damaged').length,success?0:1,'Failed burn retains one engine damage, not the crisis major-wear modifier');
  assert(a.G.crew.every(c=>c.state==='ok'));
 }
}
// Route burns are real commitments: Redline damages and Sacrifice destroys, win or lose.
for(const target of [2,3]){
 a.newGame();a.G.phase=target-1;a.routeDirect();
 a.G.drawn=['engine','thrusters'];a.G.crewBonus={THR:99,CON:99};
 a.setMode('engine','r');a.setMode('thrusters','s');a.resolveCrisis();
 assert.equal(a.sys('engine').state,'damaged','A successful burn must still damage a redlined system');
 assert.equal(a.sys('thrusters').state,'destroyed','A successful burn must still destroy a sacrificed system');
 assert.equal(a.G.phase,target);
 a.newGame();a.G.phase=target-1;a.routeDirect();
 a.G.drawn=['thrusters'];a.G.crewBonus={};
 a.setMode('thrusters','r');a.resolveCrisis();
 assert.notEqual(a.sys('thrusters').state,'op','A failed burn must still apply redline damage on top of the engine penalty');
 a.newGame();a.G.phase=target-1;a.routeDirect();
 a.G.drawn=['navcomp'];a.G.crewBonus={THR:99,CON:99};
 a.setMode('navcomp','n');a.resolveCrisis();
 assert.equal(a.sys('navcomp').state,'op','Normal use on a burn keeps the system operational');
}
// Each seed retains the curated pools; no duplicates, cross-phase cards or restart drift.
for(let seed=0;seed<128;seed++){
 a.newGame(seed);const opening=JSON.stringify(a.G);
 for(const phase of [1,2,3]){
  const poolIds=Array.from(a.G.pools[phase],c=>c.id),expectedIds=Array.from(a.CRISES[phase],c=>c.id);
  assert.deepEqual(poolIds.slice().sort(),expectedIds.sort());assert.equal(new Set(poolIds).size,poolIds.length);
 }
 a.newGame(seed);assert.equal(JSON.stringify(a.G),opening);
}
console.log('PASS: 72 unique cards unchanged by placement/scaling, 92% OR / 83% strict / 89% strict pools, escalating requirement loads, destination failure scaling, route capacity and seeded restart');
