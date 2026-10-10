const LEGACY_SUPABASE_URL='https://hzzlmnsubsrwaqhvugcv.supabase.co';
const LEGACY_SUPABASE_ANON_KEY='sb_publishable_HDT3J5jQchOUM083dcpYow_UoB9ZU9q';
const db=window.LocalHoursStore,month=window.MonthlyHours;
let adminData={workers:[],records:[]};
const el=id=>document.getElementById(id);
function message(text,type='info'){el('status').className='notice status '+type;el('status').textContent=text}
function busy(on){document.body.classList.toggle('spinner',on)}
function show(id){['entry','card','admin'].forEach(x=>el(x).classList.toggle('hidden',x!==id));if(id==='card')el('cardResult').innerHTML=''}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const rpc=(fn,params={})=>db.rpc(fn,params);
async function legacyRpc(fn,params={}){
  const response=await fetch(`${LEGACY_SUPABASE_URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:LEGACY_SUPABASE_ANON_KEY,Authorization:`Bearer ${LEGACY_SUPABASE_ANON_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(params)});
  const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}
  if(!response.ok)throw new Error(data?.message||data?.error||raw||'Stara baza nije dostupna.');return data;
}
async function ensureWorkerPin(name,pin){
  try{return await rpc('worker_card',{p_worker_name:name,p_pin:pin})}
  catch(error){if(!String(error.message).includes('prvo postavite novi PIN'))throw error;const legacy=await legacyRpc('worker_card',{p_worker_name:name,p_pin:pin});await db.adoptLegacyPin(name,pin);return legacy}
}
function fillHours(){for(let h=0;h<24;h++){const v=String(h).padStart(2,'0')+':00';el('timeIn').add(new Option(v,v,false,h===7));el('timeOut').add(new Option(v,v,false,h===15))}}
function toggleTimes(){document.querySelectorAll('.time').forEach(x=>x.classList.toggle('hidden',el('workStatus').value!=='Radio'))}
async function loadWorkers(){try{const rows=await rpc('public_workers');['worker','cardWorker'].forEach(id=>{const s=el(id);s.innerHTML='<option value="">-- Izaberite --</option>';rows.forEach(r=>s.add(new Option(r.worker_name,r.worker_name)))});message('Lokalna evidencija je spremna. Podaci ostaju na ovom uređaju.','ok')}catch(e){message(e.message,'err')}}
async function submitEntry(){
  const name=el('worker').value,pin=el('entryPin').value,date=el('date').value,status=el('workStatus').value;
  if(!name||!/^[0-9]{4}$/.test(pin)||!date)return alert('Izaberite radnika, datum i unesite tačan četvorocifreni PIN.');
  try{busy(true);await ensureWorkerPin(name,pin);const result=await rpc('submit_work_record',{p_worker_name:name,p_pin:pin,p_work_date:date,p_status:status,p_time_in:status==='Radio'?el('timeIn').value:null,p_time_out:status==='Radio'?el('timeOut').value:null});message(result.message,'ok');el('entryPin').value='';alert(result.message)}catch(e){message(e.message,'err');alert(e.message)}finally{busy(false)}
}
async function loadWorkerCard(){
  const name=el('cardWorker').value,pin=el('cardPin').value;if(!name||!/^[0-9]{4}$/.test(pin))return alert('Izaberite ime i unesite PIN.');
  try{busy(true);const d=await ensureWorkerPin(name,pin),all=d.records||[],current=month.currentMonth(),previous=month.shiftMonth(current,-1),currentRecords=month.filterByMonth(all,current),previousRecords=month.filterByMonth(all,previous),now=month.summarize(currentRecords)[name]||{hours:0,work:0,vac:0,sick:0,free:0},old=month.summarize(previousRecords)[name]||{hours:0,work:0,vac:0,sick:0,free:0},year=Number(current.slice(0,4)),used=month.annualVacationUsed(all,year);
    el('cardResult').innerHTML=`<div class="notice ok" style="margin-top:15px"><b>${esc(name)} — tekući mesec</b><br><b>${esc(month.monthLabel(current))}</b><br>Radni dani: <b>${now.work}</b> · Radni sati: <b>${now.hours}</b><br>Godišnji odmor ovog meseca: <b>${now.vac}</b> · Bolovanje: <b>${now.sick}</b> · Slobodno: <b>${now.free}</b><br>Godišnji odmor ${year}: iskorišćeno <b>${used}</b>, preostalo <b>${Math.max(Number(d.vacation_days||0)-used,0)}</b></div><div class="notice info" style="margin-top:12px"><b>Prethodni završeni mesec — ${esc(month.monthLabel(previous))}</b><br>Radni dani: <b>${old.work}</b> · Radni sati: <b>${old.hours}</b><br>Godišnji odmor: <b>${old.vac}</b> · Bolovanje: <b>${old.sick}</b> · Slobodno: <b>${old.free}</b></div><h3>Dnevni unosi tekućeg meseca</h3>${recordsTable(currentRecords)}`;el('cardPin').value='';message('Kartica tekućeg i prethodnog meseca je učitana.','ok')
  }catch(e){el('cardResult').innerHTML='';message(e.message,'err');alert(e.message)}finally{busy(false)}
}
function openAdmin(){show('admin');el('adminPassword').focus()}
async function loadAdmin(){
  const pass=el('adminPassword').value;if(!pass)return alert('Unesite admin lozinku.');
  try{busy(true);if(!db.isAdminConfigured()){if(pass.length<4)throw new Error('Prva admin lozinka mora imati najmanje 4 znaka.');await db.createAdmin(pass);
      try{const snapshot=await legacyRpc('admin_snapshot',{p_admin_password:pass}),result=await db.importLegacy(snapshot,pass);alert(`Lokalna baza je napravljena i stari podaci su automatski prebačeni: ${result.workers} radnika i ${result.records} unosa. Radnici nastavljaju da koriste postojeće PIN kodove.`)}
      catch{alert('Lokalna baza je napravljena. Stara baza nije uvezena jer lozinka nije ista ili servis nije dostupan; uvoz možete ponoviti dugmetom u administraciji.')}
    }
    adminData=await rpc('admin_snapshot',{p_admin_password:pass});renderAdmin();renderArchives();el('adminContent').classList.remove('hidden');await refreshBackupFolderStatus();message('Lokalna baza je učitana.','ok')
  }catch(e){el('adminContent').classList.add('hidden');message(e.message,'err');alert(e.message)}finally{busy(false)}
}
const adminPass=()=>el('adminPassword').value;
function renderAdmin(){
  const selected=el('adminMonth').value||month.currentMonth(),records=month.filterByMonth(adminData.records||[],selected),label=month.monthLabel(selected);
  el('workersBody').innerHTML=(adminData.workers||[]).map((w,i)=>`<tr><td><b>${esc(w.worker_name)}</b>${w.active===false?' <span class="tag">neaktivan</span>':''}</td><td><input id="rate${i}" type="number" step="0.01" value="${Number(w.hourly_rate||0)}"></td><td><input id="vac${i}" type="number" min="0" value="${Number(w.vacation_days||0)}"></td><td><input id="pin${i}" type="password" inputmode="numeric" maxlength="4" placeholder="bez promene"></td><td><button class="small green" onclick="updateWorker('${encodeURIComponent(w.worker_name)}',${i})">Sačuvaj</button><button class="small red" onclick="removeWorker('${encodeURIComponent(w.worker_name)}')">Ukloni</button></td></tr>`).join('');
  el('recordsTitle').textContent='Evidencija — '+label;el('summaryTitle').textContent='Mesečni sažetak — '+label;
  el('recordsBody').innerHTML=records.map(r=>`<tr><td>${esc(r.worker_name)}</td><td>${esc(r.work_date)}</td><td>${esc(r.work_status)}</td><td>${r.work_status==='Radio'?`${esc(r.time_in)}–${esc(r.time_out)} (${Number(r.work_hours)} h)`:''}</td><td><button class="small red" onclick="removeRecord(${Number(r.id)})">Obriši</button></td></tr>`).join('')||'<tr><td colspan="5">Nema podataka za izabrani mesec.</td></tr>';
  renderSummary(records,workersForMonth(selected));
}
function workersForMonth(key){return db.listArchives().find(a=>a.month===key)?.workers||adminData.workers||[]}
function renderSummary(records,workers){const map=month.summarize(records),rows=Object.entries(map).map(([n,x])=>{const w=workers.find(q=>q.worker_name===n)||{},pay=x.hours*Number(w.hourly_rate||0);return `<tr><td>${esc(n)}</td><td>${x.work}</td><td>${x.hours}</td><td>${Number(w.hourly_rate||0).toFixed(2)}</td><td>${pay.toFixed(2)}</td><td>${x.vac}</td><td>${x.sick}</td><td>${x.free}</td></tr>`}).join('')||'<tr><td colspan="8">Nema podataka za izabrani mesec.</td></tr>';el('summary').innerHTML='<div class="scroll"><table><thead><tr><th>Radnik</th><th>Radni dani</th><th>Sati</th><th>Cena/sat</th><th>Obračun</th><th>Odmor</th><th>Bolovanje</th><th>Slobodno</th></tr></thead><tbody>'+rows+'</tbody></table></div>'}
function changeAdminMonth(offset){el('adminMonth').value=month.shiftMonth(el('adminMonth').value||month.currentMonth(),offset);if(!el('adminContent').classList.contains('hidden'))renderAdmin()}
function setCurrentAdminMonth(){el('adminMonth').value=month.currentMonth();if(!el('adminContent').classList.contains('hidden'))renderAdmin()}
async function saveWorker(){const n=el('newName').value.trim(),p=el('newPin').value,v=Number(el('newVacation').value||0);if(!n||!/^[0-9]{4}$/.test(p))return alert('Unesite ime i PIN od 4 cifre.');await adminAction('admin_save_worker',{p_worker_name:n,p_pin:p,p_hourly_rate:0,p_vacation_days:v},'Radnik je dodat.');el('newName').value='';el('newPin').value=''}
async function updateWorker(encoded,i){const pin=el('pin'+i).value;if(pin&&!/^[0-9]{4}$/.test(pin))return alert('Novi PIN mora imati tačno 4 cifre.');await adminAction('admin_update_worker',{p_worker_name:decodeURIComponent(encoded),p_hourly_rate:Number(el('rate'+i).value||0),p_vacation_days:Number(el('vac'+i).value||0),p_pin:pin||null},'Podaci su sačuvani.')}
async function removeWorker(encoded){const n=decodeURIComponent(encoded);if(confirm(`Ukloniti radnika ${n}? Ranija evidencija ostaje sačuvana.`))await adminAction('admin_deactivate_worker',{p_worker_name:n},'Radnik je uklonjen sa aktivnog spiska.')}
async function removeRecord(id){if(confirm('Obrisati ovaj unos?'))await adminAction('admin_delete_record',{p_record_id:id},'Unos je obrisan.')}
async function adminAction(fn,params,msg){try{busy(true);await rpc(fn,{p_admin_password:adminPass(),...params});message(msg,'ok');await loadAdmin();await loadWorkers()}catch(e){message(e.message,'err');alert(e.message)}finally{busy(false)}}
function recordsTable(rows){return `<div class="scroll" style="margin-top:12px"><table><thead><tr><th>Datum</th><th>Status</th><th>Vreme</th><th>Sati</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.work_date)}</td><td>${esc(r.work_status)}</td><td>${r.work_status==='Radio'?`${esc(r.time_in)}–${esc(r.time_out)}`:''}</td><td>${Number(r.work_hours||0)}</td></tr>`).join('')||'<tr><td colspan="4">Nema unosa.</td></tr>'}</tbody></table></div>`}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"'}
function csvFor(records){const head=['Radnik','Datum','Status','Dolazak','Odlazak','Sati','Vreme unosa'],rows=records.map(r=>[r.worker_name,r.work_date,r.work_status,r.time_in||'',r.time_out||'',r.work_hours||0,r.created_at]);return '\uFEFF'+[head,...rows].map(x=>x.map(csvCell).join(';')).join('\r\n')}
function exportCSV(selected=el('adminMonth').value||month.currentMonth()){download(`evidencija-${selected}.csv`,csvFor(month.filterByMonth(adminData.records||[],selected)),'text/csv;charset=utf-8')}
function exportExcel(selected=el('adminMonth').value||month.currentMonth()){ExcelExporter.download(selected,workersForMonth(selected),month.filterByMonth(adminData.records||[],selected))}
function exportJSON(){download(`evidencija-kompletna-kopija-${month.localDateISO()}.json`,JSON.stringify(db.exportBackup(),null,2),'application/json')}
async function configureBackupFolder(){try{const handle=await FolderBackupStore.chooseFolder();el('folderStatus').className='notice ok';el('folderStatus').textContent=`Povezan folder: ${handle.name}. Mesečne kopije idu na disk F.`}catch(error){if(error.name!=='AbortError')alert(error.message)}}
async function refreshBackupFolderStatus(){if(!el('folderStatus'))return;const name=await FolderBackupStore.configuredName();el('folderStatus').className='notice '+(name?'ok':'info');el('folderStatus').textContent=name?`Povezan folder: ${name}. Mesečne kopije idu na disk F.`:'Folder na disku F još nije povezan.'}
async function saveMonthlyPackage(selected=el('adminMonth').value||month.currentMonth()){
  const records=month.filterByMonth(adminData.records||[],selected),workers=workersForMonth(selected),xlsx=ExcelExporter.build(selected,workers,records),backup=JSON.stringify(db.exportBackup(),null,2),instructions=`MAŠINAC PLUS — mesečna evidencija ${month.monthLabel(selected)}\r\n\r\nExcel: pregled i štampa mesečnog obračuna.\r\nCSV: jednostavna tabela za dalju obradu.\r\nJSON: kompletna rezervna kopija za vraćanje podataka u aplikaciju.\r\n`;
  const archive=ExcelExporter.zip([[`evidencija-${selected}.xlsx`,xlsx],[`evidencija-${selected}.csv`,csvFor(records)],[`kompletna-rezervna-kopija-${month.localDateISO()}.json`,backup],['PROCITAJ-ME.txt',instructions]]);
  const filename=`MASINAC-evidencija-${selected}.zip`;
  try{const path=await FolderBackupStore.save(selected,filename,archive);message(`Mesečni paket je sačuvan: ${path}`,'ok');await refreshBackupFolderStatus()}
  catch(error){if(error.name==='AbortError')return;if(!FolderBackupStore.supported()){download(filename,archive,'application/zip');message('Pregledač ne podržava direktan upis na disk F; paket je preuzet u Downloads.','info')}else{message(error.message,'err');alert(error.message)}}
}
function renderArchives(){const rows=db.listArchives();el('archives').innerHTML=rows.length?rows.map(a=>`<div class="archive-row"><b>${esc(month.monthLabel(a.month))}</b><span>${a.records.length} unosa</span><button class="small green" onclick="saveMonthlyPackage('${a.month}')">Sačuvaj sve</button><button class="small gray" onclick="exportArchiveExcel('${a.month}')">Excel</button></div>`).join(''):'<p class="muted">Arhiva će se automatski pojaviti kada započne novi mesec.</p>'}
function exportArchiveExcel(key){const a=db.listArchives().find(x=>x.month===key);if(a)ExcelExporter.download(key,a.workers,a.records)}
function exportArchiveCSV(key){const a=db.listArchives().find(x=>x.month===key);if(a)download(`evidencija-${key}.csv`,csvFor(a.records),'text/csv;charset=utf-8')}
function chooseJSON(){el('jsonFile').click()}
async function importJSON(input){const file=input.files?.[0];if(!file)return;try{const result=await db.importBackup(JSON.parse(await file.text()),adminPass());alert(`Kopija je uvezena: ${result.workers} radnika i ${result.records} unosa.`);await loadAdmin();await loadWorkers()}catch(e){alert(e.message)}finally{input.value=''}}
async function importLegacy(){if(!confirm('Uvesti postojeće radnike i unose iz stare centralne baze? Lokalni podaci biće zamenjeni.'))return;const oldPass=prompt('Unesite admin lozinku stare baze:');if(!oldPass)return;try{busy(true);const snapshot=await legacyRpc('admin_snapshot',{p_admin_password:oldPass}),result=await db.importLegacy(snapshot,adminPass());alert(`Uvezeno je ${result.workers} radnika i ${result.records} unosa. Radnici nastavljaju da koriste iste PIN kodove; pri prvoj upotrebi PIN će biti potvrđen preko stare baze.`);await loadAdmin();await loadWorkers()}catch(e){alert(e.message)}finally{busy(false)}}

db.initialize();el('date').value=month.localDateISO();el('adminMonth').value=month.currentMonth();fillHours();toggleTimes();loadWorkers();
