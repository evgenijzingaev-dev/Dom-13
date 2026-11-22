const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const begin=source.indexOf('function accusationMemory(id){');
const end=source.indexOf('function interviewAftermath(id){',begin);
assert.ok(begin>=0&&end>begin,'accusation memory must be part of the game');
const implementation=source.slice(begin,end);
function memory(history,chapter,id){
 const context={state:{history,chapter}};
 vm.createContext(context);
 vm.runInContext(implementation+';this.readMemory=accusationMemory;',context);
 return context.readMemory(id);
}
test('wrongly accused Oleg remembers the public accusation in a later case',()=>{
 const line=memory([{chapter:1,accusedResident:'102',win:false}],2,'102');
 assert.match(line,/доставк/);
 assert.match(line,/обвинен/);
});
test('Leo remembers a false spying allegation, not another resident\'s accusation',()=>{
 const history=[{chapter:2,accusedResident:'302',win:false}];
 assert.match(memory(history,3,'302'),/эфир/);
 assert.equal(memory(history,3,'301'),'');
});
test('past accusation does not appear in the same chapter',()=>{
 assert.equal(memory([{chapter:1,accusedResident:'102'}],1,'102'),'');
});
test('older v4 histories without accusedResident are compatible',()=>{
 assert.equal(memory([{chapter:0,win:false},{chapter:1,win:true}],3,'102'),'');
 assert.equal(memory(undefined,3,'102'),'');
});
test('the newest accusation of a resident is used and the scene surfaces it',()=>{
 const history=[{chapter:0,accusedResident:'102'},{chapter:2,accusedResident:'302'}];
 assert.match(memory(history,3,'302'),/эфир/);
 assert.match(source,/const aftermath=accusationMemory\(id\)\|\|interviewAftermath\(id\)/);
 assert.match(source,/accusationMemory\(id\)\?'Обсудить прошлое обвинение/);
});
test('original Leo and absent-resident executable regressions remain in suite',()=>{
 const dialogue=fs.readFileSync(path.join(__dirname,'dialogue.test.cjs'),'utf8');
 assert.match(dialogue,/Leo speaks his own case-specific line/);
 assert.match(dialogue,/absent residents cannot be interviewed or helped/);
 assert.match(source,/const STORE='dom13-nightshift-v4'/);
});
