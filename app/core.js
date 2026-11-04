export const CYCLES = [
  {id:'induction',short:'Induction',name:'School Improvement and Implementation',intro:'Understand the programme, identify your development priorities and explore how change becomes sustained improvement.',topics:['Implementation'],steps:['Read your welcome pack and confirm your cohort schedule','Complete your initial needs analysis','Choose a school improvement focus','Arrange your first coaching conversation']},
  {id:'cycle1',short:'Cycle 01',name:'Ethical Principles and Leadership Behaviours',intro:'Connect your values to the decisions, relationships and behaviours of a school leader.',topics:['School culture','Governance and accountability'],steps:['Engage with the cycle event and online learning','Reflect on an ethical leadership dilemma','Complete your selected practice activities','Record feedback and next steps with your coach']},
  {id:'cycle2',short:'Cycle 02',name:'Leading Culture and Ethos',intro:'Build a shared culture that supports positive behaviour, professional learning and high expectations.',topics:['School culture','Behaviour','Professional development'],steps:['Engage with the cycle event and online learning','Complete your selected practice activities','Draft and review your formative assessment task','Discuss learning and impact with your coach']},
  {id:'cycle3',short:'Cycle 03',name:'Leading Teaching',intro:'Explore teaching, curriculum and assessment, with inclusion at the centre of school improvement.',topics:['Teaching','Curriculum and assessment','Additional and special educational needs and disabilities'],steps:['Engage with the cycle event and online learning','Complete your selected practice activities','Draft and review your formative assessment task','Discuss learning and impact with your coach']},
  {id:'cycle4',short:'Cycle 04',name:'Leading Organisational Effectiveness',intro:'Connect people, resources, partnerships and governance to the school’s educational priorities.',topics:['Organisational management','Working in partnership','Governance and accountability'],steps:['Engage with the cycle event and online learning','Complete your selected practice activities','Draft and review your formative assessment task','Discuss learning and impact with your coach']}
];
export const DOMAINS=['School culture','Teaching','Curriculum and assessment','Behaviour','Additional and special educational needs and disabilities','Professional development','Organisational management','Implementation','Working in partnership','Governance and accountability'];
export const SOURCES=[
 {title:'Best Practice Network · NPQH',type:'Programme',url:'https://www.bestpracticenet.co.uk/NPQH',note:'Programme overview and published learning cycles. Your cohort materials take priority.'},
 {title:'DfE · Headship framework',type:'Framework',url:'https://www.gov.uk/government/publications/national-professional-qualification-npq-headship-framework',note:'Official framework: use the original learn-that and learn-how-to statements when mapping your learning.'},
 {title:'GOV.UK · NPQH overview',type:'Guidance',url:'https://www.gov.uk/guidance/headship-national-professional-qualification',note:'National programme and assessment overview.'}
];
export const uid=()=>crypto.randomUUID();
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const wordCount=s=>(String(s).trim().match(/\S+/gu)||[]).length;
export function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function seed(){
 return {schema:1,settings:{name:'William',school:'',start:'',coach:'',portal:'',wordLimit:'',assessmentStart:'',assessmentDue:'',requirements:''},tasks:CYCLES.flatMap(c=>c.steps.map((title,i)=>({id:`${c.id}-${i}`,title,cycle:c.id,due:'',done:false,type:i===3?'Coaching':'Study',notes:''}))),reflections:[],evidence:[],sessions:[],reading:[],domains:Object.fromEntries(DOMAINS.map(d=>[d,{rating:'Not reviewed',notes:''}])),assessment:{analysis:'',response:'',review:''}};
}
export function stats(data){const tasks=data.tasks;return {done:tasks.filter(t=>t.done).length,total:tasks.length,percent:tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0,hours:Math.round(data.sessions.reduce((n,s)=>n+Number(s.minutes||0),0)/60*10)/10};}
export function validate(data){
 if(!data||data.schema!==1||!data.settings||typeof data.settings!=='object'||!data.assessment||!data.domains)throw Error('This is not a supported NPQH backup.');
 for(const key of ['tasks','reflections','evidence','sessions','reading']){
  if(!Array.isArray(data[key])||data[key].length>10000)throw Error(`Invalid ${key} in backup.`);
  const ids=new Set();
  for(const r of data[key]){if(!r||typeof r.id!=='string'||ids.has(r.id)||r.id.length>100)throw Error('Invalid or duplicate record ID.');ids.add(r.id);if(typeof r.title!=='string')throw Error('A record is missing its title.');}
 }
 for(const d of DOMAINS)if(!data.domains[d]||typeof data.domains[d].notes!=='string')throw Error('Invalid development review.');
 for(const k of ['analysis','response','review'])if(typeof data.assessment[k]!=='string')throw Error('Invalid assessment draft.');
 return data;
}
export function icsEvents(tasks){
 const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NPQH Companion//Study planner//EN','CALSCALE:GREGORIAN'];
 for(const t of tasks.filter(t=>/^\d{4}-\d{2}-\d{2}$/.test(t.due)&&!t.done))lines.push('BEGIN:VEVENT',`UID:${escape(t.id)}@npqh-companion`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${t.due.replaceAll('-','')}`,`SUMMARY:${escape(t.title)}`,`DESCRIPTION:${escape(t.notes||'')}`,'END:VEVENT');
 lines.push('END:VCALENDAR');
 // RFC 5545: fold at a UTF-8 byte boundary, including the continuation space.
 return lines.map(line=>{let out='',n=0;for(const c of line){const bytes=new TextEncoder().encode(c).length;if(n+bytes>75){out+='\r\n ';n=1;}out+=c;n+=bytes;}return out;}).join('\r\n')+'\r\n';
}
