// Executable regression checks for the real verdict handler.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
function section(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Expected source section: '+start);
 return source.slice(a,b);
}
const implementation=section('function verdictFallout(','function showEnding()');
function runVerdict(guess,chapter=1){
 const state={chapter,closed:false,pendingEvent:null,ending:null,clues:['notebox','brasskey','framegrab'],trust:{'102':2},tension:20,kindness:1,score:0,history:[],choices:[]};
 const cases=[{correct:'relay'},{correct:'caretaker'}];
 const residents=[{id:'102',name:'Олег'},{id:'301',name:'Кира'}];
 const logs=[];
 const context={state,residents,current:()=>cases[chapter],keyEvidence:[[],['brasskey']],clamp:(v,min=0,max=100)=>Math.max(min,Math.min(max,v)),solvedConnections:()=>[],addLog:(msg)=>logs.push(msg),render:()=>{}};
 vm.createContext(context);
 vm.runInContext(implementation+';this.finishVerdict=finish;',context);
 context.finishVerdict(guess,'brasskey');
 return {state,logs};
}
test('false accusation of the courier damages his trust and records a durable consequence',()=>{
 const {state,logs}=runVerdict('theft');
 assert.equal(state.trust['102'],1);
 assert.equal(state.tension,28);
 assert.equal(state.history[0].accusedResident,'102');
 assert.match(logs.join(' '),/Олег/);
});
test('correct verdict does not penalize residents',()=>{
 const {state}=runVerdict('caretaker');
 assert.equal(state.trust['102'],2);
 assert.equal(state.tension,20);
 assert.equal(state.history[0].accusedResident,null);
});
test('unfounded supernatural guess does not accuse an arbitrary neighbour',()=>{
 const src=section('function verdictFallout(','function finish(');
 const ctx={};vm.createContext(ctx);vm.runInContext(src+';this.fallout=verdictFallout;',ctx);
 assert.equal(ctx.fallout(2,'ghost'),null);
 assert.equal(ctx.fallout(4,'portal'),null);
});
test('v4 save identifier and original Leo/presence regression suite remain present',()=>{
 assert.match(source,/const STORE='dom13-nightshift-v4'/);
 assert.match(fs.readFileSync(path.join(__dirname,'dialogue.test.cjs'),'utf8'),/Leo speaks his own case-specific line/);
 assert.match(fs.readFileSync(path.join(__dirname,'dialogue.test.cjs'),'utf8'),/absent residents cannot be interviewed or helped/);
});
