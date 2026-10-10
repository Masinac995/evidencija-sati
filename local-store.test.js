const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
global.MonthlyHours=require('./monthly-logic.js');
global.crypto=webcrypto;
const store=require('./local-store.js');

(async()=>{
  store.resetForTests();store.initialize();
  assert.equal(store.isAdminConfigured(),false);
  await store.createAdmin('tajna123');
  await store.rpc('admin_save_worker',{p_admin_password:'tajna123',p_worker_name:'Petar Petrović',p_pin:'1234',p_hourly_rate:500,p_vacation_days:20});
  await store.rpc('submit_work_record',{p_worker_name:'Petar Petrović',p_pin:'1234',p_work_date:'2025-09-30',p_status:'Radio',p_time_in:'07:00',p_time_out:'15:00'});
  await store.rpc('submit_work_record',{p_worker_name:'Petar Petrović',p_pin:'1234',p_work_date:'2025-10-01',p_status:'Godišnji odmor',p_time_in:null,p_time_out:null});
  const card=await store.rpc('worker_card',{p_worker_name:'Petar Petrović',p_pin:'1234'});
  assert.equal(card.records.length,2);
  assert.equal(global.MonthlyHours.filterByMonth(card.records,'2025-09')[0].work_hours,8);
  await assert.rejects(()=>store.rpc('worker_card',{p_worker_name:'Petar Petrović',p_pin:'9999'}),/Pogrešan PIN/);
  const snapshot=await store.rpc('admin_snapshot',{p_admin_password:'tajna123'});
  assert.equal(snapshot.workers.length,1);assert.equal(snapshot.records.length,2);
  assert.ok(store.listArchives().some(a=>a.month==='2025-09'));
  const oldRate=store.listArchives().find(a=>a.month==='2025-09').workers[0].hourly_rate;
  await store.rpc('admin_update_worker',{p_admin_password:'tajna123',p_worker_name:'Petar Petrović',p_hourly_rate:900,p_vacation_days:20,p_pin:null});
  assert.equal(store.listArchives().find(a=>a.month==='2025-09').workers[0].hourly_rate,oldRate);
  const backup=store.exportBackup();assert.equal(backup.schema_version,3);assert.equal(backup.data.records.length,2);
  console.log('local storage tests: OK');
})().catch(error=>{console.error(error);process.exitCode=1});
