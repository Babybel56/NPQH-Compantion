import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,wordCount,safeURL,icsEvents,stats,DOMAINS} from '../app/core.js';
import {Store,importBackup,exportBackup} from '../app/store.js';

test('a new workspace has no invented dates, submitted work, evidence or hours',()=>{
 const d=seed();assert.equal(d.settings.start,'');assert.equal(d.settings.assessmentDue,'');assert.equal(d.settings.wordLimit,'');assert.equal(d.evidence.length,0);assert.equal(stats(d).done,0);assert.equal(stats(d).hours,0);assert.equal(DOMAINS.length,10);assert.equal(validate(d),d);
});
test('backups reject unsupported data and duplicate task IDs',()=>{
 assert.throws(()=>validate({schema:2}));const d=seed();d.tasks.push({...d.tasks[0]});assert.throws(()=>validate(d),/duplicate/);
 const e=seed();delete e.assessment.response;assert.throws(()=>validate(e),/assessment/);
});
test('external links only use http or https',()=>{
 for(const s of ['javascript:alert(1)','data:text/html,hello','file:///C:/file','not a link'])assert.equal(safeURL(s),'');
 assert.equal(safeURL('https://www.gov.uk/test'),'https://www.gov.uk/test');
});
test('word counting handles whitespace and empty drafts',()=>{
 assert.equal(wordCount('  '),0);assert.equal(wordCount('one\n two\tthree'),3);assert.equal(wordCount('school-wide leadership'),2);
});
test('calendar keeps dates all-day, excludes finished/undated work, escapes and folds UTF-8',()=>{
 const events=icsEvents([{id:'a',title:'中文'.repeat(100)+', school; work',due:'2026-11-09',notes:'a\nb',done:false},{id:'b',title:'Skip done',due:'2026-11-10',done:true},{id:'c',title:'Skip no date',due:'',done:false}]);
 assert.match(events,/DTSTART;VALUE=DATE:20261109/);assert.match(events,/\\, school\\; work/);assert.match(events,/DESCRIPTION:a\\nb/);assert.doesNotMatch(events,/Skip/);
 for(const line of events.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
 assert.equal((events.match(/BEGIN:VEVENT/g)||[]).length,1);
});
test('learning time totals only explicitly logged minutes',()=>{
 const d=seed();d.sessions=[{minutes:45},{minutes:30}];assert.equal(stats(d).hours,1.3);
});
function storage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('a second tab cannot silently overwrite the first tab’s saved work',async()=>{
 globalThis.localStorage=storage();const a=new Store(),b=new Store();await a.init();await b.init();const next=structuredClone(a.data);next.settings.name='First tab';await a.save(next);
 const other=structuredClone(b.data);other.settings.name='Second tab';await assert.rejects(b.save(other),/another tab/);assert.equal(new Store().local().settings.name,'First tab');
});
test('a storage failure preserves the previous in-memory workspace',async()=>{
 globalThis.localStorage=storage();const a=new Store();await a.init();const next=structuredClone(a.data);next.settings.name='Changed';localStorage.setItem=()=>{throw Error('Storage full');};
 await assert.rejects(a.save(next),/Storage full/);assert.equal(a.data.settings.name,'William');
});
function cloudClient(result,calls){const q={update(value){calls.value=value;return q;},eq(k,v){calls[k]=v;return q;},select(){return q;},maybeSingle:async()=>result};return {from(name){calls.table=name;return q;}};}
test('cloud saves require the account ID AND the loaded revision',async()=>{
 const calls={},a=new Store();a.mode='cloud';a.user={id:'owner-a'};a.revision=7;a.data=seed();a.client=cloudClient({data:{revision:8},error:null},calls);
 const next=structuredClone(a.data);next.settings.school='School';await a.save(next);assert.equal(calls.user_id,'owner-a');assert.equal(calls.revision,7);assert.equal(calls.value.revision,8);assert.equal(a.revision,8);assert.equal(a.data.settings.school,'School');
});
test('conflicting cloud edits do not replace memory or advance the revision',async()=>{
 const a=new Store();a.mode='cloud';a.user={id:'owner'};a.revision=3;a.data=seed();a.client=cloudClient({data:null,error:null},{});const next=structuredClone(a.data);next.settings.name='Changed';
 await assert.rejects(a.save(next),/another device/);assert.equal(a.revision,3);assert.equal(a.data.settings.name,'William');
});
test('cloud attachment access rejects a different account’s path',async()=>{
 const a=new Store();a.mode='cloud';a.user={id:'owner-a'};await assert.rejects(a.download({location:'cloud',path:'owner-b/document'}),/original account/);
});
test('imports reject missing attachment data before changing any records',async()=>{
 const a=new Store();a.data=seed();const data=seed();data.evidence=[{id:'e',title:'Evidence',attachment:{id:'missing'}}];let saved=false;a.save=async()=>saved=true;
 await assert.rejects(importBackup(a,{format:'npqh-backup-v1',data,files:[]}),/missing attachments/);assert.equal(saved,false);
});
test('an import save failure cleans up newly uploaded files',async()=>{
 const a=new Store(),data=seed();data.evidence=[{id:'e',title:'Evidence',attachment:{id:'original'}}];const deleted=[];a.upload=async()=>({id:'uploaded'});a.removeFile=async a=>deleted.push(a.id);a.save=async()=>{throw Error('Conflict');};
 await assert.rejects(importBackup(a,{format:'npqh-backup-v1',data,files:[{id:'original',name:'e.txt',type:'text/plain',data:btoa('hello')}]}),/Conflict/);assert.deepEqual(deleted,['uploaded']);
});
test('a full backup round trip preserves attachment bytes and remaps to new storage',async()=>{
 globalThis.FileReader=class {readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:application/octet-stream;base64,'+Buffer.from(b).toString('base64');this.onload();}).catch(e=>{this.error=e;this.onerror();});}};
 const source=new Store();source.data=seed();source.data.evidence=[{id:'e',title:'A real attachment',attachment:{id:'original',name:'test.txt',type:'text/plain',location:'local'}}];source.download=async()=>new Blob(['Hello, 中文!']);
 const backup=await exportBackup(source);assert.equal(backup.files.length,1);assert.equal(Buffer.from(backup.files[0].data,'base64').toString(),'Hello, 中文!');
 const target=new Store();let contents;target.upload=async file=>{contents=await file.text();return {id:'new',location:'cloud',path:'new-owner/new/test.txt',name:file.name};};target.save=async next=>target.data=next;
 await importBackup(target,backup);assert.equal(contents,'Hello, 中文!');assert.equal(target.data.evidence[0].attachment.id,'new');assert.equal(target.data.evidence[0].attachment.path,'new-owner/new/test.txt');assert.equal(source.data.evidence[0].attachment.id,'original');
});
