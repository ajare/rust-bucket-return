// Shared analysis of game lengths and sampled recovery trajectories.
function distribution(values){
 if(!values.length)return {n:0};
 const sorted=values.slice().sort((a,b)=>a-b),n=sorted.length,mean=values.reduce((s,x)=>s+x,0)/n;
 const quantile=p=>{const at=(n-1)*p,i=Math.floor(at);return sorted[i]+(sorted[Math.min(i+1,n-1)]-sorted[i])*(at-i)};
 const histogram={};for(const v of values)histogram[v]=(histogram[v]||0)+1;
 return {n,mean,standardDeviation:Math.sqrt(values.reduce((s,x)=>s+(x-mean)**2,0)/n),min:sorted[0],p10:quantile(.1),p25:quantile(.25),median:quantile(.5),p75:quantile(.75),p90:quantile(.9),max:sorted[n-1],histogram};
}
function summarizeRecovery(rows){
 const byGame=new Map();for(const row of rows){if(!byGame.has(row.seed))byGame.set(row.seed,[]);byGame.get(row.seed).push(row)}
 function suffix(threshold){
  const onsets=[];
  for(const seq of byGame.values()){
   if(seq[0].actualWin)continue;
   let i=seq.length-1;while(i>=0&&seq[i].recoveryRate<=threshold)i--;
   const tail=seq.slice(i+1);
   // Do not call a temporary dip followed by recovery a sustained spiral.
   if(tail.length>=2&&tail[0].endStage-tail[0].stage>=2)onsets.push(tail[0]);
  }
  return {games:onsets.length,onsetStage:distribution(onsets.map(x=>x.stage)),delay:distribution(onsets.map(x=>x.endStage-x.stage)),
   onsetByEndOfPhaseI:onsets.filter(x=>x.stage<=5).length,
   doctorUnavailableAtOnset:onsets.filter(x=>x.doctorState!=='ok').length,
   oxygenZeroAtOnset:onsets.filter(x=>x.oxygen===0).length};
 }
 return {sustainedLowHope:suffix(.05),sustainedZeroRecovery:suffix(0),
  actualWinningGamesWithLowHopeCheckpoint:[...byGame.values()].filter(seq=>seq[0].actualWin&&seq.some(x=>x.recoveryRate<=.05)).length,
  actualWinningGamesWithZeroRecoveryCheckpoint:[...byGame.values()].filter(seq=>seq[0].actualWin&&seq.some(x=>x.recoveryRate===0)).length};
}
module.exports={distribution,summarizeRecovery};
