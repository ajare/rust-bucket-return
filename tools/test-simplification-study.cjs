// Analysis harness integrity, historical baseline reproduction and zero-failure exposure.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {load,stats}=require('./capability-demand.cjs');
const {precedingEngine,ablationEngine,run}=require('./simplification-study.cjs');
const root=path.join(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'spaceship-study-test-'));
const liveBytes=fs.readFileSync(path.join(root,'index.html'));
try{
 const file=path.join(temp,'before.html');fs.writeFileSync(file,precedingEngine());
 const before=load(file),live=load();
 assert.equal(Object.keys(before.CAPS).length,12);assert.equal(before.SYSTEM_DEFS.length,18);
 assert.equal(Object.keys(live.CAPS).length,10);assert.equal(live.SYSTEM_DEFS.length,16);
 const oldStats=Object.fromEntries(stats(before).map(s=>[s.cap,s]));
 assert.equal(oldStats.SIG.mentions,15);assert.equal(oldStats.SIG.producers,3);assert.equal(oldStats.SIG.normal,5);
 assert.equal(oldStats.LFS.mentions,8);assert.equal(oldStats.LFS.producers,1);
 assert.equal(before.CRISES[2].find(c=>c.id==='reboot').fail.damageSystem,'maincomp');
 assert.equal(before.SYSTEM_DEFS.find(d=>d.id==='lifesupport').sfx.heal,undefined);
 for(const level of ['easy','normal','hard']){
  const b=load(file,level),a=load(undefined,level);assert.deepEqual(b.FAILURE_BALANCE,a.FAILURE_BALANCE);
  assert.deepEqual(b.ROUTES,a.ROUTES);assert.deepEqual(b.REENTRY,a.REENTRY);
  for(const phase of [1,2,3])for(const c of a.CRISES[phase]){
   const previous=b.CRISES[phase].find(x=>x.id===c.id);assert(previous);
   if(c.id==='reboot')previous.fail.damageSystem='comms';
   assert.deepEqual(previous.fail,c.fail);delete previous.win.components;assert.deepEqual(previous.win,c.win);
  }
 }
 for(const name of ['no-service-lfs','no-fabricator-signal']){
  fs.writeFileSync(file,ablationEngine(name));const data=load(file);
  assert.equal(data.SYSTEM_DEFS.length,16);for(const cards of Object.values(data.CRISES))for(const c of cards)delete c.win.components;
  assert.deepEqual(data.CRISES,live.CRISES);
  const id=name==='no-service-lfs'?'service':'fabricator',cap=id==='service'?'LFS':'SIG';
  for(const mode of ['n','r','s'])assert.equal(data.SYSTEM_DEFS.find(d=>d.id===id)[mode]?.[cap],undefined);
 }
 const doctorOnly=ablationEngine('doctor-heal-only');assert(!doctorOnly.includes('G.crewBonus.LFS=(G.crewBonus.LFS||0)+2'));
 const report=run({games:10,outDir:temp});assert(report.baselineValidated);
 for(const level of ['easy','normal','hard'])for(const variant of ['before','after']){
  const result=JSON.parse(fs.readFileSync(path.join(temp,'simplification-'+variant+'-'+level+'.json'),'utf8'));
  if(variant==='after'){
   const historical=JSON.parse(fs.readFileSync(path.join(root,'docs/simulations/simplification-after-'+level+'.json'),'utf8'));
   assert.equal(result.engineSha256,historical.engineSha256);
   assert.deepEqual(result.fitness.rows,historical.fitness.rows.slice(0,10),'Historical simplification study stays frozen before smoothing');
  }
  const seen=result.crisisExposure.reduce((n,c)=>n+c.seen,0);
  assert.equal(seen,result.fitness.rows.reduce((n,row)=>n+row.responses,0));
  assert(result.crisisExposure.every(c=>c.failed>=0&&c.failed<=c.seen&&c.failureRate===c.failed/c.seen));
  assert(result.crisisExposure.some(c=>c.failed===0),'Successful-only cards must count toward exposure');
  const s=report.difficulties[level][variant];assert(s.ordinaryFailures.rate>=0&&s.ordinaryFailures.rate<=1);
 }
 assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),liveBytes,'Study never mutates gameplay');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('PASS: reconstructed baseline, unchanged failures/routes, per-seed benchmark reproduction, ablations, complete exposure and read-only gameplay');
