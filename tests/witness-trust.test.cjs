const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8');
function fragment(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'Missing actual game logic: '+a);
 return source.slice(start,end);
}
const helper=fragment('function witnessNeedsReassurance(id){','function showInterview(id){');
function needs(state,id){
 const context={state};vm.createContext(context);
 vm.runInContext(helper+';this.value=witnessNeedsReassurance('+JSON.stringify(id)+');',context);
 return context.value;
}
test('public accusation in previous case delays Leo and Kira recordings',()=>{
 const state={chapter:1,choices:[{chapter:0,action:'expose'}],interviewHistory:[]};
 assert.equal(needs(state,'302'),true);
 assert.equal(needs(state,'301'),true);
 assert.equal(needs(state,'101'),false);
});
test('a gentle conversation in this case restores access without new save fields',()=>{
 const state={chapter:1,choices:[{chapter:0,action:'expose'}],interviewHistory:[{chapter:1,resident:'302',approach:'gentle'}]};
 assert.equal(needs(state,'302'),false);
 assert.equal(needs(state,'301'),true);
});
test('confrontation, older gentle talks and current-case publicity do not bypass trust',()=>{
 const state={chapter:2,choices:[{chapter:0,action:'expose'}],interviewHistory:[{chapter:1,resident:'302',approach:'gentle'},{chapter:2,resident:'302',approach:'direct'}]};
 assert.equal(needs(state,'302'),true);
 assert.equal(needs({chapter:2,choices:[{chapter:2,action:'expose'}],interviewHistory:[]},'302'),false);
});
test('legacy v4 saves without new fields remain valid',()=>{
 assert.equal(needs({chapter:2},'302'),false);
 assert.equal(needs({chapter:2,choices:[null,{chapter:0,action:'expose'}]},'302'),true);
 assert.match(source,/const STORE='dom13-nightshift-v4'/);
});
test('actual clue assignment requires accessible witness and resolved distrust',()=>{
 const expression=fragment('const match=isClueAccessible(p,type)&&!refused&&!needsReassurance?',";\n if(type==='knock'&&!refused)");
 for(const [guard,expected] of [[true,null],[false,'hum13']]){
  const context={id:'302',p:{id:'302'},type:'listen',refused:false,needsReassurance:guard,state:{clues:[]},isClueAccessible:()=>true,getClues:()=>[{id:'hum13',resident:'302',action:'listen'}]};
  vm.createContext(context);vm.runInContext(expression+';this.clue=match;',context);
  assert.equal(context.clue?.id??null,expected);
 }
});
