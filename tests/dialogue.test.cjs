// Run with: node --test tests/dialogue.test.cjs
// Focused regression checks execute the actual dialogue template and presence guard.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8');
function extract(start,end){
 const a=source.indexOf(start);
 assert.ok(a>=0,'Expected code fragment exists: '+start);
 const b=source.indexOf(end,a+start.length);
 assert.ok(b>a,'Expected fragment terminator exists');
 return source.slice(a,b);
}
test('Leo speaks his own case-specific line when a clue is found',()=>{
 const statement=extract('  result=`\u0024{!here&&corridorClue(p,type)?',";\n  icon='🔎';")+';';
 const context={here:true,corridorClue:()=>false,p:{id:'302'},type:'knock',id:'302',state:{chapter:0},
 interviews:{'302':['Лев снимает наушники и предлагает послушать запись']},
 match:{title:'Гул за стеной'},evidenceText:'На записи слышен гул'};
 vm.createContext(context);
 vm.runInContext(statement,context);
 assert.match(context.result,/Лев снимает наушники/);
 assert.match(context.result,/Гул за стеной/);
 assert.doesNotMatch(context.result,/Кира|Люси/);
});
test('absent residents cannot be interviewed or helped',()=>{
 const guard=extract("const here=home(p);if((type==='knock'||type==='help')&&!here)return;","const key=");
 for(const type of ['knock','help']){
  const context={home:()=>false,p:{id:'302'},type};
  vm.createContext(context);
  const outcome=vm.runInContext('(function(){'+guard+'return "action-allowed"})()',context);
  assert.equal(outcome,undefined);
 }
});
test('v4 save key remains unchanged',()=>{
 assert.match(source,/const STORE='dom13-nightshift-v4'/);
});

test('night-two schedule blocks Leo at 19:00 but permits interview at 20:00',()=>{
 const fragment=extract('const home=p=>{','// Clues left in the shared corridor');
 const context={state:{day:2,hour:19}};
 vm.createContext(context);
 vm.runInContext(fragment+';this.checkHome=home;',context);
 const leo={id:'302',home:h=>h>=19};
 assert.equal(context.checkHome(leo),false);
 context.state.hour=20;
 assert.equal(context.checkHome(leo),true);
 context.state.day=1;context.state.hour=19;
 assert.equal(context.checkHome(leo),true);
});
test('Oleg remains absent at 22:00 on night two and returns at 23:00',()=>{
 const fragment=extract('const home=p=>{','// Clues left in the shared corridor');
 const context={state:{day:2,hour:22}};
 vm.createContext(context);
 vm.runInContext(fragment+';this.checkHome=home;',context);
 const oleg={id:'102',home:h=>h>=22};
 assert.equal(context.checkHome(oleg),false);
 context.state.hour=23;
 assert.equal(context.checkHome(oleg),true);
});
test('dialogue and help use the same presence guard as the schedule',()=>{
 const fragment=extract('const home=p=>{','// Clues left in the shared corridor');
 const guard=extract("const here=home(p);if((type==='knock'||type==='help')&&!here)return;","const key=");
 for(const type of ['knock','help']){
  const context={state:{day:2,hour:19},p:{id:'302',home:h=>h>=19},type};
  vm.createContext(context);
  vm.runInContext(fragment,context);
  const outcome=vm.runInContext('(function(){'+guard+'return "allowed"})()',context);
  assert.equal(outcome,undefined);
 }
});
