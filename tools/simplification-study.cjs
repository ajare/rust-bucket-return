#!/usr/bin/env node
// Analysis only. Reconstruct the immediately preceding rules in a temporary workspace,
// not the earlier pre-rebalance rules. The shipped index.html is never modified.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {load,stats}=require('./capability-demand.cjs');
const {paired}=require('./fitness-study.cjs');
const root=path.join(__dirname,'..'),archive=path.join(root,'docs/simulations/capability-rebalance-before-engine.html.txt');
// Freeze this historical study at the original simplified rules, before distribution smoothing.
const simplifiedArchive=path.join(root,'docs/simulations/distribution-before-engine.html.txt');
const previousChecks={
 reboot:[{CMP:5}], 'e-firmware':[{CMP:2},{SIG:2}], 'sensor-alarm':[{DET:5},{CMP:5}],
 fabjam:[{ENG:4,CMP:3}], 'precision-nav':[{NAV:6,CMP:4}], gnc:[{CMP:5,NAV:4,CON:3}],
 illness:[{MED:5}], zerog:[{MED:4}], 'e-cold':[{MED:2},{CLG:3}],
 'e-recycler':[{MED:2},{DET:2}], 'e-adaptation':[{MED:3},{NAV:3}],
 'e-sleep':[{MED:3},{SIG:3}], fatigue:[{MED:5,LFS:3}], lscontam:[{MED:4,LFS:4}]
};
function precedingEngine(){
 const old=load(archive),live=load(simplifiedArchive),defs=old.SYSTEM_DEFS;
 // Restore the coordinated supply introduced by the capability rebalance.
 for(const [id,cap] of Object.entries({engine:'NAV',thrusters:'NAV',maincomp:'SIG',sensors:'SIG',navcomp:'DET',comms:'DET',aux:'CLG'})){
  const d=defs.find(d=>d.id===id);for(const [i,mode] of ['n','r','s'].entries())d[mode][cap]=i+1;
 }
 const service=defs.find(d=>d.id==='service');service.n={ENG:1,CLG:1};service.r={ENG:4,CLG:2};
 const fuel=defs.find(d=>d.id==='fuelcells');fuel.n.POW=1;fuel.r.POW=3;fuel.s.POW=5;
 const checks=Object.fromEntries(Object.values(live.CRISES).flat().map(c=>[c.id,previousChecks[c.id]||[c.req,...(c.alt?[c.alt]:[])]]));
 // The archive has unchanged 12-capability crew, Doctor, passives, fitness and scoring.
 // Override only requirements and output vectors, after archive failure scaling.
 const patch=`\n// Analysis reconstruction of the post-rebalance, pre-simplification rules.\n`+
 `for(const [id,arms] of Object.entries(${JSON.stringify(checks)})){const c=Object.values(CRISES).flat().find(c=>c.id===id);c.req=arms[0];if(arms[1])c.alt=arms[1];else delete c.alt;}\n`+
 `for(const vector of ${JSON.stringify(defs.map(d=>({id:d.id,n:d.n,r:d.r,s:d.s})) )}){const d=SYSTEM_DEFS.find(d=>d.id===vector.id);for(const mode of ['n','r','s'])d[mode]=vector[mode];}\n`;
 return fs.readFileSync(archive,'utf8').replace(/newGame\(\);render\(\);\s*<\/script>/,patch+'newGame();render();\n</script>');
}
function summarize(before,after){
 assert.equal(before.games,after.games);assert.equal(before.seedStart,after.seedStart);
 assert.equal(before.policy,after.policy);assert.equal(before.commitmentCost,after.commitmentCost);
 assert.equal(before.difficulty,after.difficulty);assert.deepEqual(before.balance,after.balance);
 const ordinary=r=>r.crisisExposure.filter(c=>!['DIRECT RETURN','INNER SYSTEM SLINGSHOT','RE-ENTRY'].includes(c.title));
 const failure=r=>{const cards=ordinary(r),seen=cards.reduce((n,c)=>n+c.seen,0),failed=cards.reduce((n,c)=>n+c.failed,0);return {seen,failed,rate:failed/seen}};
 const measure=r=>({winRate:r.winRate,winConfidence95:r.confidence95,ordinaryTurns:r.duration.ordinaryResponses.mean,
  responses:r.duration.responses.mean,ordinaryFailures:failure(r),losses:r.losses,suffocationLosses:r.crewDeathsFromSuffocation,
  lossPhases:r.duration.lossPhases,failedByStage5:r.duration.failedByStage5,winningScore:r.meanWinningScore,
  fitness:r.fitness.perGameMean.mean,lowFitnessTurns:r.fitness.lowFitnessTurns.mean});
 const winRows=r=>r.fitness.rows.map(x=>({...x,won:Number(x.won)}));
 const byTitle=new Map(before.crisisExposure.map(c=>[c.title,c]));
 return {before:measure(before),after:measure(after),
  delta:{wins:paired(winRows(before),winRows(after),'won'),ordinaryTurns:paired(before.fitness.rows,after.fitness.rows,'ordinaryTurns')},
  crisisChanges:after.crisisExposure.map(c=>{const b=byTitle.get(c.title);return {title:c.title,beforeSeen:b?.seen||0,afterSeen:c.seen,
   beforeFailed:b?.failed||0,afterFailed:c.failed,beforeRate:b?.failureRate??null,afterRate:c.failureRate,rateDelta:b?c.failureRate-b.failureRate:null}}).sort((a,b)=>a.rateDelta-b.rateDelta)};
}
function run({games=10000,seedStart=2100000,difficulty='all',policy='salvage',cost=.5,outDir=path.join(root,'docs/simulations')}={}){
 assert(Number.isInteger(games)&&games>0);assert(Number.isInteger(seedStart));
 assert(['all','easy','normal','hard'].includes(difficulty));
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-simplification-'));
 try{
  fs.mkdirSync(path.join(temp,'tools'));fs.mkdirSync(outDir,{recursive:true});
  for(const name of ['simulate.cjs','recovery-summary.cjs'])fs.copyFileSync(path.join(root,'tools',name),path.join(temp,'tools',name));
  const beforeHtml=precedingEngine(),beforePath=path.join(temp,'index.html');
  fs.writeFileSync(beforePath,beforeHtml);
  const prior=load(beforePath),live=load(simplifiedArchive);assert.equal(Object.keys(prior.CAPS).length,12);assert.equal(prior.SYSTEM_DEFS.length,18);
  assert.deepEqual(prior.BASE_DECK,live.BASE_DECK);assert.deepEqual(prior.ROUTES,live.ROUTES);assert.deepEqual(prior.REENTRY,live.REENTRY);
  assert.deepEqual(Object.fromEntries(stats(prior).map(s=>[s.cap,s.mentions])),{POW:12,THR:7,CON:10,ENG:14,CMP:6,NAV:13,SIG:15,DET:17,LFS:8,MED:8,CLG:16,PRO:8});
  fs.writeFileSync(path.join(outDir,'simplification-before-engine.html.txt'),beforeHtml);
  const report={games,seedStart,policy,commitmentCost:cost,baseline:'Reconstructed post-rebalance/pre-simplification rules; benchmark-validated when using historical seed range.',
   pairing:'Same seed indices, not fixed roster/decks: the smaller specialist pool changes RNG consumption.',
   fitnessCaveat:'The fleet and fitness denominator changed; absolute fitness/low-fitness differences are not like-for-like asset health.',difficulties:{}};
  for(const level of difficulty==='all'?['easy','normal','hard']:[difficulty]){
   const reports=[];
   for(const variant of ['before','after']){
    console.error(level+' '+variant+' ('+games+' games)');
    fs.writeFileSync(beforePath,variant==='before'?beforeHtml:fs.readFileSync(simplifiedArchive,'utf8'));
    const result=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),'--games',String(games),'--seed-start',String(seedStart),
     '--policy',policy,'--commitment-cost',String(cost),'--difficulty',level,'--fitness-rows'],{encoding:'utf8',maxBuffer:128*1024*1024}));
    if(variant==='before'&&seedStart===2100000&&policy==='salvage'&&cost===.5&&games<=10000){
     const benchmark=JSON.parse(fs.readFileSync(path.join(root,'docs/simulations/capability-rebalance-'+level+'.json'),'utf8'));
     assert.deepEqual(result.fitness.rows,benchmark.fitness.rows.slice(0,games),'Reconstructed baseline must reproduce historical per-seed outcomes, durations and fitness');
     if(games===10000)for(const key of ['wins','duration','failedCrises','losses','crewDeathsFromSuffocation'])assert.deepEqual(result[key],benchmark[key],level+' '+key+' baseline equivalence');
     report.baselineValidated=true;
    }
    fs.writeFileSync(path.join(outDir,'simplification-'+variant+'-'+level+'.json'),JSON.stringify(result,null,2)+'\n');reports.push(result);
   }
   report.difficulties[level]=summarize(...reports);
  }
  fs.writeFileSync(path.join(outDir,'simplification-summary.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
function ablationEngine(name,html=fs.readFileSync(path.join(root,'index.html'),'utf8')){
 const variants={
  'doctor-heal-only':()=>{const old='else{G.crewBonus.LFS=(G.crewBonus.LFS||0)+2;log("Doctor: +2 Life Support.","sys")}';assert(html.includes(old));return html.replace(old,'else{log("Doctor: no injured crewmate to heal.","sys")}');},
  'no-service-lfs':()=>inject('const d=SYSTEM_DEFS.find(d=>d.id==="service");delete d.n.LFS;delete d.r.LFS;'),
  'no-fabricator-signal':()=>inject('const d=SYSTEM_DEFS.find(d=>d.id==="fabricator");for(const mode of ["n","r","s"])delete d[mode].SIG;')
 };
 function inject(code){return html.replace(/newGame\(\);render\(\);\s*<\/script>/,'{'+code+'}\nnewGame();render();\n</script>')}
 assert(name in variants);return variants[name]();
}
function runAblations({games=10000,seedStart=2100000,outDir=path.join(root,'docs/simulations')}={}){
 const current=JSON.parse(fs.readFileSync(path.join(outDir,'simplification-after-normal.json'),'utf8'));
 assert.equal(current.games,games);assert.equal(current.seedStart,seedStart);
 const afterHtml=fs.readFileSync(simplifiedArchive,'utf8');
 assert.equal(current.engineSha256,require('node:crypto').createHash('sha256').update(afterHtml).digest('hex'));
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-simplification-ablation-'));
 try{
  fs.mkdirSync(path.join(temp,'tools'));
  for(const name of ['simulate.cjs','recovery-summary.cjs'])fs.copyFileSync(path.join(root,'tools',name),path.join(temp,'tools',name));
  const report={games,seedStart,difficulty:'normal',policy:current.policy,commitmentCost:current.commitmentCost,
   warning:'One change at a time relative to the simplified game. Effects interact and cannot be added to decompose the total improvement.',variants:{}};
  for(const name of ['doctor-heal-only','no-service-lfs','no-fabricator-signal']){
   console.error('Normal ablation '+name+' ('+games+' games)');
   fs.writeFileSync(path.join(temp,'index.html'),ablationEngine(name,afterHtml));
   const result=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),'--games',String(games),'--seed-start',String(seedStart),
    '--policy',current.policy,'--commitment-cost',String(current.commitmentCost),'--difficulty','normal','--fitness-rows'],{encoding:'utf8',maxBuffer:128*1024*1024}));
   fs.writeFileSync(path.join(outDir,'simplification-ablation-'+name+'.json'),JSON.stringify(result,null,2)+'\n');
   report.variants[name]=summarize(current,result);
  }
  fs.writeFileSync(path.join(outDir,'simplification-ablation-summary.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module){
 const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1]};
 const report=(args.includes('--ablations')?runAblations:run)({games:Number(arg('games',10000)),seedStart:Number(arg('seed-start',2100000)),difficulty:arg('difficulty','all'),
  policy:arg('policy','salvage'),cost:Number(arg('commitment-cost',.5)),outDir:path.resolve(arg('out-dir',path.join(root,'docs/simulations')))});
 console.log(JSON.stringify(report,null,2));
}
module.exports={precedingEngine,summarize,run,ablationEngine,runAblations};
