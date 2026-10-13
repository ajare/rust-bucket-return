#!/usr/bin/env node
// Current engine capability catalogue. node tools/capability-demand.cjs --write
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function load(file=path.join(root,'index.html'),difficulty='normal'){
 const html=fs.readFileSync(file,'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
 const ctx={URLSearchParams,location:{search:'?seed=17&difficulty='+difficulty},document:{getElementById:()=>({innerHTML:'',textContent:'',disabled:false,classList:{add(){},remove(){}}}),addEventListener(){}}};
 vm.createContext(ctx);vm.runInContext(script+';globalThis.data={CAPS,CRISES,REENTRY,ROUTES,SYSTEM_DEFS,BASE_FAILURES,FAILURE_BALANCE,BASE_DECK};',ctx);
 return JSON.parse(JSON.stringify(ctx.data));
}
const arms=c=>[c.req,...(c.alt?[c.alt]:[])];
const mentioned=(c,k)=>arms(c).some(r=>(r[k]||0)>0);
const unavoidable=(c,k)=>arms(c).every(r=>(r[k]||0)>0);
const format=r=>Object.entries(r).map(([k,n])=>k+' '+n).join(' AND ');
const requirement=c=>c.alt?'('+format(c.req)+') OR ('+format(c.alt)+')':format(c.req);
function stats(data){
 const cards=Object.values(data.CRISES).flat();
 assert.equal(cards.length,72);assert.equal(new Set(cards.map(c=>c.id)).size,72);
 return Object.entries(data.CAPS).map(([cap,name])=>{
  const matches=cards.filter(c=>mentioned(c,cap)),sources=data.SYSTEM_DEFS.filter(s=>(s.n[cap]||0)>0);
  return {cap,name,mentions:matches.length,unavoidable:matches.filter(c=>unavoidable(c,cap)).length,
   phase:[1,2,3].map(p=>data.CRISES[p].filter(c=>mentioned(c,cap)).length),producers:sources.length,
   normal:sources.reduce((n,s)=>n+s.n[cap],0),redline:data.SYSTEM_DEFS.reduce((n,s)=>n+(s.r?.[cap]||0),0),sacrifice:data.SYSTEM_DEFS.reduce((n,s)=>n+(s.s?.[cap]||0),0)};
 });
}
function markdown(data,before){
 const current=stats(data),old=Object.fromEntries(stats(before).map(s=>[s.cap,s]));
 let out='# Crisis capability demand\n\nGenerated from the current `index.html` with `node tools/capability-demand.cjs --write`.\nRequirements are identical across Easy, Normal and Hard. For the rebalance rationale and\nsimulation comparison, see [Capability rebalance](capability-rebalance.md).\nThe current ten-capability/sixteen-system rules are described in [Capability simplification](capability-simplification.md).\n“Previous mentions” refers to the archived pre-rebalance engine, not the immediately preceding rules.\n\n## Demand and baseline production\n\nCounts cover 72 unique ordinary crisis definitions, not per-game draws. “Unavoidable” means\nevery OR arm requires that capability to resolve successfully, not that a failed card cannot\nbe survived. Each card is counted at most once per capability; counts overlap.\nNormal output is the whole original operational fleet: no crew, damage, fabricated copies,\nheat costs or five-card draw constraints.\n\n| Capability | Previous mentions | Current mentions | Unavoidable | Phase I / II / III | Normal producers | Normal fleet output |\n|---|---:|---:|---:|---|---:|---:|\n';
 for(const s of current.slice().sort((a,b)=>b.mentions-a.mentions))out+=`| ${s.name} (${s.cap}) | ${old[s.cap].mentions} | ${s.mentions} | ${s.unavoidable} | ${s.phase.join(' / ')} | ${s.producers} | ${s.normal} |\n`;
 out+='\n## System outputs\n\n| System | Normal | Redline | Sacrifice |\n|---|---|---|---|\n';
 for(const s of data.SYSTEM_DEFS)out+=`| ${s.name} | ${Object.keys(s.n).length?format(s.n):'Passive only'} | ${s.r?format(s.r):'Unavailable'} | ${s.s?format(s.s)||'Side effects only':'Unavailable'} |\n`;
 out+='\nHeat, damage and Sacrifice side effects still apply; this table lists capability output only.\n\n## Every ordinary crisis\n\n';
 for(const p of [1,2,3]){
  out+=`### Phase ${p}: ${data.CRISES[p].length} cards\n\n| Crisis | Required capability output |\n|---|---|\n`;
  for(const c of data.CRISES[p])out+=`| ${c.title} | ${requirement(c)} |\n`;
  out+='\n';
 }
 out+='## Routes and final Re-entry\n\n| Check | Requirement |\n|---|---|\n';
 for(const r of Object.values(data.ROUTES))out+=`| ${r.title} (direct burn) | ${format(r.req)} |\n`;
 out+=`| FINAL RE-ENTRY | ${format(data.REENTRY.req)} |\n\nSafe routes have no capability check. Failing Re-entry can still yield emergency-landing victory.\n\n## Reverse index\n\n`;
 for(const s of current){
  out+=`### ${s.name} (${s.cap})\n\n`;
  for(const [p,cs] of Object.entries(data.CRISES))for(const c of cs.filter(c=>mentioned(c,s.cap)))out+=`- Phase ${p}: **${c.title}** — ${requirement(c)} [${unavoidable(c,s.cap)?'unavoidable':'optional alternative'}]\n`;
  out+='\n';
 }
 out+='## Interpreting demand\n\nNavigation also corrects Course Error through three surplus NAV on non-route responses.\nSurplus Cooling offsets system-use heat. Thrust is needed for direct burns. Life Support\nhas a ship-system oxygen passive independent of LFS output. Explicit requirement counts\ntherefore are not actual use frequencies or supply/demand balance ratios. Phase pools are\n36/18/18 but nominal lengths are 5/16/4; routes and early defeat change exposure.\n\nEngine SHA-256: `'+crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex')+'`.\n';
 return out;
}
if(require.main===module){
 const data=load(),before=load(path.join(root,'docs/simulations/capability-rebalance-before-engine.html.txt'));
 if(process.argv.includes('--write')){
  fs.writeFileSync(path.join(root,'docs/capability-demand.md'),markdown(data,before));
  console.log('Updated docs/capability-demand.md');
 }else console.log(JSON.stringify(stats(data),null,2));
}
module.exports={load,stats,arms,mentioned,unavoidable,requirement,markdown};
