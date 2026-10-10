(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MonthlyHours=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function pad(value){return String(value).padStart(2,'0')}
  function localDateISO(date=new Date()){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`}
  function currentMonth(date=new Date()){return `${date.getFullYear()}-${pad(date.getMonth()+1)}`}
  function monthKey(workDate){return /^\d{4}-\d{2}-\d{2}$/.test(String(workDate||''))?String(workDate).slice(0,7):''}
  function filterByMonth(records,month){return (records||[]).filter(record=>monthKey(record.work_date)===month)}
  function monthLabel(month){
    if(!/^\d{4}-\d{2}$/.test(String(month||'')))return 'nepoznat mesec';
    const [year,number]=month.split('-').map(Number);
    return new Intl.DateTimeFormat('sr-Latn-RS',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,number-1,1)));
  }
  function shiftMonth(month,offset){
    if(!/^\d{4}-\d{2}$/.test(String(month||'')))return currentMonth();
    const [year,number]=month.split('-').map(Number),date=new Date(Date.UTC(year,number-1+Number(offset||0),1));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}`;
  }
  function summarize(records){
    const map={};
    (records||[]).forEach(record=>{
      const name=record.worker_name||'Nepoznat radnik';
      map[name]??={hours:0,work:0,vac:0,sick:0,free:0};
      const row=map[name];
      if(record.work_status==='Radio'){row.hours+=Number(record.work_hours||0);row.work++}
      else if(record.work_status==='Godišnji odmor'){row.hours+=Number(record.work_hours||8);row.vac++}
      else if(record.work_status==='Bolovanje')row.sick++;
      else row.free++;
    });
    return map;
  }
  function annualVacationUsed(records,year){return (records||[]).filter(record=>String(record.work_date||'').startsWith(String(year)+'-')&&record.work_status==='Godišnji odmor').length}
  return {localDateISO,currentMonth,monthKey,filterByMonth,monthLabel,shiftMonth,summarize,annualVacationUsed};
});
