(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.LocalHoursStore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const KEY='masinac-plus-evidencija-sati-v3';
  const memory={};
  const storage=()=>root.localStorage||{getItem:key=>memory[key]??null,setItem:(key,value)=>{memory[key]=String(value)}};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const empty=()=>({schema_version:3,admin_password_hash:null,workers:[],records:[],next_record_id:1,archives:{},last_active_month:root.MonthlyHours?.currentMonth?.()||''});
  function read(){try{return {...empty(),...JSON.parse(storage().getItem(KEY)||'null')}}catch{return empty()}}
  function write(data){try{storage().setItem(KEY,JSON.stringify(data));return data}catch(error){if(error?.name==='QuotaExceededError'||error?.code===22)throw new Error('Memorija pregledača je puna. Stari podaci su ostali sačuvani, ali novi unos nije dodat. Odmah sačuvajte mesečni ZIP/JSON na disk F i prebacite evidenciju u centralnu bazu.');throw error}}
  async function hash(value){
    const bytes=new TextEncoder().encode(String(value));
    if(root.crypto?.subtle){const digest=await root.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
    if(typeof require==='function')return require('node:crypto').createHash('sha256').update(bytes).digest('hex');
    throw new Error('Ovaj pregledač ne podržava bezbedno čuvanje lozinke.');
  }
  const currentMonth=()=>root.MonthlyHours.currentMonth();
  const monthKey=date=>root.MonthlyHours.monthKey(date);
  function normalizeWorker(worker){return {worker_name:String(worker.worker_name||'').trim(),pin_hash:worker.pin_hash||null,hourly_rate:Number(worker.hourly_rate||0),vacation_days:Number(worker.vacation_days??20),active:worker.active!==false}}
  function normalizeRecord(record,id){return {id:Number(record.id||id),worker_name:String(record.worker_name||''),work_date:String(record.work_date||''),work_status:String(record.work_status||''),time_in:record.time_in||null,time_out:record.time_out||null,work_hours:Number(record.work_hours||0),created_at:record.created_at||new Date().toISOString()}}
  function calculateHours(start,end){
    const parts=value=>String(value||'').split(':').map(Number),a=parts(start),b=parts(end);
    if(a.length<2||b.length<2||a.some(Number.isNaN)||b.some(Number.isNaN))throw new Error('Unesite ispravno vreme dolaska i odlaska.');
    let minutes=b[0]*60+b[1]-(a[0]*60+a[1]);if(minutes<=0)minutes+=24*60;
    if(minutes>18*60)throw new Error('Radno vreme ne može biti duže od 18 sati.');
    return Math.round(minutes/6)/10;
  }
  function rebuildArchives(data,activeMonth=currentMonth()){
    const months=[...new Set(data.records.map(r=>monthKey(r.work_date)).filter(Boolean))].filter(m=>m<activeMonth).sort();
    const archives={};
    for(const month of months){
      const records=data.records.filter(r=>monthKey(r.work_date)===month);
      const previous=data.archives?.[month];
      archives[month]={month,closed_at:previous?.closed_at||new Date().toISOString(),workers:clone(previous?.workers||data.workers),summary:root.MonthlyHours.summarize(records)};
    }
    data.archives=archives;data.last_active_month=activeMonth;return data;
  }
  function initialize(){const data=rebuildArchives(read());write(data);return clone(data)}
  const isAdminConfigured=()=>Boolean(read().admin_password_hash);
  async function createAdmin(password){if(String(password).length<4)throw new Error('Admin lozinka mora imati najmanje 4 znaka.');const data=read();if(data.admin_password_hash)throw new Error('Admin lozinka je već postavljena.');data.admin_password_hash=await hash(password);write(data);return true}
  async function requireAdmin(data,password){if(!data.admin_password_hash)throw new Error('ADMIN_NOT_CONFIGURED');if(await hash(password)!==data.admin_password_hash)throw new Error('Pogrešna admin lozinka.')}
  async function requireWorker(data,name,pin){const worker=data.workers.find(w=>w.worker_name===name&&w.active);if(!worker)throw new Error('Radnik nije pronađen.');if(!worker.pin_hash)throw new Error('Radniku prvo postavite novi PIN u administraciji.');if(await hash(pin)!==worker.pin_hash)throw new Error('Pogrešan PIN.');return worker}
  async function rpc(fn,p={}){
    const data=read();
    if(fn==='public_workers')return clone(data.workers.filter(w=>w.active).sort((a,b)=>a.worker_name.localeCompare(b.worker_name,'sr')).map(w=>({worker_name:w.worker_name})));
    if(fn==='submit_work_record'){
      await requireWorker(data,p.p_worker_name,p.p_pin);const status=p.p_status,date=p.p_work_date;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Datum nije ispravan.');
      const hours=status==='Radio'?calculateHours(p.p_time_in,p.p_time_out):0;
      let record=data.records.find(r=>r.worker_name===p.p_worker_name&&r.work_date===date);
      if(record)Object.assign(record,{work_status:status,time_in:status==='Radio'?p.p_time_in:null,time_out:status==='Radio'?p.p_time_out:null,work_hours:hours,created_at:new Date().toISOString()});
      else{record=normalizeRecord({worker_name:p.p_worker_name,work_date:date,work_status:status,time_in:status==='Radio'?p.p_time_in:null,time_out:status==='Radio'?p.p_time_out:null,work_hours:hours},data.next_record_id++);data.records.push(record)}
      write(rebuildArchives(data));return {message:record.id?'Dnevni unos je sačuvan.':'Podatak je sačuvan.'};
    }
    if(fn==='worker_card'){
      const worker=await requireWorker(data,p.p_worker_name,p.p_pin);return {vacation_days:worker.vacation_days,records:clone(data.records.filter(r=>r.worker_name===worker.worker_name).sort((a,b)=>b.work_date.localeCompare(a.work_date)))};
    }
    await requireAdmin(data,p.p_admin_password);
    if(fn==='admin_snapshot')return {workers:clone(data.workers),records:clone(data.records.sort((a,b)=>b.work_date.localeCompare(a.work_date)||a.worker_name.localeCompare(b.worker_name,'sr')))};
    if(fn==='admin_save_worker'){
      const name=String(p.p_worker_name||'').trim();if(!name||!/^[0-9]{4}$/.test(String(p.p_pin||'')))throw new Error('Unesite ime i PIN od 4 cifre.');
      let worker=data.workers.find(w=>w.worker_name===name);const pin_hash=await hash(p.p_pin);
      if(worker)Object.assign(worker,{pin_hash,hourly_rate:Number(p.p_hourly_rate||0),vacation_days:Number(p.p_vacation_days||0),active:true});else data.workers.push(normalizeWorker({worker_name:name,pin_hash,hourly_rate:p.p_hourly_rate,vacation_days:p.p_vacation_days,active:true}));
    }else if(fn==='admin_update_worker'){
      const worker=data.workers.find(w=>w.worker_name===p.p_worker_name);if(!worker)throw new Error('Radnik nije pronađen.');worker.hourly_rate=Number(p.p_hourly_rate||0);worker.vacation_days=Number(p.p_vacation_days||0);if(p.p_pin)worker.pin_hash=await hash(p.p_pin);
    }else if(fn==='admin_deactivate_worker'){
      const worker=data.workers.find(w=>w.worker_name===p.p_worker_name);if(worker)worker.active=false;
    }else if(fn==='admin_delete_record')data.records=data.records.filter(r=>r.id!==Number(p.p_record_id));
    else if(fn==='admin_delete_month'){
      const key=String(p.p_month||'');if(!/^\d{4}-\d{2}$/.test(key))throw new Error('Mesec nije ispravan.');if(key>=currentMonth())throw new Error('Tekući ili budući mesec ne može biti obrisan kao arhiva.');data.records=data.records.filter(r=>monthKey(r.work_date)!==key);delete data.archives[key];
    }
    else throw new Error('Nepoznata lokalna operacija: '+fn);
    write(rebuildArchives(data));return {ok:true};
  }
  async function importBackup(payload,adminPassword){
    const source=payload?.data&&payload.schema_version?payload.data:payload;
    if(!source||!Array.isArray(source.workers)||!Array.isArray(source.records))throw new Error('JSON kopija nema očekivanu listu radnika i unosa.');
    const existing=read();await requireAdmin(existing,adminPassword);
    const workers=source.workers.map(normalizeWorker),records=source.records.map((r,i)=>normalizeRecord(r,i+1));
    const data={...empty(),admin_password_hash:existing.admin_password_hash,workers,records,next_record_id:Math.max(0,...records.map(r=>r.id))+1,archives:{},last_active_month:currentMonth()};
    write(rebuildArchives(data));return {workers:workers.length,records:records.length,workers_missing_pin:workers.filter(w=>!w.pin_hash).length};
  }
  async function importLegacy(snapshot,adminPassword){return importBackup({workers:snapshot.workers||[],records:snapshot.records||[]},adminPassword)}
  function exportBackup(){const data=rebuildArchives(read());write(data);return {schema_version:3,exported_at:new Date().toISOString(),storage:'LOCAL_BROWSER',data:clone(data)}}
  function listArchives(){const data=rebuildArchives(read());write(data);return Object.values(data.archives).sort((a,b)=>b.month.localeCompare(a.month)).map(archive=>clone({...archive,records:data.records.filter(r=>monthKey(r.work_date)===archive.month)}))}
  function storageStats(){const raw=storage().getItem(KEY)||'',estimated_bytes=raw.length*2,conservative_limit_bytes=5*1024*1024;return {estimated_bytes,conservative_limit_bytes,percent:Math.min(100,Math.round(estimated_bytes/conservative_limit_bytes*100)),records:read().records.length}}
  async function adoptLegacyPin(workerName,pin){
    if(!/^[0-9]{4}$/.test(String(pin||'')))throw new Error('PIN mora imati tačno 4 cifre.');
    const data=read(),worker=data.workers.find(w=>w.worker_name===workerName&&w.active);if(!worker)throw new Error('Radnik nije pronađen.');
    if(!worker.pin_hash){worker.pin_hash=await hash(pin);write(data)}return true;
  }
  function resetForTests(){storage().setItem(KEY,JSON.stringify(empty()))}
  return {initialize,isAdminConfigured,createAdmin,rpc,importBackup,importLegacy,exportBackup,listArchives,storageStats,adoptLegacyPin,resetForTests,calculateHours};
});
