#!/usr/bin/env node
// Historical fixed-reward sweep on frozen pre-surplus rules. Never writes live rules.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {paired}=require('./fitness-study.cjs');
const cases=[
 {name:'current',scope:'existing',amount:null},
 {name:'none',scope:'existing',amount:0},
 {name:'one',scope:'existing',amount:1},
 {name:'two',scope:'existing',amount:2},
 {name:'three',scope:'existing',amount:3},
 {name:'four',scope:'existing',amount:4},
 {name:'every-one',scope:'all',amount:1},
 {name:'every-two',scope:'all',amount:2}
];
function applyRewardRule(crises,rule){
 if(!['existing','all'].includes(rule.scope)||!(Number.isInteger(rule.amount)&&rule.amount>=0||rule.amount===null&&rule.scope==='existing'))throw new Error('Invalid success reward rule');
 const eligibleIds=[],byPhase={};
 for(const [phase,cards] of Object.entries(crises)){
  const bin=byPhase[phase]={cards:cards.length,eligible:0,authoredTokens:0,configuredTokens:0};
  for(const c of cards){
   if(c.route||c.terminal)continue;
   bin.authoredTokens+=Math.max(0,c.win?.components||0);
   if(rule.scope==='existing'&&!(c.win?.components>0))continue;
   eligibleIds.push(c.id);bin.eligible++;
   if(rule.amount!==null){c.win={...c.win};if(rule.amount)c.win.components=rule.amount;else delete c.win.components;}
   bin.configuredTokens+=Math.max(0,c.win?.components||0);
  }
 }
 return {eligibleIds,byPhase};
}
function buildSimulator(source,rule){
 const ledgerScript=`
 const rewardEligible=new Set(globalThis.successRewardEligibleIds);
 let rewardStats={eligibleSuccesses:0,awards:0,tokens:0,byPhase:{}};
 const rewardOriginalApply=applyEffects;
 applyEffects=(e,...rest)=>{
  const c=G?.crisis;
  if(c&&!c.route&&!c.terminal&&e===c.win&&rewardEligible.has(c.id)){
   const tokens=Math.max(0,e?.components||0),p=G.phase;
   const bin=rewardStats.byPhase[p]||(rewardStats.byPhase[p]={eligibleSuccesses:0,awards:0,tokens:0});
   rewardStats.eligibleSuccesses++;bin.eligibleSuccesses++;
   if(tokens){rewardStats.awards++;bin.awards++;rewardStats.tokens+=tokens;bin.tokens+=tokens;}
  }
  return rewardOriginalApply(e,...rest);
 };
 globalThis.successRewardLedger=()=>JSON.parse(JSON.stringify(rewardStats));
 `;
 function replaceOnce(oldText,newText){assert.equal(source.split(oldText).length,2,'Simulator insertion point must be unique');source=source.replace(oldText,newText);}
 replaceOnce('const a=sandbox.api;',`const a=sandbox.api;
const successRewardRule=${JSON.stringify(rule)};
const successRewardDefinition=(${applyRewardRule.toString()})(a.CRISES,successRewardRule);
sandbox.successRewardEligibleIds=successRewardDefinition.eligibleIds;
vm.runInContext(${JSON.stringify(ledgerScript)},sandbox);`);
 replaceOnce('console.log(JSON.stringify({simulatorSha256:',`console.log(JSON.stringify({successRewardExperiment:{rule:successRewardRule,definition:successRewardDefinition,actual:sandbox.successRewardLedger()},simulatorSha256:`);
 return source;
}
function summarize(reports){
 const base=reports[0].result;
 return reports.map(({rule,result:r})=>({name:rule.name,scope:rule.scope,amount:rule.amount,
  fitness:r.fitness.perGameMean.mean,turns:r.duration.ordinaryResponses.mean,lowFitnessTurns:r.fitness.lowFitnessTurns.mean,
  winRate:r.winRate,awardsPerGame:r.successRewardExperiment.actual.awards/r.games,tokensPerGame:r.successRewardExperiment.actual.tokens/r.games,
  fitnessDelta:paired(base.fitness.rows,r.fitness.rows,'meanFitness'),turnsDelta:paired(base.fitness.rows,r.fitness.rows,'ordinaryTurns'),
  winsDelta:paired(base.fitness.rows,r.fitness.rows,'won'),lowFitnessDelta:paired(base.fitness.rows,r.fitness.rows,'lowFitnessTurns')}));
}
if(require.main===module){
 const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1]};
 const games=Number(arg('games',10000)),seedStart=Number(arg('seed-start',2100000)),cost=arg('commitment-cost','0.5');
 const requested=arg('profiles',cases.map(c=>c.name).join(',')).split(',');assert(requested.every(n=>cases.some(c=>c.name===n)),'Unknown profile');
 const selected=[cases[0],...cases.slice(1).filter(c=>requested.includes(c.name))];
 assert(Number.isInteger(games)&&games>0&&Number.isInteger(seedStart));
 const baseSource=fs.readFileSync(path.join(__dirname,'simulate.cjs'),'utf8');
 // Fixed-reward experiments are historical, not combined with the shipped surplus rule.
 const engine=fs.readFileSync(path.join(__dirname,'../docs/simulations/surplus-before-engine.html.txt'));
 const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-rewards-'));
 const reports=[];
 try{
  fs.mkdirSync(path.join(temp,'tools'));fs.writeFileSync(path.join(temp,'index.html'),engine);
  fs.copyFileSync(path.join(__dirname,'recovery-summary.cjs'),path.join(temp,'tools/recovery-summary.cjs'));
  for(const rule of selected){
   console.error('Reward profile '+rule.name);
   const simulatorSource=buildSimulator(baseSource,rule);fs.writeFileSync(path.join(temp,'tools/simulate.cjs'),simulatorSource);
   const command=['--games',String(games),'--seed-start',String(seedStart),'--policy','salvage','--commitment-cost',cost,'--fitness-rows'];
   const result=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),...command],{encoding:'utf8',maxBuffer:128*1024*1024}));
   assert.equal(result.engineSha256,sha(engine));assert.equal(result.simulatorSha256,sha(simulatorSource));
   reports.push({rule,simulatorSource,result});
  }
  console.log(JSON.stringify({purpose:'Historical fixed success reward quantity/frequency experiment on frozen pre-surplus rules; no live rule changes.',games,seedStart,policy:'salvage',commitmentCost:Number(cost),
   studySha256:sha(fs.readFileSync(__filename)),baseSimulatorSha256:sha(baseSource),engineSha256:sha(engine),summary:summarize(reports),reports}));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={cases,applyRewardRule,buildSimulator,summarize};
