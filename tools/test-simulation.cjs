const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {distribution,summarizeRecovery}=require('./recovery-summary.cjs');
const d=distribution([1,2,3]);assert.equal(d.mean,2);assert(Math.abs(d.standardDeviation-Math.sqrt(2/3))<1e-12);
assert.equal(d.median,2);assert.equal(distribution([]).n,0);
const row=(seed,stage,rate,actualWin=false)=>({seed,stage,recoveryRate:rate,actualWin,endStage:6,doctorState:'injured',oxygen:0});
const summary=summarizeRecovery([
 row(1,1,0),row(1,2,0),row(1,3,.5), // transient dip: exclude
 row(2,1,.5),row(2,2,0),row(2,3,0), // sustained zero tail
 row(3,1,0,true),row(3,2,0,true),   // actual recovery: not a losing spiral
 row(4,5,0),                       // only one checkpoint / imminent end: exclude
]);
assert.equal(summary.sustainedLowHope.games,1);assert.equal(summary.sustainedZeroRecovery.games,1);
assert.equal(summary.sustainedLowHope.delay.mean,4);
assert.equal(summary.actualWinningGamesWithZeroRecoveryCheckpoint,1);
const run=extra=>JSON.parse(execFileSync(process.execPath,[require('node:path').join(__dirname,'simulate.cjs'),'--games','20','--seed-start','2000000','--policy','salvage','--commitment-cost','0.5',...extra],{encoding:'utf8'}));
const main=run(['--fitness-rows']),probes=run(['--fitness-rows','--recovery-games','3','--recovery-rollouts','4']);
assert.deepEqual(main.fitness,probes.fitness,'Recovery rollouts must not contaminate fitness samples');
assert.deepEqual(main.successComponentRewards,probes.successComponentRewards,'Recovery rollouts must not contaminate actual surplus income');
const rewards=main.successComponentRewards;assert(rewards.enabled);
assert.equal(rewards.successes,main.crisisExposure.reduce((n,c)=>n+c.seen-c.failed,0));
for(const key of ['successes','awards','tokens'])assert.equal(rewards[key],Object.values(rewards.byKind).reduce((n,b)=>n+b[key],0));
assert(rewards.awards<=rewards.successes);assert(rewards.tokens>=rewards.awards);
assert.equal(main.fitness.rows.length,20);
assert(Math.abs(main.fitness.samples-main.duration.ordinaryResponses.mean*20)<1e-10);
assert(Math.abs(main.fitness.perGameMean.mean-main.fitness.rows.reduce((s,r)=>s+r.meanFitness,0)/20)<1e-12);
assert(main.fitness.rows.every(r=>r.meanFitness>0&&r.meanFitness<=1&&r.ordinaryTurns>0));
assert(main.fitness.rows.every(r=>r.responses>=r.ordinaryTurns));
const longer=run(['--phase-lengths','5,10,4','--repair-cost','3','--starting-components','1','--damage','1','--late-injury-reduction','1']);
assert.deepEqual(longer.experiments,{phaseLengths:[5,10,4],startingComponents:1,startingComponentsByType:{Electronics:1,Wiring:1,'Power Cell':1},repairCost:3,routePolicy:'auto'});
assert.equal(main.difficulty,'normal');
assert.equal(main.experiments.startingComponents,'shipped');
assert.deepEqual(main.experiments.startingComponentsByType,{Electronics:2,Wiring:2,'Power Cell':2});
assert.equal(longer.profiles.lateInjuryReduction,1);assert.equal(longer.profiles.damage,1);
assert(longer.fitness.samples>0);assert.equal(longer.recovery,null);
for(const level of ['easy','hard']){
 const r=run(['--difficulty',level]);assert.equal(r.difficulty,level);
 assert.deepEqual(r.balance.injuriesByPhase,r.difficultyLevels[level].injuriesByPhase);
 assert.deepEqual(r.experiments.phaseLengths,[5,16,4]);assert.equal(r.balance.extraMajorDamage,1);
 assert(Math.abs(r.fitness.samples-r.duration.ordinaryResponses.mean*20)<1e-10);
}
const safe=run(['--route-policy','safe']);assert.equal(safe.duration.responses.mean,safe.duration.ordinaryResponses.mean,'Safe routes contain no burn responses');
assert.equal(safe.successComponentRewards.byKind.route,undefined,'Safe routes have no successful check or payout');
const {paired,summarize}=require('./fitness-study.cjs');
assert.deepEqual(paired([{seed:1,x:1},{seed:2,x:2}],[{seed:1,x:2},{seed:2,x:3}],'x'),{mean:1,approximate95:[1,1]});
const rows=summarize([{name:'base',args:[],result:main},{name:'same',args:[],result:main}]);assert(rows.every(r=>r.pareto&&!r.improvesBoth));
assert.deepEqual(main.duration,probes.duration,'Counterfactual probes must not contaminate real-game statistics');
assert.deepEqual(main.failedCrises,probes.failedCrises);assert.equal(main.wins,probes.wins);
assert.equal(probes.recovery.rows.length*4,probes.recovery.probeCount);
assert.equal(main.duration.all.n,20);assert.equal(main.duration.losses.n+main.duration.wins.n,20);
assert(Math.abs(main.duration.all.mean-(main.duration.losses.mean*main.duration.losses.n+main.duration.wins.mean*main.duration.wins.n)/20)<1e-10);
// Future balance edits must not silently be overwritten by hardcoded experiment defaults.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-sim-defaults-'));
try{
 fs.mkdirSync(path.join(temp,'tools'));
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')
  .replace(/const BASE_DECK=\{1:\d+,2:\d+,3:\d+\};/,'const BASE_DECK={1:7,2:12,3:6};')
  .replace('components:{Electronics:2,Wiring:2,"Power Cell":2},','components:{Electronics:3,Wiring:3,"Power Cell":3},');
 fs.writeFileSync(path.join(temp,'index.html'),html);
 for(const file of ['simulate.cjs','recovery-summary.cjs'])fs.copyFileSync(path.join(__dirname,file),path.join(temp,'tools',file));
 const changed=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),'--games','1','--seed-start','2000000'],{encoding:'utf8'}));
 assert.deepEqual(changed.experiments.phaseLengths,[7,12,6]);
 assert.deepEqual(changed.experiments.startingComponentsByType,{Electronics:3,Wiring:3,'Power Cell':3});
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS: duration/fitness sampling, experimental controls, shipped-default preservation, paired comparisons/Pareto, recovery classification and probe isolation');
