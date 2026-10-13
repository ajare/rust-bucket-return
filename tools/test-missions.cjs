// Mission selection, all seven one-shot powers, choice dialogs and redraw invariants.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/newGame\(\);render\(\);\s*$/,'');
const elements=new Map();let click;
const element=id=>{if(!elements.has(id)){const classes=new Set();elements.set(id,{innerHTML:'',textContent:'',disabled:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}})}return elements.get(id)};
const ctx={URLSearchParams,location:{search:'?seed=17'},document:{getElementById:element,addEventListener(type,fn){if(type==='click')click=fn}}};
vm.createContext(ctx);vm.runInContext(source+`
const renderUI=render;render=()=>{};
globalThis.a={get G(){return G},newGame(seed=17){SEED=seed;newGame()},MISSION_SPECIALISTS,COMP_TYPES,
 crew,sys,useMission,missionReason,crewClick,drawFive,beginCrisis,renderUI,closeModal,injureCrew,consume,
 fabricate,cannibalise,setMode,patch,cardClick,reqClick,resolveCrisis,routeDirect};`,ctx);
const a=ctx.a,seeds=new Map();assert.equal(a.MISSION_SPECIALISTS.length,7);
for(let seed=0;seed<512;seed++){
 a.newGame(seed);const mission=a.crew('spec');if(!seeds.has(mission.mission))seeds.set(mission.mission,seed);
 assert.equal(a.G.crew.length,6);assert.equal(a.G.crew.filter(c=>c.mission).length,1);
 assert.equal(a.G.crew.filter(c=>c.cap).length,2);assert.equal(a.G.flags.specUsed,false);
}
assert.equal(seeds.size,7);assert(a.MISSION_SPECIALISTS.every(c=>c.state===undefined&&c.used===undefined));
const ready=kind=>{a.newGame(seeds.get(kind));return a.crew('spec')};
const dispatch=(act,extra={})=>click({target:{closest:()=>({dataset:{act,...extra}})}});
// Chen's permanent exact forecasts are separate from generic mission usage.
ready('chen');const next=a.G.deck[0];assert(a.useMission());assert.equal(a.G.flags.exactForecast,true);
a.renderUI();assert(element('forecast').textContent.includes(next.title));
a.G.flags.forecastHidden=2;a.renderUI();assert(element('forecast').textContent.includes('SENSORS BLIND'));
a.drawFive();assert.equal(a.crew('spec').used,false);assert.equal(a.useMission(),false);assert.equal(a.G.flags.exactForecast,true);
// Rahman grants exactly two of ONE chosen type; invalid/cancelled choices cost nothing.
for(const type of a.COMP_TYPES){
 ready('rahman');const before={...a.G.components};assert.equal(a.useMission('unknown'),false);
 assert.equal(a.G.flags.specUsed,false);assert(a.useMission(type));
 for(const t of a.COMP_TYPES)assert.equal(a.G.components[t],before[t]+(t===type?2:0));
 assert.equal(a.G.flags.exactForecast,false);a.renderUI();assert(element('forecast').textContent.includes('category'));
}
ready('rahman');a.crewClick('spec');assert(element('modalOverlay').classList.contains('show'));
assert.equal(a.G.flags.specUsed,false);dispatch('closemodal');assert.equal(a.G.flags.specUsed,false);
a.crewClick('spec');dispatch('mission-effect',{choice:'Electronics'});assert.equal(a.G.components.Electronics,4);
assert.equal(a.G.flags.specUsed,true);assert(!element('modalOverlay').classList.contains('show'));
// Ortega stacks protection, which absorbs individual crisis and suffocation hits.
ready('ortega');a.G.flags.shelter=1;assert(a.useMission());assert.equal(a.G.flags.shelter,3);
a.injureCrew(2,'crisis test');assert.equal(a.G.flags.shelter,1);assert(a.G.crew.every(c=>c.state==='ok'));
a.G.oxygen=0;a.consume();assert.equal(a.G.flags.shelter,0);assert(a.G.crew.every(c=>c.state==='ok'));
a.injureCrew(1,'after protection');assert.equal(a.G.crew.filter(c=>c.state==='injured').length,1);
// Nasser reveals only the queued next card, including while sensors are blind.
ready('nasser');a.G.course=2;a.G.flags.forecastHidden=4;const revealed=a.G.deck[0];
assert(a.useMission());assert.equal(a.G.course,1);assert.equal(a.G.flags.exactForecast,false);
assert.equal(a.G.flags.revealedNext,revealed.id);a.renderUI();assert(element('forecast').textContent.includes(revealed.title));
a.beginCrisis(false);assert.equal(a.G.crisis.id,revealed.id);assert.equal(a.G.flags.revealedNext,null);
a.renderUI();assert(element('forecast').textContent.includes('SENSORS BLIND'));
ready('nasser');a.G.course=0;assert(a.useMission());assert.equal(a.G.course,0);
ready('nasser');a.G.deck=[];a.G.course=0;assert.equal(a.useMission(),false);
a.G.course=1;assert(a.useMission());assert.equal(a.G.course,0);assert.equal(a.G.flags.revealedNext,null);
// Sensor blinding hides exactly the next N forecasts; it must not tick before the hidden
// crisis is even shown, nor on route burns (which show no forecast).
const blind=n=>({id:'blind-'+n,cat:'ELECTRICAL',title:'BLIND '+n,flavor:'',req:{POW:99},fail:{forecastHidden:n},win:{}});
const benign={id:'benign',cat:'ELECTRICAL',title:'BENIGN',flavor:'',req:{POW:99},fail:{},win:{}};
for(const n of [1,2]){
 a.newGame();a.G.crisis=blind(n);a.G.drawn=[];a.resolveCrisis();
 assert.equal(a.G.flags.forecastHidden,n,'A fresh penalty must survive into the crisis it blinds');
 a.renderUI();assert(element('forecast').textContent.includes('SENSORS BLIND'),'forecastHidden '+n+' hides the next forecast');
 for(let i=1;i<n;i++){
  a.G.crisis=benign;a.G.drawn=[];a.resolveCrisis();a.renderUI();
  assert(element('forecast').textContent.includes('SENSORS BLIND'),'forecastHidden '+n+' still hides forecast '+i);
 }
 a.G.crisis=benign;a.G.drawn=[];a.resolveCrisis();a.renderUI();
 assert(!element('forecast').textContent.includes('SENSORS BLIND'),'forecastHidden '+n+' expires after '+n+' hidden forecasts');
}
a.newGame();a.G.deck=[];a.G.flags.forecastHidden=1;a.beginCrisis(true);assert.equal(a.G.step,'route');
a.routeDirect();a.G.drawn=[];a.G.crewBonus={THR:99};a.resolveCrisis();
assert.equal(a.G.flags.forecastHidden,1,'Route burns show no forecast and must not tick sensor blinding');
a.renderUI();assert(element('forecast').textContent.includes('SENSORS BLIND'),'The penalty survives the burn to blind the first Phase-II forecast');
// A trajectory decision is a blocking state: covering it with Help and closing must
// restore the route choice, and choosing a route must dismiss the modal outright.
a.newGame();a.G.deck=[];a.beginCrisis(true);assert.equal(a.G.step,'route');
a.renderUI();assert(element('modal').innerHTML.includes('SAFE PROFILE'),'The route modal is up');
dispatch('help');assert(element('modal').innerHTML.includes('HOW TO PLAY'),'Help replaces the route modal');
dispatch('closemodal');
assert(element('modalOverlay').classList.contains('show'),'Closing Help must restore the route modal');
assert(element('modal').innerHTML.includes('SAFE PROFILE'),'The restored modal is the route choice');
dispatch('route-safe');
assert(!element('modalOverlay').classList.contains('show'),'Choosing a route dismisses the modal');
assert.equal(a.G.step,'respond');
// Voss chooses one penalty, even if keys/text repeat, and Oxygen is clamped to six.
ready('voss');a.G.ongoing=[{key:'co2',text:'First CO2',oxygen:-1,turns:2},{key:'co2',text:'Second CO2',oxygen:-1,turns:3}];
a.G.oxygen=4;assert.equal(a.useMission('9'),false);assert.equal(a.G.flags.specUsed,false);
a.crewClick('spec');assert(element('modal').innerHTML.includes('Second CO2'));
dispatch('mission-effect',{choice:'1'});assert.equal(a.G.ongoing.length,1);assert.equal(a.G.ongoing[0].text,'First CO2');assert.equal(a.G.oxygen,5);
ready('voss');assert.equal(a.useMission(),false);a.G.oxygen=5;assert(a.useMission());assert.equal(a.G.oxygen,6);
ready('voss');a.G.ongoing=[{text:'Penalty',oxygen:-2,turns:3}];a.G.oxygen=6;assert(a.useMission('0'));assert.equal(a.G.oxygen,6);
// Adeyemi heals at most two, can restore Doctor, and never resurrects dead crew.
ready('adeyemi');assert.equal(a.useMission(),false);a.crew('cmdr').state='injured';a.crew('doc').state='injured';a.G.crew[4].state='dead';
assert(a.useMission());assert.equal(a.crew('cmdr').state,'ok');assert.equal(a.crew('doc').state,'ok');assert.equal(a.G.crew[4].state,'dead');
ready('adeyemi');a.crew('cmdr').state='injured';a.crew('syseng').state='injured';a.crew('doc').state='injured';assert(a.useMission());
assert.equal(a.G.crew.filter(c=>c.state==='injured').length,1);assert.equal(a.crew('doc').state,'injured','Roster order determines healing');
// Kim keeps up to two exact instance IDs and redraws without resetting prior crew/maintenance actions.
ready('kim');a.G.drawn=['reactor','thermal','sensors','comms','batteries'];
a.crewClick('doc');a.crewClick('cmdr');a.reqClick('POW');a.sys('thermal').state='damaged';a.patch('thermal');
a.crewClick('syseng');a.cardClick('thermal');a.G.crew[4].state='injured';
const bonus={...a.G.crewBonus},used=Array.from(a.G.crew,c=>c.used),health=Array.from(a.G.crew,c=>c.state),parts={...a.G.components},old=Array.from(a.G.drawn);
assert.equal(a.useMission(['reactor','thermal','sensors']),false);assert.equal(a.useMission(['reactor','reactor']),false);
assert.equal(a.useMission(['cargo','thermal']),false);assert.equal(a.G.flags.specUsed,false);
assert(a.useMission(['reactor','thermal']));assert.equal(a.G.drawn.length,5);assert.equal(new Set(a.G.drawn).size,5);
assert(a.G.drawn.includes('reactor'));assert(a.G.drawn.includes('thermal'));
for(const id of a.G.drawn)if(!['reactor','thermal'].includes(id))assert(!old.includes(id));
assert.deepEqual({...a.G.crewBonus},bonus);assert.deepEqual({...a.G.components},parts);
assert.deepEqual(Array.from(a.G.crew,c=>c.state),health);
assert.deepEqual(Array.from(a.G.crew,c=>c.used),used.map((u,i)=>i===3?true:u));
assert.equal(a.sys('thermal').patched,true);assert.equal(a.sys('thermal').seBoost,true);
a.drawFive();assert.equal(a.sys('thermal').patched,false,'Maintenance bonuses cannot leak into the next crisis');
// Small pools reuse discarded survivors only as needed; destroyed systems never return.
ready('kim');const survivors=['reactor','thermal','sensors','comms','batteries','lifesupport'];
for(const s of a.G.systems)if(!survivors.includes(s.id))s.state='destroyed';a.G.drawn=survivors.slice(0,5);
assert(a.useMission(['reactor','thermal']));assert.equal(a.G.drawn.length,5);assert.equal(new Set(a.G.drawn).size,5);
assert(a.G.drawn.includes('lifesupport'));assert(a.G.drawn.every(id=>survivors.includes(id)));
// Fabrication cannot be followed by Kim to draw a newborn builder and chain extra builds.
ready('kim');a.G.drawn=['fabricator'];a.G.components.Wiring=8;const created=a.fabricate('fabricator','fabricator');assert(created);
a.cannibalise('fabricator');assert.equal(a.useMission([]),false);assert.equal(a.G.flags.specUsed,false);
ready('kim');a.G.drawn=['reactor'];a.setMode('reactor','n');assert.equal(a.useMission([]),false);
// Choice UI toggles keep limits, permits cancellation, and confirms without accidental spending.
ready('kim');a.crewClick('spec');const hand=Array.from(a.G.drawn);
dispatch('mission-keep',{id:hand[0]});dispatch('mission-keep',{id:hand[1]});dispatch('mission-keep',{id:hand[2]});
assert.equal(a.G.missionKeep.length,2);dispatch('mission-keep',{id:hand[0]});assert.equal(a.G.missionKeep.length,1);
dispatch('closemodal');assert.equal(a.G.missionKeep.length,0);assert.equal(a.G.flags.specUsed,false);
a.crewClick('spec');dispatch('mission-redraw');assert.equal(a.G.flags.specUsed,true);
// Every character obeys health/phase/one-shot guards; drawing another crisis never refreshes the power.
const args={chen:undefined,rahman:'Wiring',ortega:undefined,nasser:undefined,kim:[],voss:'0',adeyemi:undefined};
function prepare(kind){const c=ready(kind);if(kind==='voss')a.G.ongoing=[{text:'Test penalty',oxygen:-1,turns:2}];if(kind==='adeyemi')a.crew('doc').state='injured';return c;}
for(const kind of seeds.keys()){
 for(const state of ['injured','dead']){const c=prepare(kind);c.state=state;assert.equal(a.useMission(args[kind]),false);assert.equal(a.G.flags.specUsed,false);}
 prepare(kind);a.G.step='route';assert.equal(a.useMission(args[kind]),false);
 prepare(kind);a.G.over={win:false};assert.equal(a.useMission(args[kind]),false);
 const c=prepare(kind);assert(a.useMission(args[kind]),kind);a.drawFive();assert.equal(c.used,false);
 assert.equal(a.useMission(args[kind]),false);assert.equal(a.G.flags.specUsed,true);
 a.renderUI();assert(element('crew').innerHTML.includes(c.field));assert(element('crew').innerHTML.includes('Spent'));
}
// Seeded restart reproduces mission character, system specialists, pools and opening state.
a.newGame(12345);const opening=JSON.stringify(a.G);a.crew('spec').state='dead';a.drawFive();dispatch('restartgame');assert.equal(JSON.stringify(a.G),opening);
console.log('PASS: seven seeded Missions, once-only/health guards, resource/forecast/healing/protection effects, choice UI, safe redraws and restart');
