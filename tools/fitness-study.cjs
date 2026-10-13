#!/usr/bin/env node
// Matched-seed, fixed-policy exploratory sweep. Analysis only: never writes the game.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1]};
const games=Number(arg('games',500)),seedStart=Number(arg('seed-start',2000000));
const policy=arg('policy','salvage'),cost=arg('commitment-cost','0.5'),mode=arg('mode','screen');
assert(['screen','neighbors','lengths'].includes(mode),'Expected screen, neighbors or lengths mode');
const variants=[
 ['baseline',[]],
 ['transit-10',['--phase-lengths','5,10,4']],
 ['transit-14',['--phase-lengths','5,14,4']],
 ['return-8',['--phase-lengths','5,6,8']],
 ['all-longer',['--phase-lengths','8,10,6']],
 ['damage-1',['--damage','1']],['damage-2',['--damage','2']],
 ['late-injuries-minus-1',['--late-injury-reduction','1']],['late-injuries-minus-2',['--late-injury-reduction','2']],
 ['spares-1',['--starting-components','1']],['spares-0',['--starting-components','0']],
 ['repair-3',['--repair-cost','3']],['repair-4',['--repair-cost','4']],
 ['safe-routes',['--route-policy','safe']],
 ['transit-10-damage-1',['--phase-lengths','5,10,4','--damage','1']],
 ['transit-14-damage-1',['--phase-lengths','5,14,4','--damage','1']],
 ['transit-10-repair-3',['--phase-lengths','5,10,4','--repair-cost','3']],
 ['transit-10-spares-1',['--phase-lengths','5,10,4','--starting-components','1']],
 ['transit-10-damage-1-injury-1',['--phase-lengths','5,10,4','--damage','1','--late-injury-reduction','1']],
 ['transit-14-damage-1-injury-1',['--phase-lengths','5,14,4','--damage','1','--late-injury-reduction','1']],
 ['transit-10-damage-2-injury-1',['--phase-lengths','5,10,4','--damage','2','--late-injury-reduction','1']],
 ['transit-10-damage-1-injury-2',['--phase-lengths','5,10,4','--damage','1','--late-injury-reduction','2']],
 ['transit-14-damage-1-injury-2',['--phase-lengths','5,14,4','--damage','1','--late-injury-reduction','2']],
 ['transit-10-damage-1-injury-1-spares-1',['--phase-lengths','5,10,4','--damage','1','--late-injury-reduction','1','--starting-components','1']]
];
const neighbors=[['baseline',[]]];
for(const [transit,returnLength,damage,spares] of [
 [14,4,1,2],[14,6,1,2],[14,8,1,2],
 [16,4,1,2],[16,6,1,2],[16,8,1,2],[16,12,1,2],[16,16,1,2],
 [14,4,2,2],[16,4,2,2],[14,6,2,2],[16,6,2,2],
 [14,4,1,1],[16,6,1,1],[16,6,1,0],[16,8,1,0]
])neighbors.push([`transit-${transit}-return-${returnLength}-damage-${damage}-injury-2-spares-${spares}`,
 ['--phase-lengths',`5,${transit},${returnLength}`,'--damage',String(damage),'--late-injury-reduction','2','--starting-components',String(spares)]]);
const lengths=[['baseline',[]]];
for(const [opening,transit,returnLength,damage,spares] of [
 [5,16,8,0,2],[5,16,12,0,2],[5,16,16,0,2],
 [5,16,12,0,0],[5,16,12,1,0],
 [8,16,8,1,2],[16,16,8,1,2],[24,16,8,1,2],[36,16,8,1,2],
 [16,16,12,0,2],[36,16,16,0,2],[36,18,18,0,0]
])lengths.push([`lengths-${opening}-${transit}-${returnLength}-damage-${damage}-injury-2-spares-${spares}`,
 ['--phase-lengths',`${opening},${transit},${returnLength}`,'--damage',String(damage),'--late-injury-reduction','2','--starting-components',String(spares)]]);
const paired=(base,other,key)=>{
 assert.equal(base.length,other.length);const delta=base.map((row,i)=>{assert.equal(row.seed,other[i].seed);return other[i][key]-row[key]});
 const mean=delta.reduce((s,n)=>s+n,0)/delta.length;
 const se=delta.length>1?Math.sqrt(delta.reduce((s,n)=>s+(n-mean)**2,0)/(delta.length-1)/delta.length):0;
 return {mean,approximate95:[mean-1.96*se,mean+1.96*se]};
};
function summarize(reports){
 const base=reports[0].result;
 const rows=reports.map(({name,args,result:r})=>({name,args,fitness:r.fitness.perGameMean.mean,turnWeightedFitness:r.fitness.turnWeightedMean,
  turns:r.duration.ordinaryResponses.mean,responses:r.duration.responses.mean,lowFitnessTurns:r.fitness.lowFitnessTurns.mean,
  winRate:r.winRate,fitnessDelta:paired(base.fitness.rows,r.fitness.rows,'meanFitness'),turnsDelta:paired(base.fitness.rows,r.fitness.rows,'ordinaryTurns')}));
 for(const row of rows){row.pareto=!rows.some(other=>other.fitness<=row.fitness&&other.turns>=row.turns&&(other.fitness<row.fitness||other.turns>row.turns));
  row.improvesBoth=row.fitness<rows[0].fitness&&row.turns>rows[0].turns;
  row.pairedIntervalsImproveBoth=row.fitnessDelta.approximate95[1]<0&&row.turnsDelta.approximate95[0]>0;}
 return rows;
}
if(require.main===module){
 assert(Number.isInteger(games)&&games>0&&Number.isInteger(seedStart));
 const reports=[];
 for(const [name,extra] of mode==='neighbors'?neighbors:mode==='lengths'?lengths:variants){
  console.error('Profile '+name);
  const command=['--games',String(games),'--seed-start',String(seedStart),'--policy',policy,'--commitment-cost',cost,'--fitness-rows',...extra];
  const result=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'simulate.cjs'),...command],{encoding:'utf8',maxBuffer:64*1024*1024}));
  reports.push({name,args:extra,result});
 }
 console.log(JSON.stringify({purpose:'Minimize per-game mean pre-response asset fitness; maximize ordinary playable crisis turns. No scalar weighting of competing objectives.',mode,games,seedStart,policy,commitmentCost:Number(cost),summary:summarize(reports),reports},null,2));
}
module.exports={paired,summarize,variants};
