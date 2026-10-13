#!/usr/bin/env node
// Compare the exact archived pre-smoothing engine with the shipped engine. Analysis only.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {load}=require('./capability-demand.cjs');
const {summarize}=require('./simplification-study.cjs');
const root=path.join(__dirname,'..'),beforeFile=path.join(root,'docs/simulations/distribution-before-engine.html.txt');
const afterFile=path.join(root,'docs/simulations/surplus-before-engine.html.txt');
function supply(data){
 return Object.fromEntries(Object.keys(data.CAPS).map(cap=>[cap,Object.fromEntries(['n','r','s'].map(mode=>{
  const sources=data.SYSTEM_DEFS.filter(d=>(d[mode]?.[cap]||0)>0).map(d=>({id:d.id,output:d[mode][cap]}));
  return [mode,{sources,total:sources.reduce((n,s)=>n+s.output,0)}];
 }))]));
}
function run({games=10000,seedStart=2100000,difficulty='all',policy='salvage',cost=.5,outDir=path.join(root,'docs/simulations')}={}){
 assert(Number.isInteger(games)&&games>0);assert(Number.isInteger(seedStart));assert(['all','easy','normal','hard'].includes(difficulty));
 const before=load(beforeFile),after=load(afterFile),bSupply=supply(before),aSupply=supply(after);
 assert.deepEqual(before.CAPS,after.CAPS);assert.deepEqual(before.CRISES,after.CRISES);
 assert.deepEqual(before.ROUTES,after.ROUTES);assert.deepEqual(before.REENTRY,after.REENTRY);
 assert.deepEqual(before.SYSTEM_DEFS.map(d=>d.id),after.SYSTEM_DEFS.map(d=>d.id));
 for(const cap of Object.keys(before.CAPS))for(const mode of ['n','r','s'])assert.equal(bSupply[cap][mode].total,aSupply[cap][mode].total,cap+' '+mode+' preserves fleet total');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-distribution-'));
 try{
  fs.mkdirSync(path.join(temp,'tools'));fs.mkdirSync(outDir,{recursive:true});
  for(const name of ['simulate.cjs','recovery-summary.cjs'])fs.copyFileSync(path.join(root,'tools',name),path.join(temp,'tools',name));
  const report={games,seedStart,policy,commitmentCost:cost,beforeSupply:bSupply,afterSupply:aSupply,
   pairing:'Same seed indices and identical opening crew/deck/draw selection. Decisions and later RNG paths can diverge.',
   caveat:'One heuristic policy, no fabrication planning. Equal fleet output totals do not guarantee equal difficulty.',difficulties:{}};
  for(const level of difficulty==='all'?['easy','normal','hard']:[difficulty]){
   const rows=[];
   for(const variant of ['before','after']){
    console.error(level+' '+variant+' ('+games+' games)');
    fs.copyFileSync(variant==='before'?beforeFile:afterFile,path.join(temp,'index.html'));
    const result=JSON.parse(execFileSync(process.execPath,[path.join(temp,'tools/simulate.cjs'),'--games',String(games),'--seed-start',String(seedStart),
     '--policy',policy,'--commitment-cost',String(cost),'--difficulty',level,'--fitness-rows'],{encoding:'utf8',maxBuffer:128*1024*1024}));
    if(variant==='before'&&seedStart===2100000&&policy==='salvage'&&cost===.5&&games<=10000){
     const benchmark=JSON.parse(fs.readFileSync(path.join(root,'docs/simulations/simplification-after-'+level+'.json'),'utf8'));
     assert.equal(result.engineSha256,benchmark.engineSha256);
     assert.deepEqual(result.fitness.rows,benchmark.fitness.rows.slice(0,games),'Reproduce pre-smoothing per-seed outcomes/durations/fitness');
     if(games===10000)for(const key of ['wins','duration','failedCrises','losses','crewDeathsFromSuffocation'])assert.deepEqual(result[key],benchmark[key]);
     report.baselineValidated=true;
    }
    fs.writeFileSync(path.join(outDir,'distribution-'+variant+'-'+level+'.json'),JSON.stringify(result,null,2)+'\n');rows.push(result);
   }
   report.difficulties[level]=summarize(...rows);
  }
  fs.writeFileSync(path.join(outDir,'distribution-summary.json'),JSON.stringify(report,null,2)+'\n');return report;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
if(require.main===module){
 const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:args[i+1]};
 console.log(JSON.stringify(run({games:Number(arg('games',10000)),seedStart:Number(arg('seed-start',2100000)),difficulty:arg('difficulty','all'),
  policy:arg('policy','salvage'),cost:Number(arg('commitment-cost',.5)),outDir:path.resolve(arg('out-dir',path.join(root,'docs/simulations')))}),null,2));
}
module.exports={supply,run,beforeFile,afterFile};
