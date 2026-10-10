const assert=require('node:assert/strict');
const fs=require('node:fs');
global.MonthlyHours=require('./monthly-logic.js');
const excel=require('./excel-export.js');
const bytes=excel.build('2026-10',[{worker_name:'Ana',hourly_rate:600}],[{worker_name:'Ana',work_date:'2026-10-01',work_status:'Radio',time_in:'07:00',time_out:'15:00',work_hours:8,created_at:'2026-10-01T15:00:00Z'}]);
assert.equal(Buffer.from(bytes).subarray(0,2).toString(),'PK');
fs.writeFileSync('test-evidencija.xlsx',bytes);
console.log('excel export test: OK');
