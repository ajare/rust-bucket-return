// Analysis-only prototype; this does not change or enable the shipped crew rule.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file){
 const script=fs.readFileSync(path.join(__dirname,'../docs/simulations/',file),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
 const ctx={URLSearchParams,location:{search:'?seed=1'},document:{getElementById:()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},disabled:false}),addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(script+`;render=()=>{};globalThis.a={get G(){return G},newGame,SYSTEM_SPECIALISTS,crewClick,computeTotals,drawFive,handFitness,consume};`,ctx);return ctx.a;
}
const prototype=load('standalone-specialists-engine.html.txt'),baseline=load('standalone-specialists-baseline-engine.html.txt');
for(const specialist of prototype.SYSTEM_SPECIALISTS){
 for(const a of [baseline,prototype]){
  a.newGame();a.G.crew[4]={...specialist,state:'ok',used:false};a.G.drawn=[];
  const before=a.computeTotals()[specialist.cap]||0,f=a.handFitness();a.crewClick(specialist.id);
  assert.equal(a.computeTotals()[specialist.cap]||0,before+(a===prototype?2:0),'No-card bonus exists only in prototype');
  assert.equal(a.handFitness(),f,'Same-state asset fitness ignores ability commitments');
  if(a===baseline)continue;
  a.crewClick(specialist.id);assert.equal(a.computeTotals()[specialist.cap],before+2,'No double use');
  a.drawFive();assert.equal(a.computeTotals()[specialist.cap]||0,0,'New response clears bonus');
  a.G.crew[4].state='injured';a.crewClick(specialist.id);assert.equal(a.computeTotals()[specialist.cap]||0,0);
  a.G.crew[4].state='dead';a.crewClick(specialist.id);assert.equal(a.computeTotals()[specialist.cap]||0,0);
  a.G.crew[4].state='ok';a.G.over={win:false};a.crewClick(specialist.id);assert.equal(a.computeTotals()[specialist.cap]||0,0);
 }
}
prototype.newGame();const tech=prototype.SYSTEM_SPECIALISTS.find(c=>c.cap==='LFS');prototype.G.crew[4]={...tech,state:'ok',used:false};
prototype.G.systems.find(s=>s.def.id==='lifesupport').state='destroyed';prototype.crewClick(tech.id);const oxy=prototype.G.oxygen;prototype.consume();
assert.equal(prototype.G.oxygen,oxy-2,'Standalone LFS does not restore the Life Support passive');
console.log('PASS: archived standalone prototype, all12 no-card capabilities, once/reset/health/end guards, unchanged same-state fitness and no restored passive');
