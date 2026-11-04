import { seed, validate, uid } from './core.js';
import { CLOUD_CONFIG } from './config.js';
const KEY='npqh-companion-v1',CONFIG='npqh-connection-v1';
let dbPromise;
function filesDB(){return dbPromise ||= new Promise((resolve,reject)=>{const r=indexedDB.open('npqh-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function localFile(mode,id,value){const db=await filesDB();return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode),s=tx.objectStore('files');const r=value===undefined?(mode==='readwrite'?s.delete(id):s.get(id)):s.put(value,id);let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('File storage was interrupted.'));});}
async function sdk(){
 if(window.supabase)return window.supabase;
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('./vendor/supabase-2.118.0.js',import.meta.url).href;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Could not load Supabase. Reload the app and try again.'));};document.head.append(s);});
 if(!window.supabase)throw Error('Supabase did not load.');return window.supabase;
}
export class Store {
 client=null;user=null;revision=0;mode='local';data=null;
 constructor(defaultConfig=CLOUD_CONFIG){this.defaultConfig=defaultConfig;}
 connectionConfig(){return JSON.parse(localStorage.getItem(CONFIG)||'null')||this.defaultConfig;}
 local(){const raw=localStorage.getItem(KEY);this.localRaw=raw;return raw?validate(JSON.parse(raw)):seed();}
 async init(){
  this.data=this.local();
  const config=this.connectionConfig();
  if(config){await this.connect(config.url,config.key);const {data,error}=await this.client.auth.getSession();if(error)throw error;if(data.session)await this.cloud(data.session.user);}
  return this.data;
 }
 async connect(url,key){
  const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash||!['','/'].includes(parsed.pathname))throw Error('Enter your HTTPS Supabase project URL, without a path.');
  let publicKey=key.startsWith('sb_publishable_');
  if(!publicKey){try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));publicKey=payload.role==='anon';}catch{}}
  if(!publicKey)throw Error('Use a publishable key or legacy anon key. Secret and service-role keys must never be used here.');
  const api=await sdk();
  if(this.client)await this.client.auth.signOut({scope:'local'});
  this.client=api.createClient(parsed.origin,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:`npqh-auth-${parsed.hostname}`}});
  localStorage.setItem(CONFIG,JSON.stringify({url:parsed.origin,key}));
  this.client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&this.mode==='cloud')window.dispatchEvent(new Event('npqh-auth-lost'));});
 }
 async login(email,password){if(!this.client)throw Error('Connect your Supabase project first.');const {data,error}=await this.client.auth.signInWithPassword({email,password});if(error)throw error;await this.cloud(data.user);}
 async cloud(user){
  const {data,error}=await this.client.from('npqh_workspaces').select('data,revision').eq('user_id',user.id).maybeSingle();if(error)throw error;
  let record=data;
  if(!record){const created=await this.client.from('npqh_workspaces').insert({user_id:user.id,data:seed(),revision:1}).select('data,revision').single();if(created.error)throw created.error;record=created.data;}
  const checked=validate(record.data);this.user=user;this.revision=Number(record.revision);this.mode='cloud';this.data=checked;
 }
 async save(next){
  validate(next);
  if(this.mode==='local'){
   if(localStorage.getItem(KEY)!==this.localRaw)throw Error('Your browser workspace changed in another tab. Keep a copy of your text, then reload before saving.');
   const raw=JSON.stringify(next);localStorage.setItem(KEY,raw);this.localRaw=raw;
  }
  else {
   const {data,error}=await this.client.from('npqh_workspaces').update({data:next,revision:this.revision+1,updated_at:new Date().toISOString()}).eq('user_id',this.user.id).eq('revision',this.revision).select('revision').maybeSingle();
   if(error)throw error;if(!data)throw Error('This workspace changed on another device. Keep a copy of your text, then reload before saving.');this.revision=Number(data.revision);
  }
  this.data=next;
 }
 async logout(){if(this.client){const {error}=await this.client.auth.signOut({scope:'local'});if(error)throw error;}this.user=null;this.mode='local';this.data=this.local();}
 async upload(file){
  if(file.size>25*1024*1024)throw Error('Choose a file smaller than 25 MB.');
  const id=uid(),attachment={id,name:file.name,type:file.type||'application/octet-stream',size:file.size,location:this.mode};
  if(this.mode==='local')await localFile('readwrite',id,file);
  else {attachment.path=`${this.user.id}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error}=await this.client.storage.from('npqh-evidence').upload(attachment.path,file,{contentType:attachment.type,upsert:false});if(error)throw error;}
  return attachment;
 }
 async download(a){
  if(a.location==='local'){const file=await localFile('readonly',a.id);if(!file)throw Error('The attached file is missing from this browser. Restore a full backup.');return file;}
  if(this.mode!=='cloud'||!a.path?.startsWith(this.user.id+'/'))throw Error('Sign in to the original account to open this attachment.');
  const {data,error}=await this.client.storage.from('npqh-evidence').download(a.path);if(error)throw error;return data;
 }
 async removeFile(a){
  if(a.location==='local')return localFile('readwrite',a.id);
  const {error}=await this.client.storage.from('npqh-evidence').remove([a.path]);if(error)throw error;
 }
}
export async function exportBackup(store){
 const result={format:'npqh-backup-v1',exportedAt:new Date().toISOString(),data:structuredClone(store.data),files:[]};
 let size=0;
 for(const e of store.data.evidence.filter(e=>e.attachment)){
  const a=e.attachment,b=await store.download(a);size+=b.size;if(size>100*1024*1024)throw Error('This backup exceeds 100 MB. Download attachments separately before using a records-only export.');
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(r.error);r.readAsDataURL(b);});
  result.files.push({id:a.id,name:a.name,type:a.type,data});
 }
 return result;
}
export async function importBackup(store,backup){
 if(backup?.format!=='npqh-backup-v1'||!Array.isArray(backup.files))throw Error('Choose a full NPQH backup JSON file.');
 const next=validate(structuredClone(backup.data));let size=0;
 // Decode and validate everything before creating any remote or local files.
 const decoded=new Map();
 for(const f of backup.files){if(typeof f.data!=='string'||typeof f.id!=='string')throw Error('Invalid backup attachment.');const bytes=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));size+=bytes.length;if(size>100*1024*1024||bytes.length>25*1024*1024)throw Error('Backup attachment size limit exceeded.');decoded.set(f.id,new File([bytes],String(f.name||'attachment'),{type:String(f.type||'application/octet-stream')}));}
 for(const e of next.evidence)if(e.attachment&&!decoded.has(e.attachment.id))throw Error('This backup is missing attachments. Use a full backup.');
 const uploaded=[];
 try{
  for(const e of next.evidence)if(e.attachment){e.attachment=await store.upload(decoded.get(e.attachment.id));uploaded.push(e.attachment);}
  await store.save(next);
 }catch(error){await Promise.allSettled(uploaded.map(a=>store.removeFile(a)));throw error;}
 // Old files are retained so a failed download or an older backup can be recovered.
 return next;
}
