const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const start=source.indexOf('function interviewAftermath(id){');
const end=source.indexOf('function showInterview(id){',start);
assert.ok(start>=0&&end>start,'Aftermath function exists');
function aftermath(state,id){
 const context={state};vm.createContext(context);
 vm.runInContext(source.slice(start,end)+';this.result=interviewAftermath('+JSON.stringify(id)+');',context);
 return context.result;
}
test('prior public accusation is remembered by Leo in later case',()=>{
 const text=aftermath({chapter:1,choices:[{chapter:0,action:'expose'}]},'302');
 assert.match(text,/Лев/);
 assert.match(text,/без контекста/);
});
test('protecting neighbors does not trigger accusation dialogue',()=>{
 assert.equal(aftermath({chapter:1,choices:[{chapter:0,action:'protect'}]},'302'),'');
});
test('current case accusation does not leak into its own interview',()=>{
 assert.equal(aftermath({chapter:1,choices:[{chapter:1,action:'expose'}]},'302'),'');
});
test('legacy v4 saves without choices still load dialogue',()=>{
 assert.equal(aftermath({chapter:2},'302'),'');
});
test('Kira and Tamara remember previous public accusations',()=>{
 const state={chapter:2,choices:[{chapter:0,action:'expose'}]};
 assert.match(aftermath(state,'301'),/Кира/);
 assert.match(aftermath(state,'101'),/Тамара/);
});
