const assert=require('node:assert/strict');
const month=require('./monthly-logic.js');

const records=[
  {worker_name:'Ana',work_date:'2026-09-30',work_status:'Radio',work_hours:8},
  {worker_name:'Ana',work_date:'2026-10-01',work_status:'Radio',work_hours:7.5},
  {worker_name:'Ana',work_date:'2026-10-02',work_status:'Godišnji odmor',work_hours:0},
  {worker_name:'Milan',work_date:'2026-10-01',work_status:'Bolovanje',work_hours:0}
];

assert.equal(month.currentMonth(new Date(2026,9,1)),'2026-10');
assert.equal(month.localDateISO(new Date(2026,9,1)),'2026-10-01');
assert.equal(month.shiftMonth('2026-12',1),'2027-01');
assert.equal(month.shiftMonth('2026-01',-1),'2025-12');
assert.equal(month.filterByMonth(records,'2026-10').length,3);
assert.deepEqual(month.summarize(month.filterByMonth(records,'2026-10')),{
  Ana:{hours:15.5,work:1,vac:1,sick:0,free:0},
  Milan:{hours:0,work:0,vac:0,sick:1,free:0}
});
assert.equal(month.annualVacationUsed(records,2026),1);
console.log('monthly rollover tests: OK');
