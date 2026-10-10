(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ExcelExporter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const encoder=new TextEncoder();
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const col=n=>{let s='';for(let x=n;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s};
  const crcTable=(()=>{const table=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}return table})();
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
  function u16(n){return [n&255,(n>>>8)&255]}
  function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
  function zip(files){
    const local=[],central=[];let offset=0;
    for(const [name,content] of files){
      const n=encoder.encode(name),d=typeof content==='string'?encoder.encode(content):content,c=crc32(d);
      const header=new Uint8Array([80,75,3,4,20,0,0,8,0,0,0,0,0,0,...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),0,0,...n]);
      local.push(header,d);
      central.push(new Uint8Array([80,75,1,2,20,0,20,0,0,8,0,0,0,0,0,0,...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),0,0,0,0,0,0,0,0,0,0,0,0,...u32(offset),...n]));
      offset+=header.length+d.length;
    }
    const centralSize=central.reduce((s,x)=>s+x.length,0),end=new Uint8Array([80,75,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),0,0]);
    const parts=[...local,...central,end],out=new Uint8Array(parts.reduce((s,x)=>s+x.length,0));let at=0;for(const part of parts){out.set(part,at);at+=part.length}return out;
  }
  function cell(value,row,column,style=0){
    const ref=col(column)+row,s=` s="${style}"`;
    if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}"${s}><v>${value}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${s}><is><t>${esc(value)}</t></is></c>`;
  }
  function sheet(rows,widths,title){
    const body=rows.map((values,i)=>`<row r="${i+1}"${i===0?' ht="28" customHeight="1"':''}>${values.map((value,j)=>cell(value,i+1,j+1,i===0?1:i===1?2:0)).join('')}</row>`).join('');
    const cols=widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
    const max=col(Math.max(...rows.map(r=>r.length),1));
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${max}${Math.max(rows.length,1)}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A2:${max}${Math.max(rows.length,2)}"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  }
  function build(month,workers,records){
    const summary=root.MonthlyHours.summarize(records),byName=Object.entries(summary).sort((a,b)=>a[0].localeCompare(b[0],'sr'));
    const summaryRows=[[`MAŠINAC PLUS — ${root.MonthlyHours.monthLabel(month)}`],['Radnik','Radni dani','Obračunski sati','Cena/sat (RSD)','Obračun (RSD)','Odmor (dani)','Bolovanje','Slobodno']];
    for(const [name,x] of byName){const worker=workers.find(w=>w.worker_name===name)||{},rate=Number(worker.hourly_rate||0);summaryRows.push([name,x.work,x.hours,rate,Math.round(x.hours*rate*100)/100,x.vac,x.sick,x.free])}
    summaryRows.push(['UKUPNO',byName.reduce((s,[,x])=>s+x.work,0),byName.reduce((s,[,x])=>s+x.hours,0),'',byName.reduce((s,[name,x])=>{const w=workers.find(q=>q.worker_name===name)||{};return s+x.hours*Number(w.hourly_rate||0)},0),byName.reduce((s,[,x])=>s+x.vac,0),byName.reduce((s,[,x])=>s+x.sick,0),byName.reduce((s,[,x])=>s+x.free,0)]);
    const detailRows=[[`MAŠINAC PLUS — dnevni unosi — ${root.MonthlyHours.monthLabel(month)}`],['Radnik','Datum','Status','Dolazak','Odlazak','Sati','Vreme unosa']];
    [...records].sort((a,b)=>a.work_date.localeCompare(b.work_date)||a.worker_name.localeCompare(b.worker_name,'sr')).forEach(r=>detailRows.push([r.worker_name,r.work_date,r.work_status,r.time_in||'',r.time_out||'',Number(r.work_hours||0),r.created_at?new Date(r.created_at).toLocaleString('sr-RS'):'']));
    const files=[
      ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Mesečni sažetak" sheetId="1" r:id="rId1"/><sheet name="Dnevni unosi" sheetId="2" r:id="rId2"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="16"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D4ED8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD6DEEA"/></left><right style="thin"><color rgb="FFD6DEEA"/></right><top style="thin"><color rgb="FFD6DEEA"/></top><bottom style="thin"><color rgb="FFD6DEEA"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0"/><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>'],
      ['xl/worksheets/sheet1.xml',sheet(summaryRows,[28,13,12,16,18,12,13,12])],
      ['xl/worksheets/sheet2.xml',sheet(detailRows,[28,14,20,12,12,10,22])]
    ];
    return zip(files);
  }
  function download(month,workers,records){const bytes=build(month,workers,records),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));a.download=`evidencija-radnih-sati-${month}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  return {build,download,zip};
});
