const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {applyRewardRule,buildSimulator,cases}=require('./reward-study.cjs');
const fixture=()=>({1:[{id:'a',win:{components:1,oxygen:2},fail:{components:-2}},
 {id:'b',win:{components:2,repairSystem:'thermal'},fail:{injure:1}},
 {id:'c',win:{heal:1},fail:{}},{id:'route',route:true,win:{components:9}},
 {id:'terminal',terminal:true,win:{components:9}}],2:[],3:[]});
for(const rule of cases){
 const cards=fixture(),before=JSON.parse(JSON.stringify(cards)),metadata=applyRewardRule(cards,rule);
 assert.deepEqual(metadata.eligibleIds,rule.scope==='all'?['a','b','c']:['a','b']);
 for(let i=0;i<5;i++)assert.deepEqual(cards[1][i].fail,before[1][i].fail);
 assert.equal(cards[1][0].win.oxygen,2);assert.equal(cards[1][1].win.repairSystem,'thermal');assert.equal(cards[1][2].win.heal,1);
 for(const i of [3,4])assert.deepEqual(cards[1][i],before[1][i]);
 for(const i of [0,1])assert.equal(cards[1][i].win.components||0,rule.amount===null?before[1][i].win.components:rule.amount);
 if(rule.scope==='existing')assert.deepEqual(cards[1][2].win,before[1][2].win);
 if(rule.amount===0)assert(!('components' in cards[1][0].win),'Zero awards should not consume reward RNG');
}
for(const rule of [{scope:'all',amount:null},{scope:'existing',amount:-1},{scope:'existing',amount:0.5}])assert.throws(()=>applyRewardRule(fixture(),rule));
assert.throws(()=>buildSimulator('missing insertion points',cases[0]));
const source=fs.readFileSync(path.join(__dirname,'simulate.cjs'),'utf8');const transformed=buildSimulator(source,cases[0]);assert(transformed.includes('successRewardLedger'));assert(transformed.includes('Invalid success reward rule'));
// Integration: instrumented control must give identical seeded outcomes; award ledger counts only success rewards.
const output=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'reward-study.cjs'),'--games','20','--profiles','none,two,every-one'],{encoding:'utf8',maxBuffer:32*1024*1024}));
const os=require('node:os'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'fixed-reward-control-'));let normal;
try{
 fs.mkdirSync(path.join(temp,'tools'));
 fs.copyFileSync(path.join(__dirname,'../docs/simulations/surplus-before-engine.html.txt'),path.join(temp,'index.html'));
 for(const file of ['simulate.cjs','recovery-summary.cjs'])fs.copyFileSync(path.join(__dirname,file),path.join(temp,'tools',file));
 normal=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),'--games','20','--seed-start','2100000','--policy','salvage','--commitment-cost','0.5','--fitness-rows'],{encoding:'utf8'}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
assert.deepEqual(output.reports[0].result.fitness,normal.fitness);assert.deepEqual(output.reports[0].result.duration,normal.duration);
assert.deepEqual(output.reports[0].result.failedCrises,normal.failedCrises);assert.equal(output.reports[0].result.wins,normal.wins);
for(const {rule,result:r} of output.reports){
 const stats=r.successRewardExperiment.actual,definition=r.successRewardExperiment.definition;
 assert.equal(r.successComponentRewards.enabled,false,'Fixed-reward history must not combine with the live surplus rule');
 assert.equal(definition.eligibleIds.length,rule.scope==='all'?72:10);
 assert.equal(stats.tokens,Object.values(stats.byPhase).reduce((s,p)=>s+p.tokens,0));
 assert.equal(stats.awards,Object.values(stats.byPhase).reduce((s,p)=>s+p.awards,0));
 const poolIds=new Set(Object.values(r.phasePools).flatMap(p=>p.ids));
 assert(definition.eligibleIds.every(id=>poolIds.has(id)));
 assert.equal(stats.eligibleSuccesses,Object.values(stats.byPhase).reduce((s,p)=>s+p.eligibleSuccesses,0));
 if(rule.amount!==null)assert.equal(stats.tokens,rule.amount*stats.awards);
 if(rule.amount>0)assert.equal(stats.awards,stats.eligibleSuccesses);
 if(rule.amount===0){assert(stats.eligibleSuccesses>0);assert.equal(stats.awards,0);}
 assert(r.fitness.rows.every(g=>g.meanFitness>0&&g.meanFitness<=1));
}
console.log('PASS: reward quantity/scope, preserve other rewards/failures/route/terminal, integer/zero-RNG rules, baseline replay, actual award ledger and temporary-only experiments');
