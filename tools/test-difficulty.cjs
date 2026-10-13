// Three injury-only presets, deterministic replay and explicit new-run UI.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
function load(search='?seed=17'){
 const elements=new Map(),listeners={};
 const el=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,value:'',classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}})}return elements.get(id)};
 const ctx={URLSearchParams,location:{search},document:{getElementById:el,addEventListener(type,fn){listeners[type]=fn}}};
 vm.createContext(ctx);vm.runInContext(source+`;const renderUI=render;render=()=>{};
 globalThis.a={get G(){return G},newGame,DIFFICULTIES,DIFFICULTY,FAILURE_BALANCE,CRISES,BASE_FAILURES,REENTRY,ROUTES,BASE_DECK,
 renderUI,showHelp,requestDifficulty,runQuery,consume,handFitness,postMortemHtml};`,ctx);
 const a=ctx.a;a.newGame();return {a,ctx,el,change(value){listeners.change({target:{id:'difficultySelect',value}})},click(act,data={}){listeners.click({target:{closest:()=>({dataset:{act,...data}})}})}};
}
const plain=x=>JSON.parse(JSON.stringify(x));const normal=load(),easy=load('?seed=17&difficulty=easy'),hard=load('?seed=17&difficulty=hard');
assert.equal(normal.a.G.difficulty,'normal');
for(const bad of ['bogus','__proto__','constructor','NORMAL',''])assert.equal(load('?seed=17&difficulty='+bad).a.G.difficulty,'normal');
const expected={easy:{1:{major:0,minor:0},2:{major:0,minor:0},3:{major:0,minor:0}},normal:{1:{major:1,minor:0},2:{major:0,minor:0},3:{major:1,minor:0}},hard:{1:{major:1,minor:0},2:{major:1,minor:0},3:{major:2,minor:1}}};
for(const {a,el} of [easy,normal,hard]){
 assert.deepEqual(plain(a.FAILURE_BALANCE.injuriesByPhase),expected[a.G.difficulty]);
 assert.deepEqual(plain(a.BASE_DECK),{1:5,2:16,3:4});assert.deepEqual(plain(a.REENTRY),plain(normal.a.REENTRY));assert.deepEqual(plain(a.ROUTES),plain(normal.a.ROUTES));
 assert.deepEqual(plain(a.BASE_FAILURES),plain(normal.a.BASE_FAILURES));
 for(const [phase,cards] of Object.entries(a.CRISES))for(const c of cards){
  const ref=normal.a.CRISES[phase].find(x=>x.id===c.id),tier=c.failureTier||(c.alt?'minor':'major');
  assert.equal(c.fail.injure||0,(a.BASE_FAILURES[c.id].injure||0)+expected[a.G.difficulty][phase][tier]);
  const p=plain(c),q=plain(ref);delete p.fail.injure;delete q.fail.injure;assert.deepEqual(p,q,c.id+' only injury hits may change');
 }
 const injuries=id=>Object.values(a.CRISES).flat().find(c=>c.id===id).fail.injure||0;
 assert.equal(injuries('illness'),2+(a.G.difficulty==='hard'?1:0),'Authored illness hits remain');
 assert.equal(injuries('fuelline'),a.G.difficulty==='easy'?0:1,'Major OR uses selected major tier');
 const opening=JSON.stringify(a.G);a.newGame();assert.equal(JSON.stringify(a.G),opening,'Same seed + difficulty restart');
 assert.deepEqual(Array.from(a.G.drawn),Array.from(normal.a.G.drawn));assert.deepEqual(plain(a.G.crew),plain(normal.a.G.crew));
 assert.equal(a.handFitness(),normal.a.handFitness(),'Difficulty is ignored by asset-only fitness');
 a.G.oxygen=0;a.consume();assert.equal(a.G.crew.filter(c=>c.state==='injured').length,1,'Suffocation still hits once on every level');
 a.newGame();a.renderUI();assert.equal(a.G.difficulty,a.DIFFICULTY);
 assert.equal(a.runQuery(17),'?seed=17&difficulty='+a.G.difficulty);
 a.showHelp();assert(el('modal').innerHTML.includes('Difficulty — '+a.DIFFICULTIES[a.G.difficulty].label));
}
// Confirmation and cancel never touch gameplay/RNG; confirm navigates, with no silent mid-run rebalance.
assert.match(html,/<label[^>]*for="difficultySelect"/);assert.match(html,/<select id="difficultySelect"/);
const ui=load('?seed=17&difficulty=normal');ui.a.renderUI();assert.equal(ui.el('difficultySelect').value,'normal');
const before=JSON.stringify(ui.a.G),url=ui.ctx.location.search;ui.change('hard');
assert.equal(JSON.stringify(ui.a.G),before);assert.equal(ui.ctx.location.search,url);assert.equal(ui.el('difficultySelect').value,'normal');
assert(ui.el('modal').innerHTML.includes('Start Hard — same seed'));ui.click('closemodal');assert.equal(JSON.stringify(ui.a.G),before);
ui.change('easy');ui.click('difficulty-start',{level:'easy'});assert.equal(ui.ctx.location.search,'?seed=17&difficulty=easy');assert.equal(ui.a.G.difficulty,'normal');
const restarted=load(ui.ctx.location.search);assert.equal(restarted.a.G.difficulty,'easy');
const opening=JSON.stringify(restarted.a.G);restarted.click('restartgame');assert.equal(JSON.stringify(restarted.a.G),opening);
restarted.click('newgame');assert(new URLSearchParams(restarted.ctx.location.search).get('difficulty')==='easy');assert(new URLSearchParams(restarted.ctx.location.search).has('seed'));
const untouched=restarted.ctx.location.search;restarted.click('difficulty-start',{level:'__proto__'});assert.equal(restarted.ctx.location.search,untouched);
const h=load('?seed=17&difficulty=hard');h.a.showHelp();assert(h.el('modal').innerHTML.includes('Difficulty — Hard'));assert(h.el('modal').innerHTML.includes('Phase II adds 1/0'));
h.a.G.over={win:false};assert(h.a.postMortemHtml().includes('Difficulty Hard'));
console.log('PASS: three injury-only presets, authored/non-injury preservation, suffocation/Re-entry, default/invalid URL, same-seed restarts, fitness independence, confirmation/cancel and level-preserving navigation');
