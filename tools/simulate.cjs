#!/usr/bin/env node
// Run the actual inline game engine headlessly. No dependencies.
// node tools/simulate.cjs --games 1000 --seed-start 1 --policy salvage
// --baseline restores original failure effects (keeps the mortality bug fix).
// --uncapped-tracks restores the pre-cap phase-scaled profile; --flat-injuries restores the older flat profile.
// Recovery study: add --recovery-games 300 --recovery-rollouts 128 (expensive).
// Experimental failure profiles add to the shipped profile: --major-injuries N --minor-injuries N --oxygen N --course N
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1]};
const N=Number(arg('games',1000)),start=Number(arg('seed-start',1)),policy=arg('policy','salvage');
assert(Number.isInteger(N)&&N>0&&Number.isInteger(start),'Expected positive game count and integer seed start');
assert(['balanced','aggressive','conserve','solve','safe','salvage'].includes(policy),'Unknown policy');
const difficulty=arg('difficulty','normal');
assert(['easy','normal','hard'].includes(difficulty),'Unknown difficulty');
const commitmentCost=Number(arg('commitment-cost',1));
assert(Number.isFinite(commitmentCost)&&commitmentCost>0,'Commitment cost must be positive');
// Analysis-only rules; defaults reproduce the shipped game. Never alter index.html.
let phaseLengths=arg('phase-lengths',null)?.split(',').map(Number);
const startingComponentsArg=arg('starting-components',null);
const startingComponents=startingComponentsArg===null?null:Number(startingComponentsArg),repairCost=Number(arg('repair-cost',2));
const routePolicy=arg('route-policy','auto'),fitnessRows=args.includes('--fitness-rows');
assert(!phaseLengths||phaseLengths.length===3&&phaseLengths.every(n=>Number.isInteger(n)&&n>=2),'Expected three phase lengths >=2');
assert(startingComponents===null||Number.isInteger(startingComponents)&&startingComponents>=0,'Starting components must be nonnegative');
assert(Number.isInteger(repairCost)&&repairCost>=2,'Experimental repair cost must be >=2');
assert(['auto','safe','direct'].includes(routePolicy),'Unknown route policy');
const recoveryGames=Number(arg('recovery-games',0)),recoveryRollouts=Number(arg('recovery-rollouts',128));
assert(Number.isInteger(recoveryGames)&&recoveryGames>=0&&recoveryGames<=N);
assert(Number.isInteger(recoveryRollouts)&&recoveryRollouts>0);
const stub=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},disabled:false});
const sandbox={console,URLSearchParams,location:{search:'?seed=1&difficulty='+difficulty},document:{getElementById:stub,addEventListener(){}}};
vm.createContext(sandbox);
vm.runInContext(script+`
render=()=>{};
let lastHarm='';
log=(msg)=>{if(msg.includes('suffocation'))lastHarm='suffocation';};
const originalInjure=injureCrew;
injureCrew=(n,cause)=>{lastHarm=cause;originalInjure(n,cause)};
const originalOver=gameOver;
gameOver=(...args)=>{if(!G.over){const suffocation=args[1].includes('CREW LOST')&&lastHarm==='suffocation';G.lossTrigger=suffocation?'Oxygen depletion (Consume)':G.crisis?.title||'Consume';G.lossPhase=G.phase;G.lastHarm=lastHarm;}originalOver(...args)};
const successComponentLedger={enabled:typeof awardSurplusComponents==='function',successes:0,awards:0,tokens:0,byKind:{}};
if(successComponentLedger.enabled){
 const originalAward=awardSurplusComponents;
 awardSurplusComponents=(c,totals)=>{
  const before=totalComponents(),n=originalAward(c,totals),actual=totalComponents()-before;
  if(actual!==n)throw new Error('Surplus reward ledger differs from actual Components');
  if(globalThis.collectSuccessRewards!==false){
   const kind=c.route?'route':c.terminal?'reentry':'ordinary';
   const bin=successComponentLedger.byKind[kind]||(successComponentLedger.byKind[kind]={successes:0,awards:0,tokens:0});
   successComponentLedger.successes++;bin.successes++;
   if(actual){successComponentLedger.awards++;bin.awards++;successComponentLedger.tokens+=actual;bin.tokens+=actual;}
  }
  return n;
 };
}
globalThis.api={get successComponentRewards(){return JSON.parse(JSON.stringify(successComponentLedger))},get G(){return G},handFitnessBreakdown,FITNESS_CONFIG,DIFFICULTIES,BASE_DECK,CRISES,REENTRY,ROUTES,CAPS,SYSTEM_DEFS,CREW_DEFS,SYSTEM_SPECIALISTS,MISSION_SPECIALISTS,COMP_TYPES,POWER_SYSTEMS,FAILURE_BALANCE,BASE_FAILURES,capFailureTracks,
 newGame(seed){SEED=seed;lastHarm='';newGame()},
 snapshot(){return JSON.parse(JSON.stringify(G))},
 restore(state,seed,revealed){
  G=JSON.parse(JSON.stringify(state));rng=mulberry32(seed);lastHarm='';
  // Sample hidden future cards without replacement; retain the current revealed crisis and hand.
  const remaining=G.deck.length,forecast=G.deck[0];
  let eligible=G.pools[G.phase].filter(c=>!revealed.includes(c.id));
  let first=null;
  const oneReveal=forecast&&G.flags.revealedNext===forecast.id;
  if(forecast&&(G.flags.forecastHidden===0||oneReveal)){
   const candidates=G.flags.exactForecast||oneReveal?eligible.filter(c=>c.id===forecast.id):eligible.filter(c=>c.cat===forecast.cat);
   first=pick(candidates);eligible=eligible.filter(c=>c.id!==first.id);
  }
  G.deck=(first?[first]:[]).concat(shuffle(eligible).slice(0,remaining-(first?1:0)));
  for(let phase=G.phase+1;phase<=3;phase++)G.pools[phase]=shuffle(G.pools[phase]);
 },sys,crewClick,reqClick,cardClick,repair,patch,cannibalise,
 computeTotals,resolveCrisis,routeSafe,routeDirect,fabricate,systemOutput,useMission,missionReason};`,sandbox);
const a=sandbox.api;
if(!phaseLengths)phaseLengths=[1,2,3].map(p=>a.BASE_DECK[p]);
phaseLengths.forEach((n,i)=>{assert(n<=a.CRISES[i+1].length,'Phase length exceeds unique crisis pool');a.BASE_DECK[i+1]=n;});
const originalNewGame=a.newGame,originalRepair=a.repair;
let openingComponents;
a.newGame=seed=>{originalNewGame(seed);if(startingComponents!==null)for(const type of a.COMP_TYPES)a.G.components[type]=startingComponents;openingComponents??={...a.G.components};};
a.repair=id=>{
 const s=a.sys(id);if(a.G.step!=='respond'||s.state!=='damaged'||a.G.components[s.def.comp]<repairCost)return;
 originalRepair(id);assert.equal(s.state,'op');a.G.components[s.def.comp]-=repairCost-2;
};
const chooseRoute=()=>routePolicy==='safe'||routePolicy==='auto'&&policy==='safe'?a.routeSafe():a.routeDirect();
const baseline=args.includes('--baseline'),flatInjuries=args.includes('--flat-injuries'),uncappedTracks=args.includes('--uncapped-tracks');
assert(!(baseline&&flatInjuries),'Choose baseline or flat-injuries, not both');
const trackCapsApplied=!(baseline||flatInjuries||uncappedTracks);
if(!trackCapsApplied)for(const cards of Object.values(a.CRISES))for(const c of cards){
 const original=a.BASE_FAILURES[c.id];
 if(baseline){c.fail={...original};continue;}
 if(flatInjuries)c.fail.injure=(original.injure||0)+((c.failureTier||(c.alt?'minor':'major'))==='minor'?2:3);
 for(const track of ['heat','oxygen','course']){
  delete c.fail[track];
  if(original[track]!==undefined)c.fail[track]=original[track];
 }
 if(c.cat==='ENVIRONMENT')c.fail.oxygen=(c.fail.oxygen||0)-a.FAILURE_BALANCE.environmentOxygen;
 if(c.fail.course)c.fail.course+=a.FAILURE_BALANCE.extraCourseError;
}
const profiles={major:Number(arg('major-injuries',0)),minor:Number(arg('minor-injuries',0)),oxygen:Number(arg('oxygen',0)),course:Number(arg('course',0)),damage:Number(arg('damage',0)),terminal:Number(arg('terminal-injuries',0)),opening:Number(arg('opening-injuries',0)),return:Number(arg('return-injuries',0)),lateInjuryReduction:Number(arg('late-injury-reduction',0))};
assert(Number.isInteger(profiles.lateInjuryReduction)&&profiles.lateInjuryReduction>=0,'Late injury reduction must be nonnegative');
if(profiles.terminal)a.REENTRY.fail.injure+=profiles.terminal;
for(const [phase,cards] of Object.entries(a.CRISES))for(const c of cards){
 c.fail.injure=c.fail.injure||0;
 if(phase==='1'&&profiles.opening)c.fail.injure+=profiles.opening;
 if(phase==='3'&&profiles.return)c.fail.injure+=profiles.return;
 assert(c.fail.injure>=0,'Injury additions cannot yield negative injury counts');
 const minor=(c.failureTier||(c.alt?'minor':'major'))==='minor';
 if(profiles.major&&!minor)c.fail.injure=(c.fail.injure||0)+profiles.major;
 if(profiles.minor&&minor)c.fail.injure=(c.fail.injure||0)+profiles.minor;
 if(profiles.oxygen&&c.cat==='ENVIRONMENT')c.fail.oxygen=(c.fail.oxygen||0)-profiles.oxygen;
 if(profiles.course&&c.fail.course)c.fail.course+=profiles.course;
 if(profiles.damage&&!minor)c.fail.damageRandom=(c.fail.damageRandom||0)+profiles.damage;
 if(Number(phase)>1&&profiles.lateInjuryReduction)c.fail.injure=Math.max(a.BASE_FAILURES[c.id].injure||0,c.fail.injure-profiles.lateInjuryReduction);
 assert(c.fail.injure>=0,'Injury additions cannot yield negative injury counts');
 if(trackCapsApplied)c.fail=a.capFailureTracks(c.fail,phase);
}
const caps=Object.keys(a.CAPS);
const idx=Object.fromEntries(caps.map((k,i)=>[k,i]));
const vector=obj=>caps.map(k=>obj[k]||0);
const counts={wins:0,losses:{},triggers:{},failed:{},seen:{},suffocation:0,totalTurns:0,scores:0};
let evaluations=0,recording=true;
const games=[],recoveryTrajectories=[],fitnessByTurn=[],fitnessByPhase={};
let fitnessSum=0,fitnessSamples=0,lowFitnessSamples=0;
function sampleFitness(samples){
 const f=a.handFitnessBreakdown();assert(Number.isFinite(f.value)&&f.value>=0&&f.value<=1);
 samples.push(f.value);fitnessSum+=f.value;fitnessSamples++;if(f.value<=0.6)lowFitnessSamples++;
 const i=samples.length-1,bin=fitnessByTurn[i]||(fitnessByTurn[i]={turn:i+1,n:0,sum:0});bin.n++;bin.sum+=f.value;
 const p=a.G.phase,phase=fitnessByPhase[p]||(fitnessByPhase[p]={n:0,sum:0,systems:0,crew:0,components:0});
 phase.n++;phase.sum+=f.value;phase.systems+=f.systems;phase.crew+=f.crew;phase.components+=f.components;
}
function respond(){
 const G=a.G,C=G.crisis;
 G.pendingSpecialist=null; // Unspent UI targeting intent; the solver chooses its own targets.
 // Mission actions are heuristic; use them before the Doctor and critical repairs.
 const mission=G.crew.find(c=>c.id==='spec');
 if(!a.missionReason()){
  if(['chen','ortega'].includes(mission.mission))a.useMission();
  else if(mission.mission==='adeyemi'&&G.crew.some(c=>c.state==='injured'))a.useMission();
  else if(mission.mission==='nasser'&&(G.course>=2||G.course>0&&G.course+(C.fail?.course||0)>=3))a.useMission();
  else if(mission.mission==='rahman'){
   const damaged=['lifesupport','navcomp','thrusters','comms','thermal'].flatMap(id=>G.systems.filter(s=>s.def.id===id)).find(s=>s.state==='damaged'&&G.components[s.def.comp]<2);
   a.useMission(damaged?.def.comp||'Wiring');
  }else if(mission.mission==='voss'){
   if(G.ongoing.length){
    const scores=G.ongoing.map(o=>Math.abs(o.oxygen||0)*(o.turns+(G.oxygen<=2?10:0)));
    a.useMission(String(scores.indexOf(Math.max(...scores))));
   }else if(G.oxygen<=2)a.useMission();
  }
 }
 // Heal before using a healed crew member's ability. Doctor's real conditional ability is respected.
 if(a.G.crew.find(c=>c.id==='doc').state==='ok')a.crewClick('doc');
 if(policy==='salvage'&&Object.values(G.components).reduce((s,n)=>s+n,0)<2){
  const needed=G.systems.find(s=>s.state==='damaged'&&(s.def.id==='lifesupport'||(G.drawn.includes(s.id)&&[C.req,C.alt||{}].some(r=>Object.keys(s.def.n).some(k=>r[k])))));
  if(needed){
   const victim=['cargo','service','aux','fuelcells'].flatMap(id=>G.systems.filter(s=>s.def.id===id)).find(s=>s.state==='op'&&!G.drawn.includes(s.id)&&s.def.comp===needed.def.comp);
   if(victim)a.cannibalise(victim.id);
  }
 }
 const repairOrder=policy==='conserve'?['lifesupport','navcomp']:['lifesupport','navcomp','thrusters','comms','thermal'];
 for(const id of repairOrder)for(const s of G.systems.filter(s=>s.def.id===id))if(s.state==='damaged'&&G.components[s.def.comp]>=repairCost)a.repair(s.id);
 const arms=[C.req,...(C.alt?[C.alt]:[])].map(vector);
 const specialists=G.crew.filter(c=>c.cap&&c.state==='ok'&&!c.used);
 const cmdr=G.crew.find(c=>c.id==='cmdr'),syseng=G.crew.find(c=>c.id==='syseng');
 const commander=cmdr.state==='ok'&&(!cmdr.used||G.pendingCmdr);
 const engineer=syseng.state==='ok'&&(!syseng.used||G.pendingSE);
 const ds=G.drawn.map(a.sys),resourceCount=Object.values(G.components).reduce((s,n)=>s+n,0);
 const options=ds.map(s=>{
  const d=s.def,out=[{mode:null,v:new Array(caps.length).fill(0),cost:0,heat:0,patch:0,boost:0}];
  if(s.mode==='b'){out[0].mode='b';return out;} // Already fabricated: no other use is legal.
  const retain=(d.id==='lifesupport'?9:d.id==='navcomp'?5:1);
  if(Object.keys(d.n).length){
   const full=vector(a.systemOutput(s,'n',true)),v=vector(a.systemOutput(s,'n'));
   out.push({mode:'n',v,cost:.01,heat:d.nh||0,patch:0,boost:0});
   if(s.state==='damaged'){
    if(resourceCount)out.push({mode:'n',v:full,cost:.6,heat:d.nh||0,patch:1,boost:0});
    if(engineer)out.push({mode:'n',v:full,cost:0,heat:d.nh||0,patch:0,boost:1});
   }
  }
  if(d.r&&s.state==='op'&&!(G.flags.noRedline&&a.POWER_SYSTEMS.includes(d.id)))
   out.push({mode:'r',v:vector(a.systemOutput(s,'r')),cost:commitmentCost*(['aggressive','salvage'].includes(policy)?.8:1.8)*retain,heat:d.rh||0,patch:0,boost:0});
  if(d.s&&(Object.keys(d.s).length||d.sfx)){
   let cost=commitmentCost*(['aggressive','salvage'].includes(policy)?3:5)*retain;
   if(d.sfx?.heal&&G.crew.some(c=>c.state==='injured'))cost-=4;
   if(d.sfx?.shelter){const injuries=G.crew.filter(c=>c.state!=='ok').length;cost-=G.flags.shelter?0:4+injuries*1.5;}
   if(d.sfx?.components&&resourceCount<2)cost-=2;
   out.push({mode:'s',v:vector(a.systemOutput(s,'s')),cost,heat:d.sh||0,patch:0,boost:0});
  }
  // Irrelevant positive-cost modes are dominated by doing nothing. Keep cooling, course
  // correction and all sacrifice side effects. This preserves the selected policy while
  // making counterfactual recovery studies much faster.
  const relevant=arms.map(r=>r.map((v,k)=>v?caps[k]:null)).flat().filter(Boolean);
  relevant.push('CLG');if(G.course>0&&!C.route)relevant.push('NAV');
  return out.filter(o=>o.mode===null||o.v.some((v,k)=>v>0&&relevant.includes(caps[k]))||specialists.some(c=>relevant.includes(c.cap)&&(d[o.mode]?.[c.cap]||0)>0)||(o.mode==='s'&&d.sfx));
 });
 let best=null,bestCost=Infinity;
 const totals=vector(G.crewBonus),selected=[];
 function visit(i,cost,heat,patches,boosts){
  if(patches>resourceCount||boosts>1)return;
  if(i<ds.length){for(const o of options[i]){selected[i]=o;for(let k=0;k<caps.length;k++)totals[k]+=o.v[k];visit(i+1,cost+o.cost,heat+o.heat,patches+o.patch,boosts+o.boost);for(let k=0;k<caps.length;k++)totals[k]-=o.v[k];}return;}
  evaluations++;
  const assignments=[];
  for(const c of specialists){
   const target=ds.findIndex((s,j)=>['n','r','s'].includes(selected[j].mode)&&(s.def[selected[j].mode]?.[c.cap]||0)>0);
   if(target>=0){assignments.push({crewId:c.id,systemId:ds[target].id,cap:c.cap});totals[idx[c.cap]]+=2;}
  }
  let success=false,cmd=null;
  for(const req of arms){let gap=0,cap=-1;for(let k=0;k<caps.length;k++){const d=Math.max(0,req[k]-totals[k]);if(d){gap+=d;cap=k}}
   if(gap===0){success=true;cmd=null;break}if(gap===1&&commander){success=true;cmd=caps[cap];}}
  const nav=totals[idx.NAV]+(cmd==='NAV'?1:0),cool=totals[idx.CLG]+(cmd==='CLG'?1:0);
  const navSpare=nav-Math.min(...arms.map(r=>r[idx.NAV]));
  const corrected=!C.route&&navSpare>=3&&G.course>0;
  const courseAfter=G.course-(corrected?1:0);
  let penalty=0;
  if(!success){
   const fail=C.fail||{};
   penalty=policy==='solve'?200:6;
   penalty+=(fail.course||0)*12+(courseAfter+(fail.course||0)>=3?500:0);
   penalty+=(fail.injure||0)*4+(fail.damageRandom||0)*2+(fail.destroyRandom||0)*6;
   penalty+=Math.abs(fail.oxygen||0)*(G.oxygen<=2?5:1.5);
   if(fail.ongoing)penalty+=Math.abs(fail.ongoing.oxygen||0)*fail.ongoing.turns*2;
   if(C.route)penalty+=3;
   if(fail.damageSystem==='lifesupport')penalty+=12;
  }
  const netHeat=heat-Math.max(0,cool-Math.min(...arms.map(r=>r[idx.CLG])));
  const heatScore=Math.max(0,G.heat+netHeat)>=5?6:Math.max(0,netHeat)*.3;
  const navBonus=corrected?(G.course>=2?25:6):0;
  const score=cost+penalty+heatScore-navBonus;
  if(score<bestCost){bestCost=score;best={selected:selected.slice(),success,cmd,assignments:assignments.slice()}}
  for(const assignment of assignments)totals[idx[assignment.cap]]-=2;
 }
 visit(0,0,0,0,0);
 assert(best,'Solver must always allow doing nothing');
 if(mission.mission==='kim'&&!a.missionReason()&&(!best.success||bestCost>6)){
  const ranked=ds.map((s,i)=>({id:s.id,score:Math.max(...arms.map(req=>req.reduce((sum,need,k)=>sum+Math.min(need,Math.max(s.def.n[caps[k]]||0,s.def.r?.[caps[k]]||0,s.def.s?.[caps[k]]||0)),0)))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(a.useMission(ranked.slice(0,2).map(x=>x.id)))return respond(); // Redraw preserves already spent crew actions.
 }
 if(best.cmd){a.crewClick('cmdr');a.reqClick(best.cmd)}
 for(let i=0;i<ds.length;i++){
  const o=best.selected[i],s=ds[i];
  if(o.patch)a.patch(s.id);
  if(o.boost){a.crewClick('syseng');a.cardClick(s.id)}
  s.mode=o.mode;
 }
 for(const assignment of best.assignments){a.crewClick(assignment.crewId);a.cardClick(assignment.systemId);}
 const t=a.computeTotals();
 const success=[C.req,...(C.alt?[C.alt]:[])].some(r=>Object.entries(r).every(([k,v])=>(t[k]||0)>=v));
 assert.equal(success,best.success,'Search and engine totals differ');
 if(recording){
  counts.seen[C.title]=(counts.seen[C.title]||0)+1;
  if(!success)counts.failed[C.title]=(counts.failed[C.title]||0)+1;
 }
 a.resolveCrisis();
}
for(let i=0;i<N;i++){
 const seed=Math.imul(start+i,2654435761)>>>0;a.newGame(seed);let turns=0,responses=0;
 const checkpoints=[],revealed=[],samples=[];
 while(!a.G.over){assert(turns++<120,'Game stuck');if(a.G.step==='route'){
  chooseRoute();
 }else{
  const c=a.G.crisis;
  if(!c.route){
   sampleFitness(samples);
   revealed.push(c.id);
   if(i<recoveryGames)checkpoints.push({state:a.snapshot(),revealed:revealed.slice(),stage:a.G.turn+1,phase:a.G.phase,crisis:c.title});
  }
  responses++;respond();
 }}
 assert(samples.length>0,'Every run must contain an opening response');
 const outcome={seed,won:a.G.over.win,stages:a.G.turn+1,responses,ordinaryTurns:samples.length,
  meanFitness:samples.reduce((s,n)=>s+n,0)/samples.length,minFitness:Math.min(...samples),lastFitness:samples.at(-1),lowFitnessTurns:samples.filter(n=>n<=0.6).length,
  phase:a.G.phase,cause:a.G.over.win?'Victory':a.G.over.title};
 games.push(outcome);
 if(i<recoveryGames)recoveryTrajectories.push({...outcome,checkpoints});
 counts.totalTurns+=a.G.turn;
 if(a.G.over.win){counts.wins++;counts.scores+=a.G.over.score;}
 else{
  const reason=a.G.over.title;counts.losses[reason]=(counts.losses[reason]||0)+1;
  const trigger=a.G.lossTrigger;counts.triggers[trigger]=(counts.triggers[trigger]||0)+1;
  if(reason.includes('CREW')&&a.G.lastHarm==='suffocation')counts.suffocation++;
 }
}
const {distribution,summarizeRecovery}=require('./recovery-summary.cjs');
const lost=games.filter(g=>!g.won),won=games.filter(g=>g.won);
const lossPhases={};for(const g of lost)lossPhases[g.phase]=(lossPhases[g.phase]||0)+1;
const lossByCause={};for(const cause of new Set(lost.map(g=>g.cause)))lossByCause[cause]=distribution(lost.filter(g=>g.cause===cause).map(g=>g.stages));
const duration={unit:'journey stages reached: engine consume counter + 1 for the opening crisis; route burns add responses but not journey stages',all:distribution(games.map(g=>g.stages)),wins:distribution(won.map(g=>g.stages)),losses:distribution(lost.map(g=>g.stages)),responses:distribution(games.map(g=>g.responses)),ordinaryResponses:distribution(games.map(g=>g.ordinaryTurns)),winningResponses:distribution(won.map(g=>g.responses)),losingResponses:distribution(lost.map(g=>g.responses)),lossPhases,lossByCause,failedByStage3:lost.filter(g=>g.stages<=3).length,failedByStage5:lost.filter(g=>g.stages<=5).length};
let recovery=null;
if(recoveryGames){
 recording=false;sandbox.collectSuccessRewards=false;
 const rows=[];
 let probeCount=0;
 for(const game of recoveryTrajectories){
  for(const checkpoint of game.checkpoints){
   let victories=0;
   for(let r=0;r<recoveryRollouts;r++){
    a.restore(checkpoint.state,Math.imul(game.seed^Math.imul(checkpoint.stage,2246822519)^r,3266489917)>>>0,checkpoint.revealed);
    let guard=0;
    while(!a.G.over){assert(guard++<120,'Recovery probe stuck');if(a.G.step==='route')chooseRoute();else respond();}
    if(a.G.over.win)victories++;
    probeCount++;
   }
   const state=checkpoint.state;
   rows.push({seed:game.seed,actualWin:game.won,endStage:game.stages,stage:checkpoint.stage,phase:checkpoint.phase,crisis:checkpoint.crisis,
    victories,rollouts:recoveryRollouts,recoveryRate:victories/recoveryRollouts,oxygen:state.oxygen,course:state.course,
    healthyCrew:state.crew.filter(c=>c.state==='ok').length,injuredCrew:state.crew.filter(c=>c.state==='injured').length,
    livingCrew:state.crew.filter(c=>c.state!=='dead').length,doctorState:state.crew.find(c=>c.id==='doc').state,
    destroyedSystems:state.systems.filter(s=>s.state==='destroyed').length});
  }
 }
 const byGame=new Map();for(const row of rows){if(!byGame.has(row.seed))byGame.set(row.seed,[]);byGame.get(row.seed).push(row)}
 const spiral=[];
 for(const trajectory of byGame.values()){
  if(trajectory[0].actualWin)continue;
  // Persistently low recovery in consecutive checkpoints, with at least two further journey stages.
  for(let i=0;i<trajectory.length-1;i++)if(trajectory[i].recoveryRate<=.05&&trajectory[i+1].recoveryRate<=.05&&trajectory[i].endStage-trajectory[i].stage>=2){spiral.push(trajectory[i]);break;}
 }
 const recoveryBins={};for(const s of rows){const key=s.recoveryRate===0?'zero':s.recoveryRate<=.05?'0–5%':s.recoveryRate<=.25?'5–25%':s.recoveryRate<=.5?'25–50%':'over 50%';recoveryBins[key]=(recoveryBins[key]||0)+1;}
 const conditional=predicate=>{const arr=rows.filter(predicate);return {checkpoints:arr.length,meanRecoveryRate:arr.length?arr.reduce((s,x)=>s+x.recoveryRate,0)/arr.length:0,actualWins:arr.filter(x=>x.actualWin).length};};
 recovery={sampledGames:recoveryGames,sampledLosses:recoveryTrajectories.filter(g=>!g.won).length,rolloutsPerCheckpoint:recoveryRollouts,probeCount,definition:'Low-hope episodes have <=5% estimated wins at two consecutive checkpoints with >=2 stages remaining. Sustained summaries require every later checkpoint to stay below the threshold. These estimate policy recovery, not mathematical inevitability.',lowHopeEpisodeGames:spiral.length,lowHopeEpisodeOnsetStage:distribution(spiral.map(x=>x.stage)),lowHopeEpisodeDelay:distribution(spiral.map(x=>x.endStage-x.stage)),recoveryBins,
  conditions:{oxygenZero:conditional(s=>s.oxygen===0),doctorUnavailable:conditional(s=>s.doctorState!=='ok'),noHealthyCrew:conditional(s=>s.healthyCrew===0),oneOrTwoLivingCrew:conditional(s=>s.livingCrew<=2),courseTwo:conditional(s=>s.course===2)},...summarizeRecovery(rows),rows};
}
const fitness={sampling:'One sample before player actions at each ordinary crisis response, including opening/Re-entry; excludes route burns, route choices and terminal snapshots. Ordinary turns count these playable responses, not hypothetical distance.',config:a.FITNESS_CONFIG,
 perGameMean:distribution(games.map(g=>g.meanFitness)),turnWeightedMean:fitnessSum/fitnessSamples,samples:fitnessSamples,lowFitnessThreshold:0.6,
 lowFitnessTurns:distribution(games.map(g=>g.lowFitnessTurns)),lowFitnessFraction:lowFitnessSamples/fitnessSamples,
 lastPlayableFitness:distribution(games.map(g=>g.lastFitness)),minimumPlayableFitness:distribution(games.map(g=>g.minFitness)),
 byTurn:fitnessByTurn.map(b=>({turn:b.turn,n:b.n,mean:b.sum/b.n})),
 byPhase:Object.fromEntries(Object.entries(fitnessByPhase).map(([p,b])=>[p,{samples:b.n,mean:b.sum/b.n,systems:b.systems/b.n,crew:b.crew/b.n,components:b.components/b.n}])),
 rows:fitnessRows?games.map(({seed,won,ordinaryTurns,responses,meanFitness,minFitness,lastFitness,lowFitnessTurns})=>({seed,won,ordinaryTurns,responses,meanFitness,minFitness,lastFitness,lowFitnessTurns})):undefined};
const experiments={phaseLengths,startingComponents:startingComponents??'shipped',startingComponentsByType:openingComponents,repairCost,routePolicy};
const p=counts.wins/N,z=1.96,den=1+z*z/N,center=(p+z*z/(2*N))/den;
const radius=z*Math.sqrt(p*(1-p)/N+z*z/(4*N*N))/den;
const sort=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]);
console.log(JSON.stringify({simulatorSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),engineSha256:require('node:crypto').createHash('sha256').update(html).digest('hex'),games:N,seedStart:start,policy,commitmentCost,difficulty:a.G.difficulty,difficultyLevels:a.DIFFICULTIES,baseline,flatInjuries,uncappedTracks,trackCapsApplied,balance:a.FAILURE_BALANCE,profiles,winRate:p,confidence95:[center-radius,center+radius],wins:counts.wins,
 losses:counts.losses,crewDeathsFromSuffocation:counts.suffocation,meanTurns:counts.totalTurns/N,
 duration,fitness,experiments,recovery,phasePools:Object.fromEntries(Object.entries(a.CRISES).map(([phase,cards])=>[phase,{total:cards.length,or:cards.filter(c=>c.alt).length,and:cards.filter(c=>!c.alt&&Object.keys(c.req).length>1).length,only:cards.filter(c=>!c.alt&&Object.keys(c.req).length===1).length,ids:cards.map(c=>c.id)}])),crewSelection:{fixed:a.CREW_DEFS.map(c=>c.role),missionPool:a.MISSION_SPECIALISTS.map(c=>({name:c.name,mission:c.mission,field:c.field})),specialistsPerRun:2,pool:a.SYSTEM_SPECIALISTS.map(c=>({role:c.role,cap:c.cap})),draw:'Once per run, seeded; no mid-run replacements'},missionPolicy:'Heuristic one-shot timing/choices and Kim redraw; no optimal future planning.',fabricationPolicy:'No construction planning; fabrication is not used by this heuristic.',meanWinningScore:counts.wins?counts.scores/counts.wins:0,terminalTriggers:sort(counts.triggers),
 failedCrises:sort(counts.failed).map(([title,n])=>({title,failed:n,seen:counts.seen[title],failureRate:n/counts.seen[title]})),
 crisisExposure:sort(counts.seen).map(([title,seen])=>({title,seen,failed:counts.failed[title]||0,failureRate:(counts.failed[title]||0)/seen})),
 successComponentRewards:a.successComponentRewards,evaluations},null,2));
